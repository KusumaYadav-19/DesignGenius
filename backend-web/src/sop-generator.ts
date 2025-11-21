import type { DesignTokens } from './tokens-generator.js';

export interface SOPDocument {
  versionControl: string;
  namingRules: string;
  designToDevSteps: string;
  complianceNotes: string;
  fullDocument: string;
}

export function generateSOP(tokens: DesignTokens): SOPDocument {
  
  const versionControl = `# Version Control Standards

## Design Token Versioning
- All design tokens must be versioned using semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes to token structure or naming
- MINOR: New tokens added, non-breaking changes
- PATCH: Bug fixes, corrections

## Git Workflow
1. Create feature branch from main: \`git checkout -b feature/token-updates\`
2. Make changes to design tokens
3. Update version in package.json
4. Commit with conventional commits: \`feat(tokens): add new color tokens\`
5. Create pull request for review
6. Merge to main after approval

## Token File Structure
\`\`\`
tokens/
  ├── colors.json
  ├── typography.json
  ├── spacing.json
  └── borderRadius.json
\`\`\`

## Change Log Requirements
- All token changes must be documented in CHANGELOG.md
- Include migration guide for breaking changes
- Document deprecated tokens with removal timeline`;

  const namingRules = `# Naming Conventions

## Color Tokens
- Format: \`{category}-{index}-{variant}\`
- Categories: primary, secondary, neutral, semantic
- Examples: \`primary-1\`, \`neutral-2-dark\`, \`semantic-error\`

## Typography Tokens
- Format: \`{size}-{weight}\`
- Sizes: heading, subheading, body-large, body, body-small, caption
- Weights: regular, medium, semibold, bold
- Examples: \`heading-bold\`, \`body-regular\`, \`caption-medium\`

## Spacing Tokens
- Format: \`{size}-{index}\`
- Sizes: xs, sm, md, lg, xl, xxl
- Examples: \`xs-0\`, \`md-1\`, \`xl-2\`

## Border Radius Tokens
- Format: \`{size}-{index}\`
- Sizes: none, sm, md, lg, xl
- Examples: \`sm-0\`, \`md-1\`, \`lg-2\`

## Component Naming
- Use PascalCase for component names
- Use descriptive names: \`ButtonPrimary\` not \`Btn1\`
- Include purpose: \`CardProduct\`, \`ModalConfirm\`

## File Naming
- Components: \`ComponentName.tsx\`
- Tokens: \`tokens.json\` or \`tokens.ts\`
- Utilities: \`utilityName.ts\`
- Tests: \`ComponentName.test.tsx\``;

  const designToDevSteps = `# Design to Development Workflow

## Step 1: Design Review
1. Review Figma design for completeness
2. Identify all components and their states
3. Document interactions and animations
4. Note accessibility requirements

## Step 2: Token Extraction
1. Run design analysis tool
2. Extract all design tokens (colors, typography, spacing)
3. Review and refine token names
4. Validate token values match design system

## Step 3: Component Breakdown
1. Identify reusable components
2. Document component hierarchy
3. List required props and states
4. Define component API

## Step 4: Implementation
1. Create component file structure
2. Implement base component with tokens
3. Add interactive states (hover, focus, active)
4. Implement responsive behavior
5. Add accessibility attributes (ARIA labels, keyboard navigation)

## Step 5: Testing
1. Visual regression testing
2. Accessibility testing (WCAG 2.1 AA compliance)
3. Cross-browser testing
4. Responsive design testing
5. Performance testing

## Step 6: Documentation
1. Document component props and usage
2. Add code examples
3. Update design system documentation
4. Create Storybook stories (if applicable)

## Step 7: Review & Approval
1. Code review by team
2. Design review for visual accuracy
3. Accessibility review
4. Final approval and merge`;

  const complianceNotes = `# Compliance & Standards

## Accessibility (WCAG 2.1 AA)
- All interactive elements must be keyboard accessible
- Color contrast ratios:
  - Normal text: 4.5:1 minimum
  - Large text (18pt+): 3:1 minimum
  - UI components: 3:1 minimum
- All images must have alt text
- Form inputs must have associated labels
- Focus indicators must be visible

## Code Quality
- TypeScript strict mode enabled
- ESLint rules enforced
- Prettier formatting required
- No console.log in production code
- Error handling for all async operations

## Performance
- Component bundle size monitoring
- Lazy loading for heavy components
- Image optimization required
- Code splitting for routes

## Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security
- No sensitive data in client-side code
- Input validation and sanitization
- XSS prevention
- CSRF protection for forms

## Design System Compliance
- Use design tokens, not hardcoded values
- Follow spacing scale (${tokens.spacing.length} spacing tokens available)
- Use typography tokens (${tokens.typography.length} typography tokens available)
- Follow color palette (${tokens.colors.length} color tokens available)
- Consistent border radius usage (${tokens.borderRadius.length} radius tokens available)

## Documentation Requirements
- All components must have JSDoc comments
- Complex logic must have inline comments
- README for each major feature
- API documentation for shared utilities`;

  const fullDocument = `${versionControl}

---

${namingRules}

---

${designToDevSteps}

---

${complianceNotes}

---

# Design Token Summary

## Colors
Total: ${tokens.colors.length} tokens
- Primary: ${tokens.colors.filter(c => c.category === 'primary').length}
- Secondary: ${tokens.colors.filter(c => c.category === 'secondary').length}
- Neutral: ${tokens.colors.filter(c => c.category === 'neutral').length}
- Semantic: ${tokens.colors.filter(c => c.category === 'semantic').length}

## Typography
Total: ${tokens.typography.length} tokens

## Spacing
Total: ${tokens.spacing.length} tokens

## Border Radius
Total: ${tokens.borderRadius.length} tokens

---

*Generated on ${new Date().toISOString()}*
*This document should be reviewed and updated regularly*`;

  return {
    versionControl,
    namingRules,
    designToDevSteps,
    complianceNotes,
    fullDocument,
  };
}

