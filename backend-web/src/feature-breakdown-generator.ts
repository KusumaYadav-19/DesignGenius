import OpenAI from 'openai';
import type { DesignTokens } from './tokens-generator.js';
import type { AnalysisResult, AccessibilityReport, ComponentDetection } from './mcp-agent.js';
import type { FigmaNode } from './figma-parser.js';
import type { SOPDocument } from './sop-generator.js';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface FeatureBreakdownDocument {
  title: string;
  features: DetailedFeature[];
  fullDocument: string;
}

export interface DetailedFeature {
  name: string;
  description: string;
  frontendFeature: FrontendFeature;
  backendFeature: BackendFeature;
  apiEndpoints: APIEndpoint[];
  testCases: TestCase[];
}

export interface FrontendFeature {
  description: string;
  components: string[];
  stateManagement: string;
  userInteractions: string[];
  designTokens: string[];
  accessibility: string[];
}

export interface BackendFeature {
  description: string;
  businessLogic: string[];
  dataModels: string[];
  validations: string[];
  errorHandling: string[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: any;
  responseBody?: any;
  authentication?: string;
}

export interface TestCase {
  name: string;
  description: string;
  scenario: string;
  expectedResult: string;
  testType: 'unit' | 'integration' | 'e2e' | 'accessibility';
}

export async function generateFeatureBreakdown(
  sop: SOPDocument,
  tokens: DesignTokens,
  analysis: AnalysisResult,
  accessibilityReport: AccessibilityReport,
  components: ComponentDetection[],
  nodes: FigmaNode[]
): Promise<FeatureBreakdownDocument> {
  if (!openai) {
    console.warn('OpenAI API key not set, returning default Feature Breakdown');
    return generateDefaultFeatureBreakdown(sop, components);
  }

  try {
    // Prepare context from all reference files
    const context = {
      sop: {
        title: sop.title,
        userJourney: sop.userJourney,
        featureBreakout: sop.featureBreakout,
        lld: sop.lld,
      },
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
        topLevelNodes: nodes.slice(0, 15).map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
        })),
      },
    };

    const prompt = `You are a technical architect creating a comprehensive Feature Breakdown document. Analyze the provided SOP document and Figma design to create detailed breakdowns for each feature.

Reference Data Provided:
- SOP Document: Contains ${sop.featureBreakout.features.length} features with user journeys and LLD diagrams
- Design Tokens: ${tokens.colors.length} colors, ${tokens.typography.length} typography tokens, ${tokens.spacing.length} spacing tokens
- Components: ${components.length} components identified
- Analysis: ${analysis.summary.substring(0, 200)}...
- Accessibility: Score ${accessibilityReport.score}/100
- Design Structure: ${nodes.length} nodes with types: ${[...new Set(nodes.map(n => n.type))].join(', ')}

SOP Features to Break Down:
${sop.featureBreakout.features.map((f, i) => `${i + 1}. ${f.name}: ${f.description}`).join('\n')}

Full Context:
${JSON.stringify(context, null, 2)}

For EACH feature from the SOP document, create a detailed breakdown following this structure:

1. Feature Name and Description
   - Use the feature name and description from SOP

1.1. Frontend Feature
   - description: Detailed description of frontend implementation
   - components: Array of React/UI component names needed (based on SOP components and Figma design)
   - stateManagement: How state is managed (e.g., React hooks, Redux, Context API)
   - userInteractions: Array of user interactions (e.g., "User clicks login button", "User enters email")
   - designTokens: Array of design token names used (from SOP and design tokens)
   - accessibility: Array of accessibility considerations (from SOP accessibility notes and accessibility report)

1.2. Backend Feature
   - description: Detailed description of backend implementation
   - businessLogic: Array of business logic steps (e.g., "Validate user credentials", "Generate JWT token")
   - dataModels: Array of data models/entities needed (e.g., "User model with email, password, createdAt")
   - validations: Array of validation rules (e.g., "Email must be valid format", "Password minimum 8 characters")
   - errorHandling: Array of error scenarios and handling (e.g., "Invalid credentials → 401 Unauthorized")

1.3. API Endpoints
   - Array of API endpoints needed for this feature
   - Each endpoint should include:
     * method: HTTP method (GET, POST, PUT, DELETE, etc.)
     * path: API path (e.g., "/api/auth/login")
     * description: What this endpoint does
     * requestBody: Structure of request body (if applicable)
     * responseBody: Structure of response body
     * authentication: Authentication requirements (e.g., "Bearer token", "Public", "Session-based")

1.4. Test Cases
   - Array of test cases for frontend features
   - Each test case should include:
     * name: Test case name (e.g., "Login Success", "Login Failure - Invalid Email")
     * description: What is being tested
     * scenario: Step-by-step scenario
     * expectedResult: Expected outcome
     * testType: One of "unit", "integration", "e2e", or "accessibility"

IMPORTANT GUIDELINES:
- Base ALL content on the provided SOP features and Figma design
- For each feature in SOP.featureBreakout.features, create a detailed breakdown
- Consider the LLD diagrams from SOP to understand user flows
- Use component names from SOP and components array
- Use design tokens from SOP and designTokens
- Consider accessibility issues from accessibility report
- For API endpoints, think about RESTful design principles
- For test cases, consider all possible scenarios (success, failure, edge cases)
- Example: If SOP has a "Login" feature, create test cases like:
  * "Login Success - Valid credentials"
  * "Login Failure - Invalid email"
  * "Login Failure - Invalid password"
  * "Login Failure - Empty fields"
  * "Login Failure - Network error"
  * "Login Accessibility - Keyboard navigation"
- Be specific and actionable
- Reference actual component names, design tokens, and user flows from the SOP

Format as JSON:
{
  "title": "Feature Breakdown",
  "features": [
    {
      "name": "string (from SOP feature)",
      "description": "string (from SOP feature)",
      "frontendFeature": {
        "description": "string",
        "components": ["string"],
        "stateManagement": "string",
        "userInteractions": ["string"],
        "designTokens": ["string"],
        "accessibility": ["string"]
      },
      "backendFeature": {
        "description": "string",
        "businessLogic": ["string"],
        "dataModels": ["string"],
        "validations": ["string"],
        "errorHandling": ["string"]
      },
      "apiEndpoints": [
        {
          "method": "string",
          "path": "string",
          "description": "string",
          "requestBody": {},
          "responseBody": {},
          "authentication": "string"
        }
      ],
      "testCases": [
        {
          "name": "string",
          "description": "string",
          "scenario": "string",
          "expectedResult": "string",
          "testType": "unit" | "integration" | "e2e" | "accessibility"
        }
      ]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a technical architect creating comprehensive feature breakdowns. You analyze SOP documents and design systems to create detailed technical specifications including frontend, backend, API endpoints, and test cases. You base all recommendations ONLY on provided data, never on external assumptions.',
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

    const breakdownData = JSON.parse(content) as Omit<FeatureBreakdownDocument, 'fullDocument'>;
    
    // Generate the full markdown document
    const fullDocument = formatFeatureBreakdownAsMarkdown(breakdownData);

    return {
      ...breakdownData,
      fullDocument,
    };
  } catch (error) {
    console.error('Error in generateFeatureBreakdown:', error instanceof Error ? error.message : String(error));
    return generateDefaultFeatureBreakdown(sop, components);
  }
}

function formatFeatureBreakdownAsMarkdown(breakdown: Omit<FeatureBreakdownDocument, 'fullDocument'>): string {
  let markdown = `# ${breakdown.title}\n\n`;

  breakdown.features.forEach((feature, featureIndex) => {
    const featureNumber = featureIndex + 1;
    markdown += `## ${featureNumber}. ${feature.name}\n\n`;
    markdown += `${feature.description}\n\n`;

    // 1.1 Frontend Feature
    markdown += `### ${featureNumber}.1. Frontend Feature\n\n`;
    markdown += `${feature.frontendFeature.description}\n\n`;
    
    markdown += `**Components:**\n`;
    feature.frontendFeature.components.forEach(component => {
      markdown += `- ${component}\n`;
    });
    markdown += `\n`;

    markdown += `**State Management:**\n`;
    markdown += `${feature.frontendFeature.stateManagement}\n\n`;

    markdown += `**User Interactions:**\n`;
    feature.frontendFeature.userInteractions.forEach(interaction => {
      markdown += `- ${interaction}\n`;
    });
    markdown += `\n`;

    markdown += `**Design Tokens:**\n`;
    feature.frontendFeature.designTokens.forEach(token => {
      markdown += `- ${token}\n`;
    });
    markdown += `\n`;

    markdown += `**Accessibility:**\n`;
    feature.frontendFeature.accessibility.forEach(accessibility => {
      markdown += `- ${accessibility}\n`;
    });
    markdown += `\n`;

    // 1.2 Backend Feature
    markdown += `### ${featureNumber}.2. Backend Feature\n\n`;
    markdown += `${feature.backendFeature.description}\n\n`;

    markdown += `**Business Logic:**\n`;
    feature.backendFeature.businessLogic.forEach(logic => {
      markdown += `- ${logic}\n`;
    });
    markdown += `\n`;

    markdown += `**Data Models:**\n`;
    feature.backendFeature.dataModels.forEach(model => {
      markdown += `- ${model}\n`;
    });
    markdown += `\n`;

    markdown += `**Validations:**\n`;
    feature.backendFeature.validations.forEach(validation => {
      markdown += `- ${validation}\n`;
    });
    markdown += `\n`;

    markdown += `**Error Handling:**\n`;
    feature.backendFeature.errorHandling.forEach(error => {
      markdown += `- ${error}\n`;
    });
    markdown += `\n`;

    // 1.3 API Endpoints
    markdown += `### ${featureNumber}.3. API Endpoints\n\n`;
    if (feature.apiEndpoints.length === 0) {
      markdown += `No API endpoints required for this feature.\n\n`;
    } else {
      feature.apiEndpoints.forEach((endpoint, endpointIndex) => {
        markdown += `**Endpoint ${endpointIndex + 1}:**\n\n`;
        markdown += `- **Method:** \`${endpoint.method}\`\n`;
        markdown += `- **Path:** \`${endpoint.path}\`\n`;
        markdown += `- **Description:** ${endpoint.description}\n`;
        if (endpoint.authentication) {
          markdown += `- **Authentication:** ${endpoint.authentication}\n`;
        }
        if (endpoint.requestBody) {
          markdown += `- **Request Body:**\n`;
          markdown += `\`\`\`json\n${JSON.stringify(endpoint.requestBody, null, 2)}\n\`\`\`\n`;
        }
        if (endpoint.responseBody) {
          markdown += `- **Response Body:**\n`;
          markdown += `\`\`\`json\n${JSON.stringify(endpoint.responseBody, null, 2)}\n\`\`\`\n`;
        }
        markdown += `\n`;
      });
    }

    // 1.4 Test Cases
    markdown += `### ${featureNumber}.4. Test Cases\n\n`;
    if (feature.testCases.length === 0) {
      markdown += `No test cases defined for this feature.\n\n`;
    } else {
      feature.testCases.forEach((testCase, testIndex) => {
        markdown += `**Test Case ${testIndex + 1}: ${testCase.name}**\n\n`;
        markdown += `- **Type:** ${testCase.testType}\n`;
        markdown += `- **Description:** ${testCase.description}\n`;
        markdown += `- **Scenario:** ${testCase.scenario}\n`;
        markdown += `- **Expected Result:** ${testCase.expectedResult}\n\n`;
      });
    }

    if (featureIndex < breakdown.features.length - 1) {
      markdown += `---\n\n`;
    }
  });

  return markdown;
}

