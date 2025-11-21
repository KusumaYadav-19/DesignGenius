# Test Script for Backend API

This test script allows you to interactively test the backend-web API endpoints.

## Prerequisites

1. **Node.js 18+** (for native `fetch` API support)
2. **Backend server running** on `http://localhost:3002` (or set `BACKEND_URL` environment variable)

## Setup

1. Make sure the backend server is running:
   ```bash
   npm run dev
   ```

2. The test script is ready to use - no additional dependencies needed (uses Node.js built-in modules).

## Usage

### Basic Usage

```bash
npm run test-api
```

Or directly:
```bash
node test-api.js
```

### With Custom Backend URL

```bash
BACKEND_URL=http://localhost:3002 node test-api.js
```

## What the Script Does

1. **Checks Backend Connection**
   - Verifies the backend server is running
   - Tests the `/health` endpoint

2. **Gets File Information**
   - Prompts for Figma file URL
   - Prompts for Figma access token
   - Calls `/api/file-info` endpoint
   - Displays list of pages with IDs and names

3. **Page Selection**
   - Shows numbered list of pages
   - Allows you to select a page by number
   - Validates your selection

4. **Page Analysis**
   - Calls `/api/analyse-page` endpoint
   - Shows progress indicator
   - Waits for analysis to complete

5. **Results Display**
   - Shows summary of analysis results:
     - Basic information (session ID, file key, page name)
     - Design analysis (summary, recommendations, issues)
     - Design tokens (colors, typography, spacing, etc.)
     - Components detected
     - Accessibility report
     - Generated files list
   - Optionally shows full JSON results
   - Saves summary to `test-results-summary.json`

## Example Session

```
╔══════════════════════════════════════════════════════════════╗
║     Figma Design Analyzer - Backend API Test Script        ║
╚══════════════════════════════════════════════════════════════╝

Checking backend connection at: http://localhost:3002
✓ Backend is running

Please provide the following information:

Figma File URL: https://www.figma.com/file/abc123/MyDesign
Figma Access Token: figd_xxxxxxxxxxxxx

============================================================
Step 1: Getting File Information
============================================================

Requesting file info from: http://localhost:3002/api/file-info
✓ Successfully retrieved file information
File Name: MyDesign
File Key: abc123
Total Pages: 3

============================================================
Step 2: Select a Page to Analyze
============================================================

Available Pages:

1. Home Page
   ID: 1:23

2. About Page
   ID: 2:45

3. Contact Page
   ID: 3:67

Enter page number (1-3) or 'q' to quit: 1

✓ Selected: Home Page (1:23)

============================================================
Step 3: Analyzing Page
============================================================

⏳ This may take a while... Please wait...

✓ Analysis completed successfully!

============================================================
Analysis Results
============================================================

📋 Basic Information:
  Session ID: session-1234567890
  Timestamp: 2025-01-21T10:30:00.000Z
  File Key: abc123
  Page ID: 1:23
  Page Name: Home Page
  Output Path: /path/to/output/session-1234567890

📊 Design Analysis:
  Summary: A well-structured design with...
  Strengths: 3
  Issues: 2
  Recommendations: 5

🎨 Design Tokens:
  Colors: 12
  Typography: 8
  Spacing: 15
  Border Radius: 6

🧩 Components Detected:
  Total: 5

♿ Accessibility Report:
  Score: 85/100
  Issues: 2
  Summary: Good accessibility with minor improvements needed

📁 Generated Files:
  analysisResults: analysis-results.json
  designTokens: design-tokens.json
  reactComponent: Component.tsx
  ...

Show full JSON results? (y/n): n

✓ Summary saved to: test-results-summary.json
✓ Test completed successfully!
```

## Output Files

The script creates:
- `test-results-summary.json` - Summary of the analysis results in the test script directory
- Full analysis files are saved in `backend-web/output/session-{timestamp}/` by the backend

## Troubleshooting

### Backend Not Running
```
✗ Cannot connect to backend: fetch failed
Make sure the backend server is running on http://localhost:3002
Start it with: cd backend-web && npm run dev
```

**Solution:** Start the backend server first:
```bash
npm run dev
```

### Invalid File URL or Token
```
Error: Access denied. This file is not shared with your account...
Error Code: PERMISSION_DENIED
```

**Solution:** 
- Make sure the file is shared with your account
- Verify your access token is correct
- Check that the file URL is valid

### Node.js Version Too Old
If you get errors about `fetch` not being available, you need Node.js 18+:
```bash
node --version  # Should show v18.0.0 or higher
```

## Features

- ✅ Interactive command-line interface
- ✅ Colored output for better readability
- ✅ Progress indicators
- ✅ Error handling with helpful messages
- ✅ Summary of results
- ✅ Option to view full JSON
- ✅ Saves summary to file
- ✅ Validates user input
- ✅ Health check before starting

## Notes

- The script uses Node.js built-in `fetch` (available in Node 18+)
- No additional npm packages required
- All results are also saved by the backend in the `output/` directory
- The script is interactive - you'll need to provide input when prompted

