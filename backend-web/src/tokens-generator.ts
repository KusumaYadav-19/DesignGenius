import type { ParsedDesign, ParsedColor, ParsedTextStyle } from './figma-parser.js';

export interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  borderRadius: BorderRadiusToken[];
}

export interface ColorToken {
  name: string;
  value: string;
  hex: string;
  rgba: string;
  category: 'primary' | 'secondary' | 'neutral' | 'semantic';
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textCase?: string;
}

export interface SpacingToken {
  name: string;
  value: number;
  category: 'padding' | 'margin' | 'gap';
}

export interface BorderRadiusToken {
  name: string;
  value: number;
}

function generateColorName(color: ParsedColor, index: number, allColors: ParsedColor[]): string {
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  
  if (brightness < 0.3) {
    return `neutral-${index + 1}-dark`;
  } else if (brightness > 0.7) {
    return `neutral-${index + 1}-light`;
  } else if (color.r > color.g && color.r > color.b) {
    return `primary-${index + 1}`;
  } else if (color.g > color.r && color.g > color.b) {
    return `secondary-${index + 1}`;
  } else {
    return `semantic-${index + 1}`;
  }
}

function categorizeColor(color: ParsedColor, index: number, allColors: ParsedColor[]): 'primary' | 'secondary' | 'neutral' | 'semantic' {
  const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  
  if (brightness < 0.3 || brightness > 0.7) {
    return 'neutral';
  } else if (color.r > color.g && color.r > color.b) {
    return 'primary';
  } else if (color.g > color.r && color.g > color.b) {
    return 'secondary';
  } else {
    return 'semantic';
  }
}

export function generateColorTokens(colors: ParsedColor[]): ColorToken[] {
  const tokens: ColorToken[] = colors.map((color, index) => ({
    name: generateColorName(color, index, colors),
    value: color.hex,
    hex: color.hex,
    rgba: color.rgba,
    category: categorizeColor(color, index, colors),
  }));

  return tokens;
}

function generateTypographyName(style: ParsedTextStyle, index: number): string {
  const size = style.fontSize;
  const weight = style.fontWeight;
  
  if (size >= 32) return `heading-${weight >= 700 ? 'bold' : 'regular'}`;
  if (size >= 24) return `subheading-${weight >= 600 ? 'semibold' : 'regular'}`;
  if (size >= 18) return `body-large-${weight >= 500 ? 'medium' : 'regular'}`;
  if (size >= 16) return `body-${weight >= 500 ? 'medium' : 'regular'}`;
  if (size >= 14) return `body-small-${weight >= 500 ? 'medium' : 'regular'}`;
  return `caption-${weight >= 500 ? 'medium' : 'regular'}`;
}

export function generateTypographyTokens(textStyles: ParsedTextStyle[]): TypographyToken[] {
  
  const uniqueStyles = new Map<string, ParsedTextStyle>();
  textStyles.forEach(style => {
    const key = `${style.fontFamily}-${style.fontSize}-${style.fontWeight}`;
    if (!uniqueStyles.has(key)) {
      uniqueStyles.set(key, style);
    }
  });

  const tokens: TypographyToken[] = Array.from(uniqueStyles.values()).map((style, index) => {
    const token: TypographyToken = {
      name: generateTypographyName(style, index),
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
    };
    if (style.textCase !== undefined) {
      token.textCase = style.textCase;
    }
    return token;
  });

  return tokens;
}

export function generateSpacingTokens(spacing: number[]): SpacingToken[] {
  
  const uniqueSpacing = [...new Set(spacing)].sort((a, b) => a - b);
  
  const tokens: SpacingToken[] = uniqueSpacing.map((value, index) => {
    let name: string;
    if (value === 0) name = 'none';
    else if (value <= 4) name = `xs-${index}`;
    else if (value <= 8) name = `sm-${index}`;
    else if (value <= 16) name = `md-${index}`;
    else if (value <= 24) name = `lg-${index}`;
    else if (value <= 32) name = `xl-${index}`;
    else name = `xxl-${index}`;

    return {
      name,
      value,
      category: 'gap' as const,
    };
  });

  return tokens;
}

export function generateBorderRadiusTokens(borderRadius: number[]): BorderRadiusToken[] {
  
  const uniqueRadius = [...new Set(borderRadius)].sort((a, b) => a - b);
  
  const tokens: BorderRadiusToken[] = uniqueRadius.map((value, index) => {
    let name: string;
    if (value === 0) name = 'none';
    else if (value <= 4) name = `sm-${index}`;
    else if (value <= 8) name = `md-${index}`;
    else if (value <= 16) name = `lg-${index}`;
    else name = `xl-${index}`;

    return {
      name,
      value,
    };
  });

  return tokens;
}

export function generateDesignTokens(parsedDesign: ParsedDesign): DesignTokens {
  const colors = generateColorTokens(parsedDesign.colors);
  const typography = generateTypographyTokens(parsedDesign.textStyles);
  
  const allSpacingValues = [
    ...parsedDesign.autoLayouts.flatMap(l => [
      l.padding.left, l.padding.right, l.padding.top, l.padding.bottom, l.spacing
    ]),
    ...parsedDesign.spacing.flatMap(s => [
      s.padding?.left, s.padding?.right, s.padding?.top, s.padding?.bottom,
      s.margin?.left, s.margin?.right, s.margin?.top, s.margin?.bottom,
      s.gap
    ].filter(v => v !== undefined) as number[])
  ];
  
  const spacing = generateSpacingTokens(allSpacingValues);
  const borderRadius = generateBorderRadiusTokens(parsedDesign.borderRadius);

  return {
    colors,
    typography,
    spacing,
    borderRadius,
  };
}

