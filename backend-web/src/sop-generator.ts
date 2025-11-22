import OpenAI from 'openai';
import type { DesignTokens } from './tokens-generator.js';
import type { AnalysisResult, AccessibilityReport, ComponentDetection } from './mcp-agent.js';
import type { FigmaNode } from './figma-parser.js';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface SOPDocument {
  title: string;
  userJourney: UserJourneySection;
  featureBreakout: FeatureBreakoutSection;
  lld: LLDSection;
  fullDocument: string;
}

export interface UserJourneySection {
  userStories: string[];
}

export interface FeatureBreakoutSection {
  description: string;
  features: Feature[];
}

export interface Feature {
  name: string;
  description: string;
  components: string[];
  designTokens: string[];
  accessibilityNotes: string[];
}

export interface LLDSection {
  description: string;
  diagrams: LLDDiagram[];
}

export interface LLDDiagram {
  journeyName: string;
  steps: LLDStep[];
  diagram: string; // Text-based diagram representation
}

export interface LLDStep {
  stepNumber: number;
  action: string;
  component: string;
  state: string;
  dataFlow: string;
}

export async function generateSOP(
  tokens: DesignTokens,
  analysis: AnalysisResult,
  accessibilityReport: AccessibilityReport,
  components: ComponentDetection[],
  nodes: FigmaNode[]
): Promise<SOPDocument> {
  if (!openai) {
    console.warn('OpenAI API key not set, returning default SOP');
    return generateDefaultSOP(tokens, components);
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
        nodeIds: c.nodeIds,
      })),
      designStructure: {
        nodeCount: nodes.length,
        nodeTypes: [...new Set(nodes.map(n => n.type))],
        topLevelNodes: nodes.slice(0, 10).map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
        })),
      },
    };

    const prompt = `You are a technical documentation expert creating a Statement of Procedure (SOP) document. Analyze the provided reference data from a Figma design analysis and create comprehensive documentation.

Reference Data Provided:
- Design Tokens: ${tokens.colors.length} colors, ${tokens.typography.length} typography tokens, ${tokens.spacing.length} spacing tokens, ${tokens.borderRadius.length} border radius tokens
- Analysis: ${analysis.summary.substring(0, 200)}...
- Components: ${components.length} components identified
- Accessibility: Score ${accessibilityReport.score}/100 with ${accessibilityReport.issues.length} issues
- Design Structure: ${nodes.length} nodes with types: ${[...new Set(nodes.map(n => n.type))].join(', ')}

Full Context:
${JSON.stringify(context, null, 2)}

Create an SOP document following this exact structure:

Title: "SOP"

1. User Journey
   - Generate 2-3 user stories (2-3 lines each) based on the components, design structure, and features identified
   - Each user story should describe a typical user interaction with the design
   - Base stories on component descriptions, design structure, and analysis insights
   - Format as an array of user story strings

2. Feature Breakout
   - Break down all features identified from the Figma design
   - For each feature, provide:
     * name: Feature name
     * description: What the feature does
     * components: Array of component names that implement this feature
     * designTokens: Array of relevant design token names used
     * accessibilityNotes: Array of accessibility considerations for this feature
   - Base features on:
     * Component descriptions and props
     * Design structure and node types
     * Analysis recommendations and strengths
     * Accessibility report issues and recommendations

3. LLD (Low Level Diagram)
   - Create low-level diagrams for each user journey identified
   - For each diagram, provide:
     * journeyName: Name of the user journey
     * steps: Array of steps with:
       - stepNumber: Sequential step number
       - action: User action or system action
       - component: Component involved
       - state: State of the component/system
       - dataFlow: How data flows in this step
     * diagram: A text-based diagram representation (using ASCII art or structured text format)
   - Create diagrams that show the flow from user interaction through components to system responses
   - Base diagrams on component structure, props, and user journeys

IMPORTANT:
- Base ALL content ONLY on the provided reference data
- Do NOT make external assumptions
- User journeys should reflect actual components and features in the design
- Feature breakout should map to actual components and design tokens
- LLD diagrams should show realistic flows based on component props and interactions
- Be specific and actionable
- Reference actual component names, token names, and design elements

Format as JSON:
{
  "title": "SOP",
  "userJourney": {
    "userStories": [
      "string (2-3 lines describing a user story)"
    ]
  },
  "featureBreakout": {
    "description": "string",
    "features": [
      {
        "name": "string",
        "description": "string",
        "components": ["string"],
        "designTokens": ["string"],
        "accessibilityNotes": ["string"]
      }
    ]
  },
  "lld": {
    "description": "string",
    "diagrams": [
      {
        "journeyName": "string",
        "steps": [
          {
            "stepNumber": number,
            "action": "string",
            "component": "string",
            "state": "string",
            "dataFlow": "string"
          }
        ],
        "diagram": "string (text-based diagram)"
      }
    ]
  }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a technical documentation expert creating comprehensive Statement of Procedure documents. You analyze design systems, components, and user flows to create actionable documentation. You base all recommendations ONLY on provided data, never on external assumptions.',
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

    const sopData = JSON.parse(content) as Omit<SOPDocument, 'fullDocument'>;
    
    // Generate the full markdown document
    const fullDocument = formatSOPAsMarkdown(sopData);

    return {
      ...sopData,
      fullDocument,
    };
  } catch (error) {
    console.error('Error in generateSOP:', error instanceof Error ? error.message : String(error));
    return generateDefaultSOP(tokens, components);
  }
}

function formatSOPAsMarkdown(sop: Omit<SOPDocument, 'fullDocument'>): string {
  let markdown = `${sop.title}\n\n`;

  // User Journey Section
  markdown += `User Journey\n\n`;
  sop.userJourney.userStories.forEach((story, index) => {
    markdown += `User Story ${index + 1}\n\n`;
    markdown += `${story}\n\n`;
  });

  // Feature Breakout Section
  markdown += `Feature Breakout\n\n`;
  markdown += `${sop.featureBreakout.description}\n\n`;
  sop.featureBreakout.features.forEach((feature, index) => {
    markdown += `${feature.name}\n\n`;
    markdown += `Description: ${feature.description}\n\n`;
    markdown += `Components:\n`;
    feature.components.forEach(component => {
      markdown += `${component}\n`;
    });
    markdown += `\n`;
    markdown += `Design Tokens:\n`;
    feature.designTokens.forEach(token => {
      markdown += `${token}\n`;
    });
    markdown += `\n`;
    markdown += `Accessibility Notes:\n`;
    feature.accessibilityNotes.forEach(note => {
      markdown += `${note}\n`;
    });
    markdown += `\n`;
  });

  // LLD Section
  markdown += `LLD (Low Level Diagram)\n\n`;
  markdown += `${sop.lld.description}\n\n`;
  sop.lld.diagrams.forEach((diagram, diagramIndex) => {
    markdown += `${diagram.journeyName}\n\n`;
    markdown += `Flow Steps:\n\n`;
    diagram.steps.forEach(step => {
      markdown += `Step ${step.stepNumber}: ${step.action}\n\n`;
      markdown += `Component: ${step.component}\n`;
      markdown += `State: ${step.state}\n`;
      markdown += `Data Flow: ${step.dataFlow}\n\n`;
    });
    markdown += `Diagram:\n\n`;
    // Remove any markdown code block formatting from diagram
    const cleanDiagram = diagram.diagram.replace(/```/g, '').replace(/`/g, '').trim();
    markdown += `${cleanDiagram}\n\n`;
  });

  return markdown;
}

function generateDefaultSOP(tokens: DesignTokens, components: ComponentDetection[]): SOPDocument {
  const userStories = [
    `As a user, I want to interact with the design system components so that I can complete my tasks efficiently. The interface should provide clear visual feedback and maintain consistency across all interactions.`,
    `As a user, I want the application to be accessible and responsive so that I can use it effectively regardless of my device or accessibility needs. All interactive elements should be clearly labeled and keyboard navigable.`,
  ];

  if (components.length > 0) {
    userStories.push(
      `As a user, I want to use ${components[0].componentName} and other components seamlessly so that I can navigate through the application with intuitive interactions. The design should guide me through the workflow naturally.`
    );
  }

  const features = components.map((component, index) => ({
    name: component.componentName,
    description: component.description || `Component ${component.componentName} provides functionality for the design system.`,
    components: [component.componentName],
    designTokens: [
      ...tokens.colors.slice(0, 2).map(c => c.name),
      ...tokens.typography.slice(0, 1).map(t => t.name),
    ],
    accessibilityNotes: [
      'Ensure proper color contrast for text',
      'Provide keyboard navigation support',
      'Include ARIA labels where appropriate',
    ],
  }));

  const diagrams = userStories.map((story, index) => ({
    journeyName: `User Journey ${index + 1}`,
    steps: [
      {
        stepNumber: 1,
        action: 'User initiates interaction',
        component: components.length > 0 ? components[0].componentName : 'Component',
        state: 'Initial state',
        dataFlow: 'User input → Component',
      },
      {
        stepNumber: 2,
        action: 'Component processes action',
        component: components.length > 0 ? components[0].componentName : 'Component',
        state: 'Processing state',
        dataFlow: 'Component → State update',
      },
      {
        stepNumber: 3,
        action: 'System responds to user',
        component: components.length > 0 ? components[0].componentName : 'Component',
        state: 'Updated state',
        dataFlow: 'State → UI update',
      },
    ],
    diagram: `User → [${components.length > 0 ? components[0].componentName : 'Component'}] → State Update → UI Response`,
  }));

  const sopData = {
    title: 'SOP',
    userJourney: {
      userStories,
    },
    featureBreakout: {
      description: `The design system consists of ${components.length} components with ${tokens.colors.length} color tokens, ${tokens.typography.length} typography tokens, and ${tokens.spacing.length} spacing tokens.`,
      features: features.length > 0 ? features : [{
        name: 'Default Feature',
        description: 'Basic feature implementation',
        components: ['Component'],
        designTokens: tokens.colors.slice(0, 2).map(c => c.name),
        accessibilityNotes: ['Ensure accessibility compliance'],
      }],
    },
    lld: {
      description: 'Low-level diagrams showing user journey flows through the system components.',
      diagrams,
    },
  };

  const fullDocument = formatSOPAsMarkdown(sopData);

  return {
    ...sopData,
    fullDocument,
  };
}

