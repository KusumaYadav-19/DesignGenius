import 'dotenv/config';
import OpenAI from 'openai';
import type { DesignTokens } from './tokens-generator.js';
import type { AnalysisResult } from './mcp-agent.js';
import type { AccessibilityReport } from './mcp-agent.js';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface DesignKitDocument {
  title: string;
  subtitle: string;
  typography: TypographySection;
  iconography: IconographySection;
  spacingSystem: SpacingSystemSection;
  colorSystem: ColorSystemSection;
  gridAndLayout: GridAndLayoutSection;
  fullDocument: string;
}

export interface TypographySection {
  typefaces: TypographyTypeface[];
}

export interface TypographyTypeface {
  name: string;
  purpose: string;
  reasoning: string;
  usage: string;
  function: string;
  hierarchy: string;
  patterns: string;
  constraints: string;
  componentAppearance: string;
}

export interface IconographySection {
  description: string;
  guidelines: string[];
  usage: string;
}

export interface SpacingSystemSection {
  description: string;
  scale: string;
  usage: string;
  guidelines: string[];
}

export interface ColorSystemSection {
  description: string;
  palette: string;
  usage: string;
  guidelines: string[];
}

export interface GridAndLayoutSection {
  description: string;
  rules: string[];
  guidelines: string[];
}

