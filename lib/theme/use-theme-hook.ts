/**
 * Custom Theme Hook
 * Provides convenient access to theme functionality with hydration handling
 */

'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { Theme } from './theme-config'

export interface UseThemeReturn {
  theme: Theme | undefined
  setTheme: (theme: Theme) => void
  themes: string[]
  systemTheme: Theme | undefined
  resolvedTheme: Theme | undefined
  mounted: boolean
}

export function useThemeHook(): UseThemeReturn {
  const { theme, setTheme, themes, systemTheme, resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return {
    theme: (theme as Theme) || undefined,
    setTheme: (newTheme: Theme) => setTheme(newTheme),
    themes: themes || [],
    systemTheme: (systemTheme as Theme) || undefined,
    resolvedTheme: (resolvedTheme as Theme) || undefined,
    mounted,
  }
}

/**
 * Hook to toggle between light and dark themes
 */
export function useToggleTheme() {
  const { theme, setTheme, mounted } = useThemeHook()

  const toggle = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If system, switch to light
      setTheme('light')
    }
  }

  return { theme, toggle, mounted }
}

/**
 * Hook to get current theme colors
 */
export function useThemeColors() {
  const { resolvedTheme } = useThemeHook()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(resolvedTheme === 'dark')
  }, [resolvedTheme])

  return { isDark, currentTheme: resolvedTheme }
}
