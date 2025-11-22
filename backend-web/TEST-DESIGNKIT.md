# Testing DesignKit Generation

This guide explains how to test the DesignKit generation feature.

## Prerequisites

1. **Backend server running** on `http://localhost:3002`
2. **OpenAI API Key** set in `.env` file (required for DesignKit generation)
3. **Figma Access Token** (to access Figma files)

## Quick Test

### Step 1: Start the Backend Server

```bash
cd backend-web
npm run dev
```

Make sure the server is running and you see:
```
Server running on port 3002
```

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

### Step 3: Follow the Interactive Prompts

1. **Enter Figma File URL**: Provide a valid Figma file URL
   - Example: `https://www.figma.com/file/abc123/MyDesign`
   
2. **Enter Figma Access Token**: Your Figma personal access token
   - Get one from: https://www.figma.com/developers/api#access-tokens

3. **Select a Page**: Choose which page to analyze from the list

4. **Wait for Analysis**: The script will:
   - Analyze the design
   - Generate design tokens
   - Generate DesignKit
   - Create all output files

### Step 4: Check the Results

The test script will display:
- ✅ DesignKit information
- ✅ Typography typefaces count
- ✅ Guidelines count for each section
- ✅ Preview of DesignKit content

You can also:
- View DesignKit preview in the terminal
- Check the generated `DesignKit.md` file in the output directory

## Output Files

After running the test, check the output directory:

```
backend-web/output/session-{timestamp}/
├── DesignKit.md          ← New DesignKit file
├── analysis-results.json
├── design-tokens.json
├── SOP.md
├── accessibility-report.json
└── ... other files
```

## DesignKit Structure

The generated `DesignKit.md` includes:

1. **Title**: "Guide Lines"
2. **Subtitle**: "Style-Guides"
3. **Typography**: 
   - Each typeface with purpose, reasoning, usage, function, hierarchy, patterns, constraints, and component appearance
4. **Iconography**: 
   - Description, guidelines, and usage
5. **Spacing System**: 
   - Description, scale, usage, and guidelines
6. **Color System**: 
   - Description, palette, usage, and guidelines
7. **Grid and Layout System**: 
   - Description, rules, and guidelines

## Testing Without OpenAI

If OpenAI API key is not set, the system will generate a default DesignKit based on the design tokens. This is useful for testing the structure, but won't have the detailed AI-generated guidelines.

## Troubleshooting

### DesignKit Not Generated

**Issue**: DesignKit section missing from results

**Solutions**:
1. Check that OpenAI API key is set in `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```
2. Check server logs for errors
3. Verify the backend server is running the latest code

### OpenAI API Errors

**Issue**: Errors related to OpenAI API

**Solutions**:
1. Verify your OpenAI API key is valid
2. Check your OpenAI account has credits
3. The system will fall back to default DesignKit if OpenAI fails

### Test Script Errors

**Issue**: Cannot connect to backend

**Solutions**:
1. Make sure backend is running: `npm run dev`
2. Check the port (default: 3002)
3. Verify `BACKEND_URL` environment variable if using custom port

## Example Output

```
📘 DesignKit:
  Title: Guide Lines
  Subtitle: Style-Guides
  Typography Typefaces: 11
  Iconography Guidelines: 3
  Spacing Guidelines: 3
  Color Guidelines: 3
  Grid & Layout Rules: 3

  Typography Typefaces Preview:
    1. heading-bold
       Purpose: Used for primary headings and titles...
    2. body-large-medium
       Purpose: Used for large body text...
    3. body-small-medium
       Purpose: Used for small body text...
    ... and 8 more

✓ DesignKit saved to: /path/to/output/session-xxx/DesignKit.md
```

## Next Steps

After testing:
1. Review the generated `DesignKit.md` file
2. Check that all sections are populated
3. Verify guidelines are based on the actual design tokens
4. Test with different Figma files to see variations