function generateDefaultFeatureBreakdown(sop: SOPDocument, components: ComponentDetection[]): FeatureBreakdownDocument {
  const features = sop.featureBreakout.features.map((feature, index) => ({
    name: feature.name,
    description: feature.description,
    frontendFeature: {
      description: `Frontend implementation for ${feature.name} using ${feature.components.join(', ')} components.`,
      components: feature.components.length > 0 ? feature.components : ['Component'],
      stateManagement: 'React hooks (useState, useEffect) for local state management',
      userInteractions: [
        `User interacts with ${feature.components[0] || 'component'}`,
        'User receives visual feedback',
      ],
      designTokens: feature.designTokens.length > 0 ? feature.designTokens : ['primary-500', 'spacing-4'],
      accessibility: feature.accessibilityNotes.length > 0 
        ? feature.accessibilityNotes 
        : ['Ensure keyboard navigation', 'Provide ARIA labels', 'Maintain color contrast'],
    },
    backendFeature: {
      description: `Backend implementation for ${feature.name} with business logic and data validation.`,
      businessLogic: [
        `Process ${feature.name} request`,
        'Validate input data',
        'Return appropriate response',
      ],
      dataModels: [
        `${feature.name} data model with required fields`,
      ],
      validations: [
        'Validate required fields',
        'Validate data format',
      ],
      errorHandling: [
        'Handle validation errors → 400 Bad Request',
        'Handle server errors → 500 Internal Server Error',
      ],
    },
    apiEndpoints: [
      {
        method: 'POST',
        path: `/api/${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
        description: `API endpoint for ${feature.name}`,
        requestBody: {
          data: 'object',
        },
        responseBody: {
          success: 'boolean',
          data: 'object',
        },
        authentication: 'Bearer token',
      },
    ],
    testCases: [
      {
        name: `${feature.name} Success`,
        description: `Test successful ${feature.name} operation`,
        scenario: 'User performs action with valid data',
        expectedResult: 'Operation completes successfully',
        testType: 'e2e' as const,
      },
      {
        name: `${feature.name} Failure - Invalid Input`,
        description: `Test ${feature.name} with invalid input`,
        scenario: 'User performs action with invalid data',
        expectedResult: 'Error message displayed',
        testType: 'integration' as const,
      },
      {
        name: `${feature.name} Accessibility`,
        description: `Test ${feature.name} accessibility`,
        scenario: 'User navigates using keyboard',
        expectedResult: 'All interactive elements are accessible',
        testType: 'accessibility' as const,
      },
    ],
  }));

  const breakdownData = {
    title: 'Feature Breakdown',
    features,
  };

  const fullDocument = formatFeatureBreakdownAsMarkdown(breakdownData);

  return {
    ...breakdownData,
    fullDocument,
  };
}

