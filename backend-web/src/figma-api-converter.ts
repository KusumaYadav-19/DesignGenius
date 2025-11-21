/**
 * Figma API Converter
 * Converts Figma API response format to our internal FigmaNode format
 */

import type { FigmaNode as ApiFigmaNode } from './figma-api-service.js';
import type { FigmaNode } from './figma-parser.js';

/**
 * Convert Figma API node to internal FigmaNode format
 */
export function convertApiNodeToInternal(apiNode: ApiFigmaNode): FigmaNode {
  const internalNode: FigmaNode = {
    id: apiNode.id,
    name: apiNode.name,
    type: apiNode.type,
  };

  // Convert children recursively
  if (apiNode.children && apiNode.children.length > 0) {
    internalNode.children = apiNode.children
      .filter((child) => child.visible !== false) // Filter out invisible nodes
      .map(convertApiNodeToInternal);
  }

  // Convert fills
  if (apiNode.fills && apiNode.fills.length > 0) {
    internalNode.fills = apiNode.fills
      .filter((fill) => fill.type === 'SOLID' && fill.color)
      .map((fill) => {
        if (!fill.color) return null;
        const fillObj: {
          type: string;
          color: { r: number; g: number; b: number; a: number };
          opacity?: number;
        } = {
          type: fill.type,
          color: {
            r: fill.color.r,
            g: fill.color.g,
            b: fill.color.b,
            a: fill.color.a ?? fill.opacity ?? 1,
          },
        };
        if (fill.opacity !== undefined) {
          fillObj.opacity = fill.opacity;
        }
        return fillObj;
      })
      .filter((fill): fill is NonNullable<typeof fill> => fill !== null);
  }

  // Convert strokes
  if (apiNode.strokes && apiNode.strokes.length > 0) {
    internalNode.strokes = apiNode.strokes
      .filter((stroke) => stroke.type === 'SOLID' && stroke.color)
      .map((stroke) => {
        if (!stroke.color) return null;
        return {
          type: stroke.type,
          color: {
            r: stroke.color.r,
            g: stroke.color.g,
            b: stroke.color.b,
            a: stroke.color.a ?? stroke.opacity ?? 1,
          },
        };
      })
      .filter((stroke): stroke is NonNullable<typeof stroke> => stroke !== null);
  }

  // Convert effects
  if (apiNode.effects && apiNode.effects.length > 0) {
    internalNode.effects = apiNode.effects
      .filter((effect) => effect.visible !== false && effect.color)
      .map((effect) => {
        if (!effect.color) return null;
        return {
          type: effect.type,
          color: {
            r: effect.color.r,
            g: effect.color.g,
            b: effect.color.b,
            a: effect.color.a ?? 1,
          },
        };
      })
      .filter((effect): effect is NonNullable<typeof effect> => effect !== null);
  }

  // Convert text properties
  if (apiNode.characters) {
    internalNode.characters = apiNode.characters;
  }

  if (apiNode.style) {
    const style = apiNode.style;
    
    // Convert line height
    let lineHeight: number | { value: number; unit: string } = 0;
    if (style.lineHeightPx !== undefined) {
      lineHeight = style.lineHeightPx;
    } else if (style.lineHeightPercent !== undefined) {
      lineHeight = {
        value: style.lineHeightPercent,
        unit: 'PERCENT',
      };
    } else if (style.lineHeightPercentFontSize !== undefined) {
      lineHeight = {
        value: style.lineHeightPercentFontSize,
        unit: 'PERCENT',
      };
    } else if (style.fontSize) {
      lineHeight = style.fontSize * 1.2; // Default line height
    }

    // Convert letter spacing
    let letterSpacing: number | { value: number; unit: string } = 0;
    if (style.letterSpacing !== undefined) {
      if (style.letterSpacingUnit === 'PIXELS') {
        letterSpacing = style.letterSpacing;
      } else {
        letterSpacing = {
          value: style.letterSpacing,
          unit: style.letterSpacingUnit || 'PIXELS',
        };
      }
    }

    internalNode.style = {
      ...(style.fontFamily !== undefined && { fontFamily: style.fontFamily }),
      ...(style.fontSize !== undefined && { fontSize: style.fontSize }),
      ...(style.fontWeight !== undefined && { fontWeight: style.fontWeight }),
      lineHeight: lineHeight,
      letterSpacing: letterSpacing,
      ...(style.textCase !== undefined && { textCase: style.textCase }),
    };
  }

  // Convert layout properties
  if (apiNode.layoutMode) {
    internalNode.layoutMode = apiNode.layoutMode;
  }

  if (apiNode.paddingLeft !== undefined) {
    internalNode.paddingLeft = apiNode.paddingLeft;
  }
  if (apiNode.paddingRight !== undefined) {
    internalNode.paddingRight = apiNode.paddingRight;
  }
  if (apiNode.paddingTop !== undefined) {
    internalNode.paddingTop = apiNode.paddingTop;
  }
  if (apiNode.paddingBottom !== undefined) {
    internalNode.paddingBottom = apiNode.paddingBottom;
  }

  if (apiNode.itemSpacing !== undefined) {
    internalNode.itemSpacing = apiNode.itemSpacing;
  }

  // Convert corner radius
  if (apiNode.cornerRadius !== undefined) {
    internalNode.cornerRadius = apiNode.cornerRadius;
  } else if (apiNode.rectangleCornerRadii) {
    const [topLeft, topRight, bottomRight, bottomLeft] = apiNode.rectangleCornerRadii;
    internalNode.cornerRadius = {
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
    };
  }

  // Convert dimensions and position
  if (apiNode.width !== undefined) {
    internalNode.width = apiNode.width;
  }
  if (apiNode.height !== undefined) {
    internalNode.height = apiNode.height;
  }
  if (apiNode.x !== undefined) {
    internalNode.x = apiNode.x;
  }
  if (apiNode.y !== undefined) {
    internalNode.y = apiNode.y;
  }

  // Use absoluteBoundingBox if available
  if (apiNode.absoluteBoundingBox) {
    internalNode.x = apiNode.absoluteBoundingBox.x;
    internalNode.y = apiNode.absoluteBoundingBox.y;
    internalNode.width = apiNode.absoluteBoundingBox.width;
    internalNode.height = apiNode.absoluteBoundingBox.height;
  }

  return internalNode;
}

/**
 * Convert an array of API nodes to internal format
 */
export function convertApiNodesToInternal(apiNodes: ApiFigmaNode[]): FigmaNode[] {
  return apiNodes.map(convertApiNodeToInternal);
}

