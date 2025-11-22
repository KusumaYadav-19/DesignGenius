import 'dotenv/config';
import OpenAI from 'openai';
import type { FigmaNode, ParsedDesign } from './figma-parser.js';
import type { DesignTokens } from './tokens-generator.js';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface AnalysisResult {
  summary: string;
  recommendations: string[];
  issues: string[];
  strengths: string[];
}

export interface ComponentDetection {
  componentName: string;
  nodeIds: string[];
  description: string;
  props: string[];
}

export interface NamingSuggestion {
  nodeId: string;
  currentName: string;
  suggestedName: string;
  reason: string;
}

export interface AccessibilityIssue {
  nodeId: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  recommendation: string;
}

export interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
  summary: string;
}

export async function analyzeLayers(nodes: FigmaNode[], parsedDesign: ParsedDesign): Promise<AnalysisResult> {
  if (!openai) {
    console.warn('OpenAI API key not set, returning default analysis');
    return {
      summary: 'AI analysis unavailable. Please set OPENAI_API_KEY environment variable.',
      recommendations: ['Set up OpenAI API key for AI-powered analysis'],
      issues: ['OpenAI API key not configured'],
      strengths: ['Design structure parsed successfully'],
    };
  }
  
  try {
    const nodesSummary = JSON.stringify(nodes.slice(0, 10).map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
    })), null, 2);

    const designSummary = {
      textStyles: parsedDesign.textStyles.length,
      colors: parsedDesign.colors.length,
      autoLayouts: parsedDesign.autoLayouts.length,
      spacing: parsedDesign.spacing.length,
    };

    const prompt = `Analyze this Figma design structure and provide insights:

Nodes (sample):
${nodesSummary}

Design Statistics:
${JSON.stringify(designSummary, null, 2)}

Provide:
1. A brief summary of the design structure
2. Top 5 recommendations for improvement
3. Any issues or inconsistencies found
4. Design strengths

Format as JSON:
{
  "summary": "string",
  "recommendations": ["string"],
  "issues": ["string"],
  "strengths": ["string"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a design system expert analyzing Figma designs. Provide concise, actionable feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as AnalysisResult;
    return analysis;
  } catch (error) {
    console.error('Error in analyzeLayers:', error instanceof Error ? error.message : String(error));
    
    return {
      summary: 'Analysis could not be completed due to an error.',
      recommendations: ['Review design manually', 'Check API configuration'],
      issues: ['Analysis service unavailable'],
      strengths: [],
    };
  }
}

export async function detectComponents(nodes: FigmaNode[]): Promise<ComponentDetection[]> {
  if (!openai) {
    console.warn('OpenAI API key not set, returning empty components');
    return [];
  }
  
  try {
    const nodesData = nodes.slice(0, 20).map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      hasChildren: !!n.children && n.children.length > 0,
    }));

    const prompt = `Analyze these Figma nodes and identify reusable components:

${JSON.stringify(nodesData, null, 2)}

For each potential component, provide:
- componentName: Suggested React component name
- nodeIds: Array of related node IDs
- description: What this component does
- props: Array of suggested props

Format as JSON array:
[
  {
    "componentName": "string",
    "nodeIds": ["string"],
    "description": "string",
    "props": ["string"]
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a frontend developer identifying reusable components from design files.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    const components = Array.isArray(result) ? result : (result.components || []);
    
    return components as ComponentDetection[];
  } catch (error) {
    console.error('Error in detectComponents:', error instanceof Error ? error.message : String(error));
    
    return [];
  }
}


export async function generateNamingSuggestions(nodes: FigmaNode[]): Promise<NamingSuggestion[]> {
  if (!openai) {
    console.warn('OpenAI API key not set, returning empty suggestions');
    return [];
  }
  
  try {
    const nodesData = nodes.slice(0, 30).map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
    }));

    const prompt = `Review these Figma node names and suggest better naming conventions:

${JSON.stringify(nodesData, null, 2)}

For each node with a poor name, suggest:
- currentName: Current name
- suggestedName: Better name following React/PascalCase conventions
- reason: Why the change is needed

Format as JSON array:
[
  {
    "nodeId": "string",
    "currentName": "string",
    "suggestedName": "string",
    "reason": "string"
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a code reviewer suggesting better naming conventions for design components.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    const suggestions = Array.isArray(result) ? result : (result.suggestions || []);
    
    return suggestions as NamingSuggestion[];
  } catch (error) {
    console.error('Error in generateNamingSuggestions:', error instanceof Error ? error.message : String(error));
    
    return [];
  }
}

export async function generateAccessibilityReport(nodes: FigmaNode[], tokens: DesignTokens): Promise<AccessibilityReport> {
  // Check API key at runtime to ensure it's loaded from environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not set, returning default accessibility report');
    return {
      score: 0,
      issues: [{
        nodeId: 'system',
        issue: 'AI accessibility analysis unavailable',
        severity: 'warning',
        recommendation: 'Set OPENAI_API_KEY environment variable for AI-powered accessibility analysis',
      }],
      summary: 'Accessibility analysis requires OpenAI API key configuration.',
    };
  }

  // Re-initialize OpenAI client if it wasn't initialized at module load time
  const client = openai || new OpenAI({ apiKey });
  
  try {
    const nodesData = nodes.slice(0, 20).map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      hasText: n.type === 'TEXT',
      hasColor: !!n.fills && n.fills.length > 0,
    }));

    const prompt = `Analyze this design for accessibility issues (WCAG 2.1 AA):

Nodes:
${JSON.stringify(nodesData, null, 2)}

Color Tokens:
${JSON.stringify(tokens.colors.slice(0, 10), null, 2)}

Check for:
- Color contrast issues
- Missing text alternatives
- Keyboard navigation problems
- Focus indicators
- Screen reader compatibility

Format as JSON:
{
  "score": number (0-100),
  "issues": [
    {
      "nodeId": "string",
      "issue": "string",
      "severity": "error" | "warning" | "info",
      "recommendation": "string"
    }
  ],
  "summary": "string"
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an accessibility expert reviewing designs for WCAG 2.1 AA compliance.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const report = JSON.parse(content) as AccessibilityReport;
    return report;
  } catch (error) {
    console.error('Error in generateAccessibilityReport:', error instanceof Error ? error.message : String(error));
    
    return {
      score: 0,
      issues: [{
        nodeId: 'unknown',
        issue: 'Could not generate accessibility report',
        severity: 'error',
        recommendation: 'Review design manually for accessibility',
      }],
      summary: 'Accessibility analysis could not be completed.',
    };
  }
}

