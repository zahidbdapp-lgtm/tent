/**
 * QUICK REFERENCE: Theme System
 * 
 * Copy & paste examples for common theme tasks
 */

// ============================================================================
// 1. USE THEME TOGGLE BUTTON
// ============================================================================

// In your component:
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header>
      <ThemeToggle /> {/* Done! */}
    </header>
  )
}

// ============================================================================
// 2. GET CURRENT THEME
// ============================================================================

'use client'

import { useThemeHook } from '@/lib/theme'

export function StatusComponent() {
  const { theme, mounted } = useThemeHook()

  if (!mounted) return null

  return <p>Theme: {theme}</p>
}

// ============================================================================
// 3. TOGGLE THEME PROGRAMMATICALLY
// ============================================================================

'use client'

import { useToggleTheme } from '@/lib/theme'

export function CustomToggle() {
  const { toggle, theme } = useToggleTheme()

  return (
    <button onClick={toggle}>
      Current: {theme} (click to toggle)
    </button>
  )
}

// ============================================================================
// 4. SET SPECIFIC THEME
// ============================================================================

'use client'

import { useThemeHook } from '@/lib/theme'

export function ThemeSelector() {
  const { theme, setTheme } = useThemeHook()

  return (
    <div>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}

// ============================================================================
// 5. DETECT DARK MODE
// ============================================================================

'use client'

import { useThemeColors } from '@/lib/theme'

export function ModeIndicator() {
  const { isDark, currentTheme } = useThemeColors()

  return (
    <div>
      {isDark ? (
        <p>🌙 Dark Mode Enabled</p>
      ) : (
        <p>☀️ Light Mode</p>
      )}
    </div>
  )
}

// ============================================================================
// 6. USE COLOR VARIABLES IN COMPONENTS
// ============================================================================

// Use Tailwind classes (preferred):
<div className="bg-background text-foreground">
  <card className="bg-card border-border">
    <button className="bg-primary text-primary-foreground hover:bg-primary/90">
      Action Button
    </button>
  </card>
</div>

// ============================================================================
// 7. ALL AVAILABLE COLOR VARIABLES
// ============================================================================

// Base Colors
bg-background, text-foreground

// Cards & Popovers
bg-card, text-card-foreground
bg-popover, text-popover-foreground

// Primary & Secondary
bg-primary, text-primary-foreground
bg-secondary, text-secondary-foreground

// Muted & Accents
bg-muted, text-muted-foreground
bg-accent, text-accent-foreground

// Form Elements
border-border, border-input, ring-ring

// Status Colors
bg-success, text-success-foreground
bg-warning, text-warning-foreground
bg-destructive, text-destructive-foreground

// Sidebar
bg-sidebar, text-sidebar-foreground
bg-sidebar-primary, text-sidebar-primary-foreground
bg-sidebar-accent, text-sidebar-accent-foreground

// ============================================================================
// 8. CUSTOM STYLES BASED ON THEME
// ============================================================================

'use client'

import { useThemeColors } from '@/lib/theme'

export function DynamicComponent() {
  const { isDark } = useThemeColors()

  return (
    <div className={isDark ? 'rounded-lg shadow-dark' : 'rounded-lg shadow-light'}>
      Content that adapts to theme
    </div>
  )
}

// ============================================================================
// 9. USE CSS VARIABLES DIRECTLY
// ============================================================================

// In CSS/Tailwind:
@apply bg-[var(--primary)] text-[var(--primary-foreground)]

// ============================================================================
// 10. TROUBLESHOOTING CHECKLIST
// ============================================================================

/**
 * ✓ Theme not persisting?
 *   - Check browser DevTools > Application > Local Storage
 *   - Look for 'app-theme' key
 *   - Verify storageKey in theme-config.ts matches
 *
 * ✓ Hydration mismatch error?
 *   - Add: if (!mounted) return null
 *   - Use 'use client' directive
 *   - Call useThemeHook() in client component
 *
 * ✓ Colors not changing?
 *   - Verify .dark class on <html> element
 *   - Check browser DevTools > Elements
 *   - Clear cache and reload
 *
 * ✓ Toggle not working?
 *   - Ensure component is wrapped with 'use client'
 *   - Check mounted state
 *   - Verify ThemeProvider is in layout.tsx
 */
