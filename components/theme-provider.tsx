/**
 * Theme Provider Component
 * Wraps the application with next-themes theme functionality
 * Manages theme state, persistence, and system preference detection
 */

'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { THEME_CONFIG } from '@/lib/theme'

/**
 * ThemeProvider Component
 * @param children - React children components
 * @param props - Additional ThemeProvider props
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={THEME_CONFIG.attribute}
      defaultTheme={THEME_CONFIG.defaultTheme}
      enableSystem={THEME_CONFIG.enableSystem}
      storageKey={THEME_CONFIG.storageKey}
      enableTransitionOnChange={THEME_CONFIG.enableTransitionOnChange}
      themes={THEME_CONFIG.themes}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
