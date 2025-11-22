#!/usr/bin/env node

/**
 * Test Script for Figma Design Analyzer Backend
 * 
 * This script tests the backend-web API endpoints:
 * 1. Gets file info and lists pages
 * 2. Allows user to select a page
 * 3. Analyzes the selected page
 * 4. Displays results
 */

import readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt user
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Helper function to print colored output
function print(color, text) {
  console.log(`${color}${text}${COLORS.reset}`);
}

// Helper function to print section headers
function printSection(title) {
  console.log('\n' + '='.repeat(60));
  print(COLORS.bright + COLORS.cyan, title);
  console.log('='.repeat(60) + '\n');
}

// Helper function to print JSON nicely
function printJSON(obj, title = '') {
  if (title) {
    print(COLORS.yellow, `\n${title}:`);
  }
  console.log(JSON.stringify(obj, null, 2));
}

// Test function: Get file info and pages
async function getFileInfo(fileUrl, accessToken) {
  printSection('Step 1: Getting File Information');
  
  print(COLORS.blue, `Requesting file info from: ${BACKEND_URL}/api/file-info`);
  print(COLORS.blue, `File URL: ${fileUrl}`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/file-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
        accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      print(COLORS.red, `Error: ${data.error || 'Unknown error'}`);
      if (data.errorCode) {
        print(COLORS.red, `Error Code: ${data.errorCode}`);
      }
      return null;
    }

    if (!data.success) {
      print(COLORS.red, `Failed: ${data.error || 'Unknown error'}`);
      return null;
    }

    print(COLORS.green, `✓ Successfully retrieved file information`);
    print(COLORS.green, `File Name: ${data.fileName}`);
    print(COLORS.green, `File Key: ${data.fileKey}`);
    print(COLORS.green, `Total Pages: ${data.pages.length}`);

    return data;
  } catch (error) {
    print(COLORS.red, `Network Error: ${error.message}`);
    print(COLORS.red, `Make sure the backend server is running on ${BACKEND_URL}`);
    return null;
  }
}

// Test function: Display pages and get user selection
async function selectPage(pages) {
  printSection('Step 2: Select a Page to Analyze');

  if (pages.length === 0) {
    print(COLORS.red, 'No pages found in the file.');
    return null;
  }

  print(COLORS.cyan, 'Available Pages:');
  console.log('');

  pages.forEach((page, index) => {
    print(COLORS.magenta, `${index + 1}. ${page.name}`);
    print(COLORS.blue, `   ID: ${page.id}`);
    console.log('');
  });

  while (true) {
    const answer = await question(
      `Enter page number (1-${pages.length}) or 'q' to quit: `
    );

    if (answer.toLowerCase() === 'q') {
      return null;
    }

    const pageNumber = parseInt(answer, 10);
    if (pageNumber >= 1 && pageNumber <= pages.length) {
      const selectedPage = pages[pageNumber - 1];
      print(COLORS.green, `\n✓ Selected: ${selectedPage.name} (${selectedPage.id})`);
      return selectedPage;
    } else {
      print(COLORS.red, `Invalid selection. Please enter a number between 1 and ${pages.length}.`);
    }
  }
}

// Test function: Analyze selected page
async function analyzePage(fileUrl, pageId, accessToken) {
  printSection('Step 3: Analyzing Page');

  print(COLORS.blue, `Requesting analysis from: ${BACKEND_URL}/api/analyse-page`);
  print(COLORS.blue, `Page ID: ${pageId}`);
  print(COLORS.yellow, '\n⏳ This may take a while... Please wait...\n');

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyse-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
        pageId,
        accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      print(COLORS.red, `Error: ${data.error || 'Unknown error'}`);
      if (data.errorCode) {
        print(COLORS.red, `Error Code: ${data.errorCode}`);
      }
      return null;
    }

    if (!data.success) {
      print(COLORS.red, `Failed: ${data.error || 'Unknown error'}`);
      return null;
    }

    print(COLORS.green, '✓ Analysis completed successfully!');
    return data;
  } catch (error) {
    print(COLORS.red, `Network Error: ${error.message}`);
    return null;
  }
}

