import chalk from 'chalk'

export const DEFAULT_TEMPLATE:string = `folder src {
  file index.ts
}

constraints {
}
`;


export const DEFAULT_IGNORE_TEMPLATE: string = `node_modules
.git
.next
dist
build
coverage
.turbo
`;


export const theme = {
  primary: chalk.hex('#00b4d8'),     // Bright cyan-blue
  secondary: chalk.hex('#4cc9f0'),    // Lighter cyan
  accent: chalk.hex('#ffd166'),       // Warm gold
  success: chalk.hex('#06d6a0'),      // Emerald green
  warning: chalk.hex('#ff9e00'),      // Orange
  error: chalk.hex('#ef476f'),        // Coral red
  info: chalk.hex('#118ab2'),         // Deep blue
  muted: chalk.hex('#8d99ae'),        // Gray-blue
  light: chalk.hex('#d2deeb'),        // Off-white
  dark: chalk.hex('#1a1a2e'),         // Dark navy
  highlight: chalk.hex('#7209b7'),    // Purple
  border: chalk.hex('#4cc9f0'),       // Border color
};

// Status icons with colors
export const icons = {
  success: theme.success('✓'),
  error: theme.error('✗'),
  warning: theme.warning('⚠'),
  info: theme.info('ℹ'),
  folder: theme.secondary('📁'),
  file: theme.light('📄'),
  arrow: theme.border('→'),
  check: theme.success('✅'),
  cross: theme.error('❌'),
  star: theme.accent('⭐'),
  fire: theme.warning('🔥'),
};