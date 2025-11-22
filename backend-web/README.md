# Figma Design Analyzer - Web Backend

This is the web-based backend for analyzing Figma designs via URL. It allows users to paste a Figma file URL and analyze any page from that file.

## Features

- Extract file information from Figma URLs
- List all pages in a Figma file
- Analyze specific pages and generate:
  - Design tokens (colors, typography, spacing, border radius)
  - React components
  - Tailwind CSS configuration
  - Accessibility reports
  - Component detection
  - Naming suggestions
  - SOP documents

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `backend-web` directory:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3002
```

**Note**: `FIGMA_ACCESS_TOKEN` is no longer required in the environment. The access token is now provided by the frontend in each request, allowing users to use their own tokens.

## Running

Development mode:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Production:
```bash
npm start
```

## API Endpoints

### GET /health
Health check endpoint.

### POST /api/file-info
Get file information and list of pages.

**Request Body:**
```json
{
  "fileUrl": "https://www.figma.com/file/{fileKey}/...",
  "accessToken": "figd_xxxxxxxxxxxxxxxxxxxxx"
}
```

**Required Fields:**
- `fileUrl`: The full Figma file URL
- `accessToken`: The user's Figma access token (provided by frontend)

**Response:**
```json
{
  "success": true,
  "fileKey": "abc123",
  "fileName": "Design",
  "pages": [
    {
      "id": "page-id-1",
      "name": "Page 1"
    },
    {
      "id": "page-id-2",
      "name": "Page 2"
    }
  ]
}
```

### POST /api/analyse-page
Analyze a specific page from a Figma file.

**Request Body:**
```json
{
  "fileUrl": "https://www.figma.com/file/{fileKey}/...",
  "pageId": "page-id-1",
  "accessToken": "figd_xxxxxxxxxxxxxxxxxxxxx"
}
```

**Required Fields:**
- `fileUrl`: The full Figma file URL
- `pageId`: The ID of the page to analyze (from `/api/file-info` response)
- `accessToken`: The user's Figma access token (provided by frontend)

**Response:**
Same as the original `/analyse-design` endpoint, with additional fields:
- `fileKey`: The Figma file key
- `pageId`: The analyzed page ID
- `pageName`: The analyzed page name

## Usage Flow

1. User pastes a Figma file URL and their Figma access token in your web UI
2. Call `/api/file-info` with both `fileUrl` and `accessToken` to get the list of pages
3. Show a dropdown with page names (using `id` and `name` from the response) for user selection
4. When user selects a page, call `/api/analyse-page` with `fileUrl`, `pageId`, and `accessToken`
5. Display the analysis results

**Example Frontend Flow:**
```javascript
// Step 1: Get pages list
const response = await fetch('/api/file-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileUrl: userProvidedUrl,
    accessToken: userProvidedToken
  })
});

const { pages } = await response.json();
// pages = [{ id: "page-id-1", name: "Page 1" }, ...]

// Step 2: User selects a page, then analyze
const analysisResponse = await fetch('/api/analyse-page', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileUrl: userProvidedUrl,
    pageId: selectedPageId,
    accessToken: userProvidedToken
  })
});
```

## File Access Permissions

**Important**: Your Figma access token can only access files that:

1. **You own** - Files created in your account
2. **Are shared with you** - Files that other users have shared with your account (view or edit access)
3. **Are public** - Files that have been made publicly accessible

If you try to analyze a file that is:
- Private and not shared with your account → You'll get a `403 Permission Denied` error
- Doesn't exist or URL is incorrect → You'll get a `404 File Not Found` error

### Solutions for accessing other people's files:

1. **Ask the file owner to share it** with your account (recommended)
2. **Ask the file owner to make the file public** (if appropriate)
3. **Use the file owner's access token** (if they provide one)

The API will return clear error messages when access is denied, including:
- `errorCode: "PERMISSION_DENIED"` - File is not accessible with your token
- `errorCode: "FILE_NOT_FOUND"` - File doesn't exist or URL is invalid

## Notes

- The server runs on port 3002 by default (different from the plugin backend which uses 3001)
- All analysis outputs are saved to `backend-web/output/session-{timestamp}/`
- **Access tokens are provided by the frontend** - each user uses their own Figma access token
- This allows users to analyze files they have access to with their own tokens
- Error handling includes specific messages for permission and access issues
- Users can get their Figma access token from: https://www.figma.com/developers/api#access-tokens