// Function to display analysis results
async function displayResults(results) {
  printSection('Analysis Results');

  // Basic Info
  print(COLORS.cyan, '📋 Basic Information:');
  console.log(`  Session ID: ${results.sessionId}`);
  console.log(`  Timestamp: ${results.timestamp}`);
  console.log(`  File Key: ${results.fileKey}`);
  console.log(`  Page ID: ${results.pageId}`);
  console.log(`  Page Name: ${results.pageName}`);
  if (results.outputPath) {
    console.log(`  Output Path: ${results.outputPath}`);
  }

  // Analysis Summary
  if (results.analysis) {
    print(COLORS.cyan, '\n📊 Design Analysis:');
    console.log(`  Summary: ${results.analysis.summary}`);
    console.log(`  Strengths: ${results.analysis.strengths.length}`);
    console.log(`  Issues: ${results.analysis.issues.length}`);
    console.log(`  Recommendations: ${results.analysis.recommendations.length}`);
    
    if (results.analysis.recommendations.length > 0) {
      print(COLORS.yellow, '\n  Top Recommendations:');
      results.analysis.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`    ${i + 1}. ${rec}`);
      });
    }
  }

  // Design Tokens
  if (results.tokens) {
    print(COLORS.cyan, '\n🎨 Design Tokens:');
    console.log(`  Colors: ${results.tokens.colors?.length || 0}`);
    console.log(`  Typography: ${results.tokens.typography?.length || 0}`);
    console.log(`  Spacing: ${results.tokens.spacing?.length || 0}`);
    console.log(`  Border Radius: ${results.tokens.borderRadius?.length || 0}`);
  }

  // Components
  if (results.components) {
    print(COLORS.cyan, '\n🧩 Components Detected:');
    console.log(`  Total: ${results.components.length}`);
    if (results.components.length > 0) {
      results.components.slice(0, 3).forEach((comp, i) => {
        console.log(`    ${i + 1}. ${comp.componentName}`);
      });
    }
  }

  // Accessibility
  if (results.accessibility) {
    print(COLORS.cyan, '\n♿ Accessibility Report:');
    console.log(`  Score: ${results.accessibility.score}/100`);
    console.log(`  Issues: ${results.accessibility.issues?.length || 0}`);
    console.log(`  Summary: ${results.accessibility.summary}`);
  }

  // DesignKit
  if (results.designKit) {
    print(COLORS.cyan, '\n📘 DesignKit:');
    console.log(`  Title: ${results.designKit.title}`);
    console.log(`  Subtitle: ${results.designKit.subtitle}`);
    console.log(`  Typography Typefaces: ${results.designKit.typography?.typefaces?.length || 0}`);
    console.log(`  Iconography Guidelines: ${results.designKit.iconography?.guidelines?.length || 0}`);
    console.log(`  Spacing Guidelines: ${results.designKit.spacingSystem?.guidelines?.length || 0}`);
    console.log(`  Color Guidelines: ${results.designKit.colorSystem?.guidelines?.length || 0}`);
    console.log(`  Grid & Layout Rules: ${results.designKit.gridAndLayout?.rules?.length || 0}`);
    
    // Show preview of typography typefaces
    if (results.designKit.typography?.typefaces?.length > 0) {
      print(COLORS.yellow, '\n  Typography Typefaces Preview:');
      results.designKit.typography.typefaces.slice(0, 3).forEach((typeface, i) => {
        console.log(`    ${i + 1}. ${typeface.name}`);
        console.log(`       Purpose: ${typeface.purpose.substring(0, 60)}...`);
      });
      if (results.designKit.typography.typefaces.length > 3) {
        console.log(`    ... and ${results.designKit.typography.typefaces.length - 3} more`);
      }
    }
  }

  // SOP (Statement of Procedure)
  if (results.sop) {
    print(COLORS.cyan, '\n📋 SOP (Statement of Procedure):');
    console.log(`  Title: ${results.sop.title}`);
    console.log(`  User Stories: ${results.sop.userJourney?.userStories?.length || 0}`);
    console.log(`  Features: ${results.sop.featureBreakout?.features?.length || 0}`);
    console.log(`  LLD Diagrams: ${results.sop.lld?.diagrams?.length || 0}`);
    
    // Show preview of user stories
    if (results.sop.userJourney?.userStories?.length > 0) {
      print(COLORS.yellow, '\n  User Stories Preview:');
      results.sop.userJourney.userStories.slice(0, 2).forEach((story, i) => {
        const preview = story.length > 100 ? story.substring(0, 100) + '...' : story;
        console.log(`    ${i + 1}. ${preview}`);
      });
      if (results.sop.userJourney.userStories.length > 2) {
        console.log(`    ... and ${results.sop.userJourney.userStories.length - 2} more`);
      }
    }
    
    // Show preview of features
    if (results.sop.featureBreakout?.features?.length > 0) {
      print(COLORS.yellow, '\n  Features Preview:');
      results.sop.featureBreakout.features.slice(0, 3).forEach((feature, i) => {
        console.log(`    ${i + 1}. ${feature.name}`);
        console.log(`       Components: ${feature.components?.length || 0}`);
        console.log(`       Design Tokens: ${feature.designTokens?.length || 0}`);
      });
      if (results.sop.featureBreakout.features.length > 3) {
        console.log(`    ... and ${results.sop.featureBreakout.features.length - 3} more`);
      }
    }
  }

  // Generated Files
  if (results.files) {
    print(COLORS.cyan, '\n📁 Generated Files:');
    Object.entries(results.files).forEach(([key, filename]) => {
      console.log(`  ${key}: ${filename}`);
    });
  }

  // Save detailed results to file
  if (results.outputPath) {
    const summaryPath = path.join(__dirname, 'test-results-summary.json');
    fs.writeFileSync(
      summaryPath,
      JSON.stringify({
        sessionId: results.sessionId,
        timestamp: results.timestamp,
        fileKey: results.fileKey,
        pageName: results.pageName,
        analysis: results.analysis,
        tokensCount: {
          colors: results.tokens?.colors?.length || 0,
          typography: results.tokens?.typography?.length || 0,
          spacing: results.tokens?.spacing?.length || 0,
          borderRadius: results.tokens?.borderRadius?.length || 0,
        },
        componentsCount: results.components?.length || 0,
        accessibilityScore: results.accessibility?.score || 0,
        designKit: {
          title: results.designKit?.title,
          typographyCount: results.designKit?.typography?.typefaces?.length || 0,
        },
        sop: {
          title: results.sop?.title,
          userStoriesCount: results.sop?.userJourney?.userStories?.length || 0,
          featuresCount: results.sop?.featureBreakout?.features?.length || 0,
          lldDiagramsCount: results.sop?.lld?.diagrams?.length || 0,
        },
        outputPath: results.outputPath,
      }, null, 2)
    );
    print(COLORS.green, `\n✓ Summary saved to: ${summaryPath}`);
    
    // Also show DesignKit file location if available
    if (results.outputPath && results.files?.designKit) {
      const designKitPath = path.join(results.outputPath, results.files.designKit);
      print(COLORS.green, `✓ DesignKit saved to: ${designKitPath}`);
    }
    
    // Also show SOP file location if available
    if (results.outputPath && results.files?.sop) {
      const sopPath = path.join(results.outputPath, results.files.sop);
      print(COLORS.green, `✓ SOP saved to: ${sopPath}`);
    }
  }

  // Ask if user wants to see DesignKit preview
  if (results.designKit) {
    const showDesignKit = await question('\nShow DesignKit preview? (y/n): ');
    if (showDesignKit.toLowerCase() === 'y') {
      printSection('DesignKit Preview');
      
      print(COLORS.cyan, `# ${results.designKit.title}`);
      print(COLORS.cyan, `## ${results.designKit.subtitle}\n`);
      
      // Show first typography typeface in detail
      if (results.designKit.typography?.typefaces?.length > 0) {
        const firstTypeface = results.designKit.typography.typefaces[0];
        print(COLORS.yellow, `### Typography Example: ${firstTypeface.name}\n`);
        console.log(`Purpose: ${firstTypeface.purpose}`);
        console.log(`Usage: ${firstTypeface.usage}`);
        console.log(`Hierarchy: ${firstTypeface.hierarchy}\n`);
      }
      
      // Show iconography
      if (results.designKit.iconography) {
        print(COLORS.yellow, '### Iconography\n');
        console.log(`${results.designKit.iconography.description}\n`);
        console.log(`Usage: ${results.designKit.iconography.usage}\n`);
      }
      
      // Show spacing system
      if (results.designKit.spacingSystem) {
        print(COLORS.yellow, '### Spacing System\n');
        console.log(`${results.designKit.spacingSystem.description}\n`);
        console.log(`Scale: ${results.designKit.spacingSystem.scale}\n`);
      }
      
      // Show color system
      if (results.designKit.colorSystem) {
        print(COLORS.yellow, '### Color System\n');
        console.log(`${results.designKit.colorSystem.description}\n`);
        console.log(`Palette: ${results.designKit.colorSystem.palette}\n`);
      }
      
      print(COLORS.green, '... (Full DesignKit saved to DesignKit.md)');
    }
  }

  // Ask if user wants to see full results
  const showFull = await question('\nShow full JSON results? (y/n): ');
  if (showFull.toLowerCase() === 'y') {
    printSection('Full Analysis Results (JSON)');
    printJSON(results, 'Complete Results');
  }
}

