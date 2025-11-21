export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    opacity?: number;
  }>;
  strokes?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
  }>;
  effects?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
  }>;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: { value: number; unit: string } | number;
    letterSpacing?: { value: number; unit: string } | number;
    textCase?: string;
  };
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  cornerRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface ParsedTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textCase?: string;
}

export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
  rgba: string;
}

export interface ParsedAutoLayout {
  direction: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  spacing: number;
}

export interface ParsedSpacing {
  padding?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  margin?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  gap?: number;
}

export interface ParsedDesign {
  textStyles: ParsedTextStyle[];
  colors: ParsedColor[];
  autoLayouts: ParsedAutoLayout[];
  spacing: ParsedSpacing[];
  borderRadius: number[];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToRgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(2)})`;
}

export function extractTextStyles(nodes: FigmaNode[]): ParsedTextStyle[] {
  const textStyles: Map<string, ParsedTextStyle> = new Map();

  function traverse(node: FigmaNode) {
    if (node.type === 'TEXT' && node.style) {
      const style = node.style;
      const key = `${style.fontFamily || 'Unknown'}-${style.fontSize || 0}-${style.fontWeight || 400}`;
      
      if (!textStyles.has(key)) {
        const lineHeight = typeof style.lineHeight === 'object' 
          ? style.lineHeight.value 
          : (style.lineHeight || style.fontSize || 16);
        
        const letterSpacing = typeof style.letterSpacing === 'object'
          ? style.letterSpacing.value
          : (style.letterSpacing || 0);

        const textStyle: ParsedTextStyle = {
          fontFamily: style.fontFamily || 'Inter',
          fontSize: style.fontSize || 16,
          fontWeight: style.fontWeight || 400,
          lineHeight: lineHeight,
          letterSpacing: letterSpacing,
        };
        if (style.textCase !== undefined) {
          textStyle.textCase = style.textCase;
        }
        textStyles.set(key, textStyle);
      }
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  const styles = Array.from(textStyles.values());
  return styles;
}

export function extractColors(nodes: FigmaNode[]): ParsedColor[] {
  const colors: Map<string, ParsedColor> = new Map();

  function extractColorFromFill(fill: any): ParsedColor | null {
    if (fill.type === 'SOLID' && fill.color) {
      const { r, g, b, a = 1 } = fill.color;
      const hex = rgbToHex(r, g, b);
      const rgba = rgbToRgba(r, g, b, a);
      const key = hex;

      if (!colors.has(key)) {
        colors.set(key, { r, g, b, a, hex, rgba });
      }
      return colors.get(key)!;
    }
    return null;
  }

  function traverse(node: FigmaNode) {
    if (node.fills) {
      node.fills.forEach(extractColorFromFill);
    }
    if (node.strokes) {
      node.strokes.forEach(extractColorFromFill);
    }
    if (node.effects) {
      node.effects.forEach((effect: any) => {
        if (effect.color) {
          extractColorFromFill({ type: 'SOLID', color: effect.color });
        }
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  const colorArray = Array.from(colors.values());
  return colorArray;
}

export function extractAutoLayoutInfo(nodes: FigmaNode[]): ParsedAutoLayout[] {
  const layouts: ParsedAutoLayout[] = [];

  function traverse(node: FigmaNode) {
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      layouts.push({
        direction: node.layoutMode,
        padding: {
          left: node.paddingLeft || 0,
          right: node.paddingRight || 0,
          top: node.paddingTop || 0,
          bottom: node.paddingBottom || 0,
        },
        spacing: node.itemSpacing || 0,
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return layouts;
}

export function extractSpacing(nodes: FigmaNode[]): ParsedSpacing[] {
  const spacing: ParsedSpacing[] = [];

  function traverse(node: FigmaNode) {
    const spacingData: ParsedSpacing = {};

    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      spacingData.padding = {
        left: node.paddingLeft || 0,
        right: node.paddingRight || 0,
        top: node.paddingTop || 0,
        bottom: node.paddingBottom || 0,
      };
    }

    if (node.itemSpacing !== undefined) {
      spacingData.gap = node.itemSpacing;
    }

    if (Object.keys(spacingData).length > 0) {
      spacing.push(spacingData);
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return spacing;
}

export function parseFigmaNodes(nodes: FigmaNode[]): ParsedDesign {
  const textStyles = extractTextStyles(nodes);
  const colors = extractColors(nodes);
  const autoLayouts = extractAutoLayoutInfo(nodes);
  const spacing = extractSpacing(nodes);
  
  const borderRadius: number[] = [];
  function extractBorderRadius(node: FigmaNode) {
    if (node.cornerRadius !== undefined) {
      if (typeof node.cornerRadius === 'number') {
        if (!borderRadius.includes(node.cornerRadius)) {
          borderRadius.push(node.cornerRadius);
        }
      } else {
        const values = [
          node.cornerRadius.topLeft,
          node.cornerRadius.topRight,
          node.cornerRadius.bottomLeft,
          node.cornerRadius.bottomRight,
        ];
        values.forEach(val => {
          if (!borderRadius.includes(val)) {
            borderRadius.push(val);
          }
        });
      }
    }
    if (node.children) {
      node.children.forEach(extractBorderRadius);
    }
  }
  nodes.forEach(extractBorderRadius);

  return {
    textStyles,
    colors,
    autoLayouts,
    spacing,
    borderRadius: [...new Set(borderRadius)].sort((a, b) => a - b),
  };
}

