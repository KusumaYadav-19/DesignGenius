# Testing the SOP Generator

This guide explains how to test the Statement of Procedure (SOP) generator.

## Prerequisites

1. **Node.js 18+** installed
2. **OpenAI API Key** set in environment (optional - will use fallback if not set)
3. **Backend dependencies** installed:
   ```bash
   cd backend-web
   npm install
   ```

## Option 1: Test SOP Generator Directly (Standalone)

This tests the SOP generator with mock data without needing the full API server.

```bash
cd backend-web
npm run test-sop
```

Or directly:
```bash
tsx test-sop-generator.js
```

**What it does:**
- Creates mock design tokens, analysis, components, and accessibility data
- Generates an SOP document using the SOP generator
- Displays the results including:
  - User Journey stories
  - Feature Breakout
  - LLD (Low Level Diagram)
  - Full document preview

## Option 2: Test Full API (Includes SOP)

This tests the complete API including SOP generation with real Figma data.

### Step 1: Start the Backend Server

```bash
cd backend-web
npm run dev
```

The server should start on `http://localhost:3002`

### Step 2: Run the Test Script

In a new terminal:

```bash
cd backend-web
npm run test-api
```

Or directly:
```bash
node test-api.js
```

**What it does:**
1. Checks if backend is running
2. Prompts for Figma file URL and access token
3. Lists available pages in the file
4. Lets you select a page to analyze
5. Analyzes the page (generates all outputs including SOP)
6. Displays results including SOP information
7. Saves all files to `output/session-{timestamp}/` directory

**SOP Output:**
- The SOP will be saved as `SOP.md` in the output directory
- The test script will display:
  - Number of user stories
  - Number of features
  - Number of LLD diagrams
  - Preview of user stories and features

## Option 3: Test via API Endpoint

You can also test by making a direct API call:

```bash
curl -X POST http://localhost:3002/api/analyse-page \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://www.figma.com/file/YOUR_FILE_KEY/YourDesign",
    "pageId": "YOUR_PAGE_ID",
    "accessToken": "YOUR_FIGMA_ACCESS_TOKEN"
  }'
```

The response will include the SOP in the `sop` field, and the file will be saved in the output directory.

## Expected Output Structure

The SOP document includes:

1. **Title**: "SOP"

2. **User Journey**:
   - 2-3 user stories (2-3 lines each)
   - Based on components and design structure

3. **Feature Breakout**:
   - Description of features
   - For each feature:
     - Name and description
     - Associated components
     - Design tokens used
     - Accessibility notes

4. **LLD (Low Level Diagram)**:
   - Description
   - Multiple diagrams (one per user journey)
   - Each diagram includes:
     - Journey name
     - Step-by-step flow
     - Component interactions
     - State changes
     - Data flow
     - Text-based diagram representation

## Output Files

After running the test, you'll find:

- `output/session-{timestamp}/SOP.md` - The full SOP document
- `output/session-{timestamp}/analysis-results.json` - Complete analysis results
- `output/session-{timestamp}/design-tokens.json` - Design tokens
- `output/session-{timestamp}/accessibility-report.json` - Accessibility report
- `output/session-{timestamp}/components.json` - Detected components
- And other generated files...

## Troubleshooting

### OpenAI API Key Not Set

If you don't have an OpenAI API key set, the SOP generator will use a fallback mode with basic default content. To use AI-generated content:

```bash
export OPENAI_API_KEY=your_api_key_here
```

Or create a `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

### Backend Not Running

If you get connection errors:
```bash
cd backend-web
npm run dev
```

### TypeScript Compilation Errors

If you see import errors, make sure TypeScript is compiled:
```bash
cd backend-web
npm run build
```

Or use tsx to run TypeScript directly:
```bash
npm run test-sop  # Uses tsx
```

## Example Output

```
╔══════════════════════════════════════════════════════════════╗
║              SOP Generator Test Script                      ║
╚══════════════════════════════════════════════════════════════╝

============================================================
Creating Mock Data
============================================================

✓ Mock data created:
  - Colors: 3
  - Typography: 2
  - Spacing: 2
  - Components: 2
  - Nodes: 2

============================================================
Testing SOP Generator
============================================================

⏳ Generating SOP document...

✓ SOP generated successfully!

============================================================
SOP Results
============================================================

Title: SOP

User Journey:
  User Stories: 3

  Story 1:
  As a user, I want to interact with the Button component...

Feature Breakout:
  Description: The design system consists of...
  Features: 2

  Feature 1: Button Component
    Description: Primary action button...
    Components: Button
    Design Tokens: primary-500, spacing-4
    Accessibility Notes: 3 notes

LLD (Low Level Diagram):
  Description: Low-level diagrams showing...
  Diagrams: 3

  Diagram 1: User Journey 1
    Steps: 3
      Step 1: User initiates interaction
        Component: Button
        State: Initial state
```

## Notes

- The standalone test (`test-sop-generator.js`) uses mock data and doesn't require a Figma file
- The full API test (`test-api.js`) requires a real Figma file URL and access token
- All generated files are saved in the `output/` directory
- The SOP document is generated in Markdown format for easy reading and editing