export async function generateDesignKit(
  tokens: DesignTokens,
  analysis: AnalysisResult,
  accessibilityReport: AccessibilityReport,
  components: any[],
  sopDocument: string
): Promise<DesignKitDocument> {
  if (!openai) {
    console.warn('OpenAI API key not set, returning default DesignKit');
    return generateDefaultDesignKit(tokens);
  }

  try {
    // Prepare context from all reference files
    const context = {
      designTokens: {
        colors: tokens.colors,
        typography: tokens.typography,
        spacing: tokens.spacing,
        borderRadius: tokens.borderRadius,
      },
      analysis: {
        summary: analysis.summary,
        recommendations: analysis.recommendations,
        issues: analysis.issues,
        strengths: analysis.strengths,
      },
      accessibility: {
        score: accessibilityReport.score,
        issues: accessibilityReport.issues,
        summary: accessibilityReport.summary,
      },
      components: components.map(c => ({
        name: c.componentName,
        description: c.description,
        props: c.props,
      })),
      sop: sopDocument,
    };

    const prompt = `You are a design system expert creating a comprehensive DesignKit document. Analyze the provided reference data and create guidelines based ONLY on the actual data provided - do not make external assumptions.

Reference Data Provided:
- Design Tokens: ${tokens.colors.length} colors, ${tokens.typography.length} typography tokens, ${tokens.spacing.length} spacing tokens, ${tokens.borderRadius.length} border radius tokens
- Analysis: ${analysis.summary.substring(0, 200)}...
- Components: ${components.length} components identified
- Accessibility: Score ${accessibilityReport.score}/100 with ${accessibilityReport.issues.length} issues
- SOP: Contains workflow and compliance guidelines

Full Context:
${JSON.stringify(context, null, 2)}

Create a DesignKit document following this exact structure:

Title: "Guide Lines"
Subtitle: "Style-Guides"

1. Typography
   For each typography token in the design tokens, provide:
   - name: The typeface name
   - purpose: What this typeface is used for
   - reasoning: Why this typeface exists in the system
   - usage: How and when to use it
   - function: The functional role in the design
   - hierarchy: Where it sits in the typographic hierarchy
   - patterns: Common patterns where it appears
   - constraints: When NOT to use it
   - componentAppearance: How components using this typeface appear across screens

   Base your analysis ONLY on the provided data:
   - Analyze each typography token from designTokens.typography array
   - Use actual fontSize, fontWeight, lineHeight, letterSpacing values
   - Infer hierarchy from fontSize values (larger = higher hierarchy)
   - Use component descriptions to understand usage patterns
   - Reference analysis.recommendations and analysis.issues for constraints
   - Consider accessibility.issues for accessibility-related constraints
   - Infer patterns from components array (which components use which typography)

2. Iconography
   - description: Overview of icon usage inferred from component structure and design patterns
   - guidelines: Best practices for icon usage based on component props and accessibility requirements
   - usage: When and how to use icons based on component descriptions and accessibility report

3. Spacing System
   - description: Overview based on designTokens.spacing array
   - scale: Detailed explanation using actual spacing token values and their relationships
   - usage: How to apply spacing based on spacing token categories and values
   - guidelines: Rules derived from spacing token values, analysis recommendations, and component structure

4. Color System
   - description: Overview based on designTokens.colors array
   - palette: Detailed explanation of each color category (primary, secondary, neutral, semantic) using actual color tokens
   - usage: When to use each color category based on color token names, categories, and accessibility considerations
   - guidelines: Color usage rules based on accessibility report, color contrast requirements, and analysis recommendations

5. Grid and Layout Rules
   - description: Overview inferred from component structure, auto-layout patterns, and spacing system
   - rules: Specific layout rules based on spacing tokens, border radius tokens, and component organization
   - guidelines: Best practices derived from analysis recommendations, component structure, and accessibility requirements

IMPORTANT:
- Base ALL content ONLY on the provided reference data
- Do NOT make external assumptions
- Analyze typography based on actual token values, hierarchy, and component usage
- For iconography, infer from component structure and design patterns
- For spacing, use the actual spacing tokens provided
- For colors, use the actual color tokens and their categories
- For grid/layout, infer from auto-layout patterns and component structure
- Be specific and actionable
- Reference actual token names and values

Format as JSON:
{
  "title": "Guide Lines",
  "subtitle": "Style-Guides",
  "typography": {
    "typefaces": [
      {
        "name": "string",
        "purpose": "string",
        "reasoning": "string",
        "usage": "string",
        "function": "string",
        "hierarchy": "string",
        "patterns": "string",
        "constraints": "string",
        "componentAppearance": "string"
      }
    ]
  },
  "iconography": {
    "description": "string",
    "guidelines": ["string"],
    "usage": "string"
  },
  "spacingSystem": {
    "description": "string",
    "scale": "string",
    "usage": "string",
    "guidelines": ["string"]
  },
  "colorSystem": {
    "description": "string",
    "palette": "string",
    "usage": "string",
    "guidelines": ["string"]
  },
  "gridAndLayout": {
    "description": "string",
    "rules": ["string"],
    "guidelines": ["string"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a design system expert creating comprehensive style guides. You analyze design tokens, components, and patterns to create actionable guidelines. You base all recommendations ONLY on provided data, never on external assumptions.',
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

    const designKitData = JSON.parse(content) as Omit<DesignKitDocument, 'fullDocument'>;
    
    // Generate the full markdown document
    const fullDocument = formatDesignKitAsMarkdown(designKitData);

    return {
      ...designKitData,
      fullDocument,
    };
  } catch (error) {
    console.error('Error in generateDesignKit:', error instanceof Error ? error.message : String(error));
    return generateDefaultDesignKit(tokens);
  }
}

function formatDesignKitAsMarkdown(designKit: Omit<DesignKitDocument, 'fullDocument'>): string {
  let markdown = `# ${designKit.title}\n\n`;
  markdown += `## ${designKit.subtitle}\n\n`;

  // Typography Section
  markdown += `## 1. Typography\n\n`;
  designKit.typography.typefaces.forEach((typeface, index) => {
    markdown += `### ${typeface.name}\n\n`;
    markdown += `**Purpose:** ${typeface.purpose}\n\n`;
    markdown += `**Reasoning:** ${typeface.reasoning}\n\n`;
    markdown += `**Usage:** ${typeface.usage}\n\n`;
    markdown += `**Function:** ${typeface.function}\n\n`;
    markdown += `**Hierarchy:** ${typeface.hierarchy}\n\n`;
    markdown += `**Patterns:** ${typeface.patterns}\n\n`;
    markdown += `**Constraints:** ${typeface.constraints}\n\n`;
    markdown += `**Component Appearance:** ${typeface.componentAppearance}\n\n`;
    if (index < designKit.typography.typefaces.length - 1) {
      markdown += `---\n\n`;
    }
  });

  // Iconography Section
  markdown += `## 2. Iconography\n\n`;
  markdown += `${designKit.iconography.description}\n\n`;
  markdown += `### Usage\n\n`;
  markdown += `${designKit.iconography.usage}\n\n`;
  markdown += `### Guidelines\n\n`;
  designKit.iconography.guidelines.forEach((guideline, index) => {
    markdown += `${index + 1}. ${guideline}\n`;
  });
  markdown += `\n`;

  // Spacing System Section
  markdown += `## 3. Spacing System\n\n`;
  markdown += `${designKit.spacingSystem.description}\n\n`;
  markdown += `### Scale\n\n`;
  markdown += `${designKit.spacingSystem.scale}\n\n`;
  markdown += `### Usage\n\n`;
  markdown += `${designKit.spacingSystem.usage}\n\n`;
  markdown += `### Guidelines\n\n`;
  designKit.spacingSystem.guidelines.forEach((guideline, index) => {
    markdown += `${index + 1}. ${guideline}\n`;
  });
  markdown += `\n`;

  // Color System Section
  markdown += `## 4. Color System\n\n`;
  markdown += `${designKit.colorSystem.description}\n\n`;
  markdown += `### Palette\n\n`;
  markdown += `${designKit.colorSystem.palette}\n\n`;
  markdown += `### Usage\n\n`;
  markdown += `${designKit.colorSystem.usage}\n\n`;
  markdown += `### Guidelines\n\n`;
  designKit.colorSystem.guidelines.forEach((guideline, index) => {
    markdown += `${index + 1}. ${guideline}\n`;
  });
  markdown += `\n`;

  // Grid and Layout Section
  markdown += `## 5. Grid and Layout System\n\n`;
  markdown += `${designKit.gridAndLayout.description}\n\n`;
  markdown += `### Rules\n\n`;
  designKit.gridAndLayout.rules.forEach((rule, index) => {
    markdown += `${index + 1}. ${rule}\n`;
  });
  markdown += `\n`;
  markdown += `### Guidelines\n\n`;
  designKit.gridAndLayout.guidelines.forEach((guideline, index) => {
    markdown += `${index + 1}. ${guideline}\n`;
  });
  markdown += `\n`;

  return markdown;
}

function generateDefaultDesignKit(tokens: DesignTokens): DesignKitDocument {
  const typographyTypefaces = tokens.typography.map((token, index) => ({
    name: token.name,
    purpose: `Typography token for ${token.fontSize}px text with ${token.fontWeight} weight`,
    reasoning: `Defined in design system with specific size and weight for consistent typography`,
    usage: `Use for ${token.fontSize >= 24 ? 'headings' : token.fontSize >= 16 ? 'body text' : 'captions'}`,
    function: `Provides typographic styling for ${token.fontSize >= 24 ? 'headings' : 'body content'}`,
    hierarchy: `${token.fontSize >= 24 ? 'Primary' : token.fontSize >= 16 ? 'Secondary' : 'Tertiary'} level in typographic hierarchy`,
    patterns: `Commonly used in ${token.fontSize >= 24 ? 'headings and titles' : 'body content and descriptions'}`,
    constraints: `Should not be used for ${token.fontSize >= 24 ? 'body text' : 'headings'}`,
    componentAppearance: `Components using this typeface will have ${token.fontSize}px font size with ${token.fontWeight} weight`,
  }));

  const designKitData = {
    title: 'Guide Lines',
    subtitle: 'Style-Guides',
    typography: {
      typefaces: typographyTypefaces,
    },
    iconography: {
      description: 'Iconography guidelines based on component structure and design patterns.',
      guidelines: [
        'Use consistent icon sizes across components',
        'Ensure icons are accessible with proper alt text',
        'Maintain visual consistency in icon style',
      ],
      usage: 'Icons should be used to enhance visual communication and provide clear visual cues.',
    },
    spacingSystem: {
      description: `The spacing system uses ${tokens.spacing.length} predefined spacing tokens for consistent layout.`,
      scale: tokens.spacing.length > 0 
        ? `Spacing values range from ${Math.min(...tokens.spacing.map(s => s.value))}px to ${Math.max(...tokens.spacing.map(s => s.value))}px`
        : 'No spacing tokens defined',
      usage: 'Apply spacing tokens consistently across components for visual harmony.',
      guidelines: [
        'Use spacing tokens instead of hardcoded values',
        'Maintain consistent spacing between related elements',
        'Follow the spacing scale for padding and margins',
      ],
    },
    colorSystem: {
      description: `The color system consists of ${tokens.colors.length} color tokens organized by category.`,
      palette: `Colors are categorized as: ${[...new Set(tokens.colors.map(c => c.category))].join(', ')}`,
      usage: 'Use color tokens to maintain brand consistency and accessibility.',
      guidelines: [
        'Use color tokens instead of hardcoded hex values',
        'Ensure sufficient contrast for text readability',
        'Follow color category guidelines for semantic meaning',
      ],
    },
    gridAndLayout: {
      description: 'Grid and layout system based on auto-layout patterns and component structure.',
      rules: [
        'Use auto-layout for flexible component structures',
        'Maintain consistent alignment across screens',
        'Follow responsive design principles',
      ],
      guidelines: [
        'Ensure proper spacing between layout elements',
        'Use consistent padding and margins',
        'Maintain visual hierarchy through layout',
      ],
    },
  };

  const fullDocument = formatDesignKitAsMarkdown(designKitData);

  return {
    ...designKitData,
    fullDocument,
  };
}

