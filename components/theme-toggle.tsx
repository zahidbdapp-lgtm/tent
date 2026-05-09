/**
 * Theme Toggle Component
 * Provides a button to switch between light and dark themes
 */

'use client'

import { Moon, Sun } from 'lucide-react'
import { useToggleTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'

/**
 * ThemeToggle Component
 * Displays a button that toggles between light and dark modes
 * Shows loading state until component is mounted (to prevent hydration mismatch)
 */
export function ThemeToggle() {
  const { theme, toggle, mounted } = useToggleTheme()

  // Return null while loading to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'
  const icon = isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
  const label = `Switch to ${nextTheme} mode`

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="rounded-full"
      title={label}
      aria-label={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
