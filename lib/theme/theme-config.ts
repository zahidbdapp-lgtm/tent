/**
 * Theme Configuration
 * Centralized theme setup for dark mode and light mode
 */

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  // Theme storage
  storageKey: string
  
  // Default theme
  defaultTheme: Theme
  
  // Enable system theme detection
  enableSystem: boolean
  
  // CSS attribute for theme class
  attribute: 'class' | 'data-theme'
  
  // Themes
  themes: Theme[]
  
  // Force theme on document
  forcedTheme?: string | undefined
  
  // Enable transitions
  enableTransitionOnChange: boolean
}

export const THEME_CONFIG: ThemeConfig = {
  storageKey: 'app-theme',
  defaultTheme: 'light',
  enableSystem: true,
  attribute: 'class',
  themes: ['light', 'dark'],
  enableTransitionOnChange: true,
}

/**
 * OKLch Color System
 * Modern, perceptually uniform color space
 */
export interface ColorScheme {
  light: Record<string, string>
  dark: Record<string, string>
}

export const THEME_COLORS: ColorScheme = {
  light: {
    background: 'oklch(0.98 0 0)',
    foreground: 'oklch(0.15 0 0)',
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.15 0 0)',
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.15 0 0)',
    primary: 'oklch(0.55 0.15 250)',
    'primary-foreground': 'oklch(0.98 0 0)',
    secondary: 'oklch(0.95 0 0)',
    'secondary-foreground': 'oklch(0.25 0 0)',
    muted: 'oklch(0.95 0.01 250)',
    'muted-foreground': 'oklch(0.50 0 0)',
    accent: 'oklch(0.92 0.02 250)',
    'accent-foreground': 'oklch(0.25 0 0)',
    destructive: 'oklch(0.55 0.20 25)',
    'destructive-foreground': 'oklch(0.98 0 0)',
    border: 'oklch(0.90 0 0)',
    input: 'oklch(0.90 0 0)',
    ring: 'oklch(0.55 0.15 250)',
    'chart-1': 'oklch(0.55 0.15 250)',
    'chart-2': 'oklch(0.65 0.18 160)',
    'chart-3': 'oklch(0.70 0.15 45)',
    'chart-4': 'oklch(0.60 0.20 300)',
    'chart-5': 'oklch(0.58 0.22 25)',
    sidebar: 'oklch(0.98 0 0)',
    'sidebar-foreground': 'oklch(0.15 0 0)',
    'sidebar-primary': 'oklch(0.55 0.15 250)',
    'sidebar-primary-foreground': 'oklch(0.98 0 0)',
    'sidebar-accent': 'oklch(0.94 0.02 250)',
    'sidebar-accent-foreground': 'oklch(0.25 0 0)',
    'sidebar-border': 'oklch(0.90 0 0)',
    'sidebar-ring': 'oklch(0.55 0.15 250)',
    success: 'oklch(0.60 0.18 145)',
    'success-foreground': 'oklch(0.98 0 0)',
    warning: 'oklch(0.75 0.18 75)',
    'warning-foreground': 'oklch(0.20 0 0)',
  },
  dark: {
    background: 'oklch(0.12 0.01 250)',
    foreground: 'oklch(0.95 0 0)',
    card: 'oklch(0.16 0.01 250)',
    'card-foreground': 'oklch(0.95 0 0)',
    popover: 'oklch(0.16 0.01 250)',
    'popover-foreground': 'oklch(0.95 0 0)',
    primary: 'oklch(0.65 0.18 250)',
    'primary-foreground': 'oklch(0.12 0 0)',
    secondary: 'oklch(0.22 0.01 250)',
    'secondary-foreground': 'oklch(0.95 0 0)',
    muted: 'oklch(0.22 0.01 250)',
    'muted-foreground': 'oklch(0.65 0 0)',
    accent: 'oklch(0.25 0.02 250)',
    'accent-foreground': 'oklch(0.95 0 0)',
    destructive: 'oklch(0.50 0.18 25)',
    'destructive-foreground': 'oklch(0.95 0 0)',
    border: 'oklch(0.25 0.01 250)',
    input: 'oklch(0.25 0.01 250)',
    ring: 'oklch(0.65 0.18 250)',
    'chart-1': 'oklch(0.65 0.18 250)',
    'chart-2': 'oklch(0.70 0.20 160)',
    'chart-3': 'oklch(0.75 0.18 45)',
    'chart-4': 'oklch(0.65 0.22 300)',
    'chart-5': 'oklch(0.60 0.24 25)',
    sidebar: 'oklch(0.14 0.01 250)',
    'sidebar-foreground': 'oklch(0.95 0 0)',
    'sidebar-primary': 'oklch(0.65 0.18 250)',
    'sidebar-primary-foreground': 'oklch(0.12 0 0)',
    'sidebar-accent': 'oklch(0.22 0.02 250)',
    'sidebar-accent-foreground': 'oklch(0.95 0 0)',
    'sidebar-border': 'oklch(0.25 0.01 250)',
    'sidebar-ring': 'oklch(0.65 0.18 250)',
    success: 'oklch(0.65 0.20 145)',
    'success-foreground': 'oklch(0.12 0 0)',
    warning: 'oklch(0.78 0.18 75)',
    'warning-foreground': 'oklch(0.15 0 0)',
  },
}
