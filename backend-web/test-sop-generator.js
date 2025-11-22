#!/usr/bin/env node

/**
 * Test Script for SOP Generator
 * 
 * This script tests the SOP generator directly with mock data
 * without needing to run the full API server.
 */

import { generateSOP } from './src/sop-generator.js';

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

function print(color, text) {
  console.log(`${color}${text}${COLORS.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  print(COLORS.bright + COLORS.cyan, title);
  console.log('='.repeat(60) + '\n');
}

// Create mock data for testing
function createMockData() {
  const tokens = {
    colors: [
      { name: 'primary-500', value: '#3B82F6', hex: '#3B82F6', rgba: 'rgba(59, 130, 246, 1)', category: 'primary' },
      { name: 'secondary-500', value: '#10B981', hex: '#10B981', rgba: 'rgba(16, 185, 129, 1)', category: 'secondary' },
      { name: 'neutral-100', value: '#F3F4F6', hex: '#F3F4F6', rgba: 'rgba(243, 244, 246, 1)', category: 'neutral' },
    ],
    typography: [
      { name: 'heading-1', fontFamily: 'Inter', fontSize: 32, fontWeight: 700, lineHeight: 40, letterSpacing: -0.5 },
      { name: 'body-1', fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 24, letterSpacing: 0 },
    ],
    spacing: [
      { name: 'spacing-4', value: 16, category: 'padding' },
      { name: 'spacing-8', value: 32, category: 'margin' },
    ],
    borderRadius: [
      { name: 'radius-sm', value: 4 },
      { name: 'radius-md', value: 8 },
    ],
  };

  const analysis = {
    summary: 'A well-structured design system with consistent spacing and typography. The design follows modern UI patterns with clear visual hierarchy.',
    recommendations: [
      'Consider adding more semantic color tokens',
      'Ensure consistent spacing scale across components',
      'Add more typography variants for different use cases',
    ],
    issues: [
      'Some color contrast ratios may need improvement',
      'Missing hover states for interactive elements',
    ],
    strengths: [
      'Consistent design tokens',
      'Clear component structure',
      'Good accessibility considerations',
    ],
  };

  const accessibilityReport = {
    score: 85,
    issues: [
      {
        nodeId: 'button-1',
        issue: 'Color contrast ratio below WCAG AA standard',
        severity: 'warning',
        recommendation: 'Increase text color contrast or adjust background color',
      },
    ],
    summary: 'Good overall accessibility with minor improvements needed for color contrast.',
  };

  const components = [
    {
      componentName: 'Button',
      nodeIds: ['button-1', 'button-2'],
      description: 'Primary action button component with multiple variants',
      props: ['variant', 'size', 'disabled', 'onClick'],
    },
    {
      componentName: 'Card',
      nodeIds: ['card-1'],
      description: 'Container component for displaying content sections',
      props: ['title', 'children', 'padding'],
    },
  ];

  const nodes = [
    {
      id: 'button-1',
      name: 'Button',
      type: 'FRAME',
      children: [],
    },
    {
      id: 'card-1',
      name: 'Card',
      type: 'FRAME',
      children: [],
    },
  ];

  return { tokens, analysis, accessibilityReport, components, nodes };
}

async function testSOPGenerator() {
  console.clear();
  print(COLORS.bright + COLORS.cyan, `
╔══════════════════════════════════════════════════════════════╗
║              SOP Generator Test Script                      ║
╚══════════════════════════════════════════════════════════════╝
  `);

  printSection('Creating Mock Data');
  const { tokens, analysis, accessibilityReport, components, nodes } = createMockData();
  
  print(COLORS.green, '✓ Mock data created:');
  console.log(`  - Colors: ${tokens.colors.length}`);
  console.log(`  - Typography: ${tokens.typography.length}`);
  console.log(`  - Spacing: ${tokens.spacing.length}`);
  console.log(`  - Components: ${components.length}`);
  console.log(`  - Nodes: ${nodes.length}`);

  printSection('Testing SOP Generator');
  print(COLORS.yellow, '⏳ Generating SOP document...\n');

  try {
    const sop = await generateSOP(
      tokens,
      analysis,
      accessibilityReport,
      components,
      nodes
    );

    print(COLORS.green, '✓ SOP generated successfully!\n');

    printSection('SOP Results');
    console.log(`Title: ${sop.title}\n`);
    
    console.log(`User Journey:`);
    console.log(`  User Stories: ${sop.userJourney.userStories.length}`);
    sop.userJourney.userStories.forEach((story, i) => {
      print(COLORS.yellow, `\n  Story ${i + 1}:`);
      console.log(`  ${story}`);
    });

    console.log(`\nFeature Breakout:`);
    console.log(`  Description: ${sop.featureBreakout.description}`);
    console.log(`  Features: ${sop.featureBreakout.features.length}`);
    sop.featureBreakout.features.forEach((feature, i) => {
      print(COLORS.yellow, `\n  Feature ${i + 1}: ${feature.name}`);
      console.log(`    Description: ${feature.description}`);
      console.log(`    Components: ${feature.components.join(', ')}`);
      console.log(`    Design Tokens: ${feature.designTokens.join(', ')}`);
      console.log(`    Accessibility Notes: ${feature.accessibilityNotes.length} notes`);
    });

    console.log(`\nLLD (Low Level Diagram):`);
    console.log(`  Description: ${sop.lld.description}`);
    console.log(`  Diagrams: ${sop.lld.diagrams.length}`);
    sop.lld.diagrams.forEach((diagram, i) => {
      print(COLORS.yellow, `\n  Diagram ${i + 1}: ${diagram.journeyName}`);
      console.log(`    Steps: ${diagram.steps.length}`);
      diagram.steps.forEach(step => {
        console.log(`      Step ${step.stepNumber}: ${step.action}`);
        console.log(`        Component: ${step.component}`);
        console.log(`        State: ${step.state}`);
      });
      print(COLORS.blue, `\n    Diagram Preview:`);
      console.log(`    ${diagram.diagram.split('\n').slice(0, 3).join('\n    ')}...`);
    });

    printSection('Full Document Preview');
    const preview = sop.fullDocument.substring(0, 500);
    console.log(preview);
    print(COLORS.green, '\n... (Full document available in sop.fullDocument)');

    printSection('Test Summary');
    print(COLORS.green, '✓ All tests passed!');
    console.log(`\nSOP Document Structure:`);
    console.log(`  ✓ Title: ${sop.title}`);
    console.log(`  ✓ User Journey: ${sop.userJourney.userStories.length} stories`);
    console.log(`  ✓ Feature Breakout: ${sop.featureBreakout.features.length} features`);
    console.log(`  ✓ LLD: ${sop.lld.diagrams.length} diagrams`);
    console.log(`  ✓ Full Document: ${sop.fullDocument.length} characters`);

    return sop;
  } catch (error) {
    print(COLORS.red, `✗ Error generating SOP: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testSOPGenerator().catch((error) => {
  print(COLORS.red, `\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