// Main test function
async function runTest() {
  console.clear();
  print(COLORS.bright + COLORS.cyan, `
╔══════════════════════════════════════════════════════════════╗
║     Figma Design Analyzer - Backend API Test Script        ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Check if backend is running
  print(COLORS.blue, `Checking backend connection at: ${BACKEND_URL}`);
  try {
    const healthCheck = await fetch(`${BACKEND_URL}/health`);
    if (healthCheck.ok) {
      print(COLORS.green, '✓ Backend is running');
    } else {
      print(COLORS.red, '✗ Backend health check failed');
      print(COLORS.yellow, 'Make sure the backend server is running: npm run dev');
      process.exit(1);
    }
  } catch (error) {
    print(COLORS.red, `✗ Cannot connect to backend: ${error.message}`);
    print(COLORS.yellow, `Make sure the backend server is running on ${BACKEND_URL}`);
    print(COLORS.yellow, 'Start it with: cd backend-web && npm run dev');
    process.exit(1);
  }

  console.log('');

  // Get input from user
  print(COLORS.cyan, 'Please provide the following information:\n');
  
  const fileUrl = await question('Figma File URL: ');
  if (!fileUrl.trim()) {
    print(COLORS.red, 'File URL is required');
    rl.close();
    process.exit(1);
  }

  const accessToken = await question('Figma Access Token: ');
  if (!accessToken.trim()) {
    print(COLORS.red, 'Access Token is required');
    rl.close();
    process.exit(1);
  }

  console.log('');

  // Step 1: Get file info
  const fileInfo = await getFileInfo(fileUrl.trim(), accessToken.trim());
  if (!fileInfo) {
    print(COLORS.red, '\nFailed to get file information. Exiting.');
    rl.close();
    process.exit(1);
  }

  // Step 2: Select page
  const selectedPage = await selectPage(fileInfo.pages);
  if (!selectedPage) {
    print(COLORS.yellow, '\nNo page selected. Exiting.');
    rl.close();
    process.exit(0);
  }

  // Step 3: Analyze page
  const analysisResults = await analyzePage(
    fileUrl.trim(),
    selectedPage.id,
    accessToken.trim()
  );

  if (!analysisResults) {
    print(COLORS.red, '\nFailed to analyze page. Exiting.');
    rl.close();
    process.exit(1);
  }

  // Step 4: Display results
  await displayResults(analysisResults);

  print(COLORS.green, '\n✓ Test completed successfully!');
  rl.close();
}

// Run the test
runTest().catch((error) => {
  print(COLORS.red, `\nUnexpected error: ${error.message}`);
  console.error(error);
  rl.close();
  process.exit(1);
});

