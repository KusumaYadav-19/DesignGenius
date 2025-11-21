import type { DesignTokens, ColorToken, TypographyToken, SpacingToken } from './tokens-generator.js';
import type { FigmaNode } from './figma-parser.js';

export interface GeneratedCode {
  reactComponent: string;
  tailwindConfig: string;
  componentExample: string;
}

function generateTailwindConfig(tokens: DesignTokens): string {
  
  const colorTokens: Record<string, string> = {};
  tokens.colors.forEach(token => {
    colorTokens[token.name] = token.hex;
  });

  const fontSizeTokens: Record<string, [string, { lineHeight: string; letterSpacing?: string }]> = {};
  tokens.typography.forEach(token => {
    fontSizeTokens[token.name] = [
      `${token.fontSize}px`,
      {
        lineHeight: `${token.lineHeight}px`,
        ...(token.letterSpacing !== 0 && { letterSpacing: `${token.letterSpacing}px` }),
      },
    ];
  });

  const spacingTokens: Record<string, string> = {};
  tokens.spacing.forEach(token => {
    spacingTokens[token.name] = `${token.value}px`;
  });

  const borderRadiusTokens: Record<string, string> = {};
  tokens.borderRadius.forEach(token => {
    borderRadiusTokens[token.name] = `${token.value}px`;
  });

  const config = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(colorTokens, null, 8)},
      fontSize: ${JSON.stringify(fontSizeTokens, null, 8)},
      spacing: ${JSON.stringify(spacingTokens, null, 8)},
      borderRadius: ${JSON.stringify(borderRadiusTokens, null, 8)},
    },
  },
  plugins: [],
}`;

  return config;
}

function generateReactComponent(node: FigmaNode, tokens: DesignTokens): string {
  
  const componentName = node.name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^[a-z]/, (match) => match.toUpperCase())
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) || 'Component';

  const hasAutoLayout = node.layoutMode && node.layoutMode !== 'NONE';
  const flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
  const gap = node.itemSpacing ? `gap-${tokens.spacing.find(s => s.value === node.itemSpacing)?.name || 'md-0'}` : '';
  
  const paddingClasses: string[] = [];
  if (node.paddingLeft) paddingClasses.push(`pl-${tokens.spacing.find(s => s.value === node.paddingLeft)?.name || 'md-0'}`);
  if (node.paddingRight) paddingClasses.push(`pr-${tokens.spacing.find(s => s.value === node.paddingRight)?.name || 'md-0'}`);
  if (node.paddingTop) paddingClasses.push(`pt-${tokens.spacing.find(s => s.value === node.paddingTop)?.name || 'md-0'}`);
  if (node.paddingBottom) paddingClasses.push(`pb-${tokens.spacing.find(s => s.value === node.paddingBottom)?.name || 'md-0'}`);

  const bgColor = node.fills?.[0]?.color;
  // Convert hex to RGB for comparison
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result || !result[1] || !result[2] || !result[3]) return null;
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    };
  };
  
  const bgClass = bgColor ? (() => {
    const matchingToken = tokens.colors.find(c => {
      const tokenRgb = hexToRgb(c.hex);
      if (!tokenRgb) return false;
      return Math.abs(tokenRgb.r - bgColor.r) < 0.01 && 
             Math.abs(tokenRgb.g - bgColor.g) < 0.01 && 
             Math.abs(tokenRgb.b - bgColor.b) < 0.01;
    });
    return `bg-${matchingToken?.name || 'neutral-1'}`;
  })() : '';

  const borderRadius = node.cornerRadius;
  const radiusClass = typeof borderRadius === 'number' && borderRadius > 0
    ? `rounded-${tokens.borderRadius.find(r => r.value === borderRadius)?.name || 'md-0'}`
    : '';

  const children = node.children && node.children.length > 0
    ? node.children.map(child => `      <${child.name.replace(/[^a-zA-Z0-9]/g, '') || 'Child'} />`).join('\n')
    : '      {/* Add children here */}';

  const component = `import React from 'react';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className = '', children }) => {
  return (
    <div className={\`${hasAutoLayout ? `flex flex-${flexDirection}` : ''} ${gap} ${paddingClasses.join(' ')} ${bgClass} ${radiusClass} \${className}\`}>
${children}
    </div>
  );
};

export default ${componentName};`;

  return component;
}

function generateComponentExample(tokens: DesignTokens): string {
  
  const example = `import React from 'react';
import { Button } from './components/Button';

export const ExampleComponent: React.FC = () => {
  return (
    <div className="p-md-0">
      <h1 className="text-heading-regular text-primary-1">
        Design System Example
      </h1>
      <p className="text-body-regular text-neutral-1-dark">
        This component uses the generated design tokens.
      </p>
      <Button className="mt-md-0">
        Click Me
      </Button>
    </div>
  );
};`;

  return example;
}

export function generateCode(nodes: FigmaNode[], tokens: DesignTokens): GeneratedCode {
  const tailwindConfig = generateTailwindConfig(tokens);
  
  const mainNode = nodes[0] || nodes.find(n => n.type === 'FRAME') || nodes[0];
  const reactComponent = mainNode ? generateReactComponent(mainNode, tokens) : '// No component generated';
  
  const componentExample = generateComponentExample(tokens);
  
  return {
    reactComponent,
    tailwindConfig,
    componentExample,
  };
}

