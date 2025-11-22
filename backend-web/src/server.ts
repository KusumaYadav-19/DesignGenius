import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

import { parseFigmaNodes } from './figma-parser.js';
import type { FigmaNode } from './figma-parser.js';
import { generateDesignTokens } from './tokens-generator.js';
import { generateCode } from './code-generator.js';
import { generateSOP } from './sop-generator.js';
import { generateDesignKit } from './designkit-generator.js';
import {
  analyzeLayers,
  detectComponents,
  generateNamingSuggestions,
  generateAccessibilityReport,
} from './mcp-agent.js';
import {
  extractFileKeyFromUrl,
  getFileInfo,
  getPageNodes,
  getPagesFromFile,
  type FigmaPage,
} from './figma-api-service.js';
import { convertApiNodeToInternal } from './figma-api-converter.js';
import { createAnalysis } from './db.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/file-info
 * Extract file key from URL and get file information with pages list
 * Body: { fileUrl: string }
 */
app.post('/api/file-info', async (req, res) => {
  try {
    const { fileUrl, accessToken } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'fileUrl is required',
      });
    }

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required in request body',
      });
    }

    console.log('Extracting file key from URL:', fileUrl);
    const fileKey = extractFileKeyFromUrl(fileUrl);
    
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Figma URL. Expected format: https://www.figma.com/file/{fileKey}/... or https://www.figma.com/design/{fileKey}/...',
      });
    }

    console.log('Fetching file info for key:', fileKey);
    
    let fileInfo;
    try {
      fileInfo = await getFileInfo(fileKey, accessToken);
    } catch (apiError: any) {
      // Check for permission/access errors
      if (apiError.message?.includes('403') || apiError.message?.includes('Forbidden')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. This file is not shared with your account or is private. Please ask the file owner to share it with you, or make the file public.',
          errorCode: 'PERMISSION_DENIED',
        });
      }
      if (apiError.message?.includes('404') || apiError.message?.includes('Not Found')) {
        return res.status(404).json({
          success: false,
          error: 'File not found. Please check that the URL is correct and the file exists.',
          errorCode: 'FILE_NOT_FOUND',
        });
      }
      throw apiError;
    }
    
    const pages = getPagesFromFile(fileInfo);

    console.log(`Found ${pages.length} pages in file`);

    res.json({
      success: true,
      fileKey,
      fileName: fileInfo.name,
      pages: pages.map((page) => ({
        id: page.id,
        name: page.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching file info:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/analyse-page
 * Analyze a specific page from a Figma file
 * Body: { fileUrl: string, pageId: string }
 */
app.post('/api/analyse-page', async (req, res) => {
  const sessionId = `session-${Date.now()}`;
  
  try {
    const { fileUrl, pageId, accessToken } = req.body;

    if (!fileUrl || !pageId) {
      return res.status(400).json({
        success: false,
        error: 'fileUrl and pageId are required',
        sessionId,
      });
    }

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required in request body',
        sessionId,
      });
    }

    console.log('Analysis started for page:', pageId);
    
    // Extract file key from URL
    const fileKey = extractFileKeyFromUrl(fileUrl);
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Figma URL. Expected format: https://www.figma.com/file/{fileKey}/... or https://www.figma.com/design/{fileKey}/...',
        sessionId,
      });
    }

    // Get file info to find the page
    console.log('Fetching file info...');
    
    let fileInfo;
    try {
      fileInfo = await getFileInfo(fileKey, accessToken);
    } catch (apiError: any) {
      // Check for permission/access errors
      if (apiError.message?.includes('403') || apiError.message?.includes('Forbidden')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. This file is not shared with your account or is private. Please ask the file owner to share it with you, or make the file public.',
          errorCode: 'PERMISSION_DENIED',
          sessionId,
        });
      }
      if (apiError.message?.includes('404') || apiError.message?.includes('Not Found')) {
        return res.status(404).json({
          success: false,
          error: 'File not found. Please check that the URL is correct and the file exists.',
          errorCode: 'FILE_NOT_FOUND',
          sessionId,
        });
      }
      throw apiError;
    }
    
    const pages = getPagesFromFile(fileInfo);
    
    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: `Page with id ${pageId} not found in file`,
        sessionId,
      });
    }

    // Use the page children directly from the file info
    // The file info response includes the full document structure
    if (!page.children || page.children.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No nodes found in the selected page',
        sessionId,
      });
    }

    console.log(`Found ${page.children.length} top-level nodes in page`);
    console.log('Converting API nodes to internal format...');
    
    // Convert API nodes to internal format
    const nodes: FigmaNode[] = page.children.map(convertApiNodeToInternal);

    console.log('1. Parsing Figma nodes');
    const parsedDesign = parseFigmaNodes(nodes);
    
    console.log('2. Running AI analysis');
    const [analysis, components, namingSuggestions] = await Promise.all([
      analyzeLayers(nodes, parsedDesign),
      detectComponents(nodes),
      generateNamingSuggestions(nodes),
    ]);

    console.log('3. Generating design tokens');
    const tokens = generateDesignTokens(parsedDesign);
    
    console.log('4. Generating code');
    const code = generateCode(nodes, tokens);
    
    console.log('5. Generating accessibility report');
    const accessibilityReport = await generateAccessibilityReport(nodes, tokens);
    
    console.log('6. Generating SOP document');
    const sop = await generateSOP(
      tokens,
      analysis,
      accessibilityReport,
      components,
      nodes
    );
    
    console.log('7. Generating DesignKit document');
    const designKit = await generateDesignKit(
      tokens,
      analysis,
      accessibilityReport,
      components,
      sop.fullDocument
    );

    const result: {
      success: boolean;
      sessionId: string;
      timestamp: string;
      fileKey: string;
      pageId: string;
      pageName: string;
      analysis: {
        summary: string;
        recommendations: string[];
        issues: string[];
        strengths: string[];
      };
      components: any[];
      namingSuggestions: any[];
      tokens: any;
      code: {
        reactComponent: string;
        tailwindConfig: string;
        componentExample: string;
      };
      accessibility: any;
      sop: {
        title: string;
        userJourney: {
          userStories: string[];
        };
        featureBreakout: {
          description: string;
          features: any[];
        };
        lld: {
          description: string;
          diagrams: any[];
        };
        fullDocument: string;
      };
      designKit: {
        title: string;
        subtitle: string;
        typography: any;
        iconography: any;
        spacingSystem: any;
        colorSystem: any;
        gridAndLayout: any;
        fullDocument: string;
      };
      outputPath?: string;
      files?: Record<string, string>;
    } = {
      success: true,
      sessionId,
      timestamp: new Date().toISOString(),
      fileKey,
      pageId,
      pageName: page.name,
      analysis: {
        summary: analysis.summary,
        recommendations: analysis.recommendations,
        issues: analysis.issues,
        strengths: analysis.strengths,
      },
      components,
      namingSuggestions,
      tokens,
      code: {
        reactComponent: code.reactComponent,
        tailwindConfig: code.tailwindConfig,
        componentExample: code.componentExample,
      },
      accessibility: accessibilityReport,
      sop: {
        title: sop.title,
        userJourney: sop.userJourney,
        featureBreakout: sop.featureBreakout,
        lld: sop.lld,
        fullDocument: sop.fullDocument,
      },
      designKit: {
        title: designKit.title,
        subtitle: designKit.subtitle,
        typography: designKit.typography,
        iconography: designKit.iconography,
        spacingSystem: designKit.spacingSystem,
        colorSystem: designKit.colorSystem,
        gridAndLayout: designKit.gridAndLayout,
        fullDocument: designKit.fullDocument,
      },
    };

    console.log('Analysis completed successfully');
    
    // Save results to files
    const outputPath = path.join(OUTPUT_DIR, sessionId);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    try {
      // Save complete results as JSON
      fs.writeFileSync(
        path.join(outputPath, 'analysis-results.json'),
        JSON.stringify(result, null, 2),
        'utf-8'
      );
      
      // Save design tokens
      fs.writeFileSync(
        path.join(outputPath, 'design-tokens.json'),
        JSON.stringify(tokens, null, 2),
        'utf-8'
      );
      
      // Save React component
      fs.writeFileSync(
        path.join(outputPath, 'Component.tsx'),
        code.reactComponent,
        'utf-8'
      );
      
      // Save Tailwind config
      fs.writeFileSync(
        path.join(outputPath, 'tailwind.config.js'),
        code.tailwindConfig,
        'utf-8'
      );
      
      // Save component example
      fs.writeFileSync(
        path.join(outputPath, 'ExampleComponent.tsx'),
        code.componentExample,
        'utf-8'
      );
      
      // Save SOP document as markdown
      fs.writeFileSync(
        path.join(outputPath, 'SOP.md'),
        sop.fullDocument,
        'utf-8'
      );
      
      // Save accessibility report
      fs.writeFileSync(
        path.join(outputPath, 'accessibility-report.json'),
        JSON.stringify(accessibilityReport, null, 2),
        'utf-8'
      );
      
      // Save components list
      fs.writeFileSync(
        path.join(outputPath, 'components.json'),
        JSON.stringify(components, null, 2),
        'utf-8'
      );
      
      // Save naming suggestions
      fs.writeFileSync(
        path.join(outputPath, 'naming-suggestions.json'),
        JSON.stringify(namingSuggestions, null, 2),
        'utf-8'
      );
      
      // Save DesignKit document as markdown
      fs.writeFileSync(
        path.join(outputPath, 'DesignKit.md'),
        designKit.fullDocument,
        'utf-8'
      );
      
      console.log(`Results saved to: ${outputPath}`);
      
      // Add output path to response
      result.outputPath = outputPath;
      result.files = {
        analysisResults: 'analysis-results.json',
        designTokens: 'design-tokens.json',
        reactComponent: 'Component.tsx',
        tailwindConfig: 'tailwind.config.js',
        componentExample: 'ExampleComponent.tsx',
        sop: 'SOP.md',
        accessibilityReport: 'accessibility-report.json',
        components: 'components.json',
        namingSuggestions: 'naming-suggestions.json',
        designKit: 'DesignKit.md',
      };
    } catch (fileError) {
      console.error('Error saving files:', fileError);
      // Continue even if file saving fails
    }

    // Save to database
    try {
      const dbRecord = await createAnalysis(fileUrl, accessToken, sessionId, fileKey, pageId, page.name);
      console.log(`✅ Analysis saved to database with ID: ${dbRecord.id}`);
    } catch (dbError) {
      console.error('⚠️ Error saving to database:', dbError instanceof Error ? dbError.message : String(dbError));
      // Continue even if database save fails - don't break the response
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error during analysis:', error instanceof Error ? error.message : String(error));

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Express server started');
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/file-info');
  console.log('  POST /api/analyse-page');
});

