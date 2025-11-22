/**
 * Figma API Service
 * Handles communication with Figma REST API
 */

export interface FigmaFileInfo {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaDocument;
}

export interface FigmaDocument {
  id: string;
  name: string;
  type: string;
  children: FigmaPage[];
}

export interface FigmaPage {
  id: string;
  name: string;
  type: 'CANVAS';
  children: FigmaNode[];
  backgroundColor?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  locked?: boolean;
  children?: FigmaNode[];
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    opacity?: number;
    blendMode?: string;
  }>;
  strokes?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    opacity?: number;
  }>;
  effects?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    radius?: number;
    visible?: boolean;
  }>;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeightPx?: number;
    lineHeightPercent?: number;
    lineHeightPercentFontSize?: number;
    lineHeightUnit?: string;
    letterSpacing?: number;
    letterSpacingUnit?: string;
    textCase?: string;
    textDecoration?: string;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
  };
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Extract file key from Figma URL
 * Supports formats:
 * - https://www.figma.com/file/{fileKey}/...
 * - https://figma.com/file/{fileKey}/...
 * - https://www.figma.com/design/{fileKey}/... (new format)
 * - https://figma.com/design/{fileKey}/... (new format)
 */
export function extractFileKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // Check for both 'file' and 'design' paths (new Figma format uses 'design')
    const fileIndex = pathParts.indexOf('file');
    const designIndex = pathParts.indexOf('design');
    
    // Try 'file' format first (old format)
    if (fileIndex !== -1 && pathParts[fileIndex + 1]) {
      return pathParts[fileIndex + 1] || null;
    }
    
    // Try 'design' format (new format)
    if (designIndex !== -1 && pathParts[designIndex + 1]) {
      return pathParts[designIndex + 1] || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting file key from URL:', error);
    return null;
  }
}

/**
 * Get file information from Figma API
 */
export async function getFileInfo(fileKey: string, accessToken: string): Promise<FigmaFileInfo> {
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': accessToken,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Figma API error: ${response.status} ${response.statusText}`;
    
    // Check for rate limit (429 status code)
    if (response.status === 429) {
      errorMessage = 'Rate limit exceeded';
      throw new Error(errorMessage);
    }
    
    // Try to parse error message from response
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.err) {
        errorMessage = errorData.err;
      }
    } catch {
      // If parsing fails, use the raw text
      if (errorText) {
        errorMessage += ` - ${errorText}`;
      }
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data as FigmaFileInfo;
}

/**
 * Get nodes from a specific page
 */
export async function getPageNodes(
  fileKey: string,
  nodeIds: string[],
  accessToken: string
): Promise<{ nodes: Record<string, FigmaNode> }> {
  const ids = nodeIds.join(',');
  const response = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${ids}`,
    {
      headers: {
        'X-Figma-Token': accessToken,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    
    // Check for rate limit (429 status code)
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    
    throw new Error(`Figma API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data as { nodes: Record<string, FigmaNode> };
}

/**
 * Get all pages from a file
 */
export function getPagesFromFile(fileInfo: FigmaFileInfo): FigmaPage[] {
  return fileInfo.document.children.filter(
    (child) => child.type === 'CANVAS'
  ) as FigmaPage[];
}

