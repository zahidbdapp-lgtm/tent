# Theme System Documentation

## Overview

A comprehensive dark mode and light mode theme system built with **next-themes** and **OKLch color space**.

## Project Structure

```
lib/theme/
├── theme-config.ts       # Theme configuration & color definitions
├── use-theme-hook.ts     # Custom theme hooks
└── index.ts              # Exports

components/
├── theme-provider.tsx    # Theme provider wrapper
└── theme-toggle.tsx      # Theme toggle button

app/
└── globals.css          # CSS variables & theme styles
```

## Features

### 🎨 Color System

- **OKLch Color Space**: Modern, perceptually uniform color representation
- **Two Color Schemes**: Optimized light and dark themes
- **CSS Variables**: 40+ customizable color variables
- **Automatic Detection**: System preference detection for theme selection

### 🔧 Configuration

Theme configuration is centralized in [lib/theme/theme-config.ts](../../lib/theme/theme-config.ts):

```typescript
export const THEME_CONFIG: ThemeConfig = {
  storageKey: 'app-theme',           // LocalStorage key for persistence
  defaultTheme: 'light',             // Initial theme
  enableSystem: true,                // Detect system preference
  attribute: 'class',                // CSS class attribute
  themes: ['light', 'dark'],         // Available themes
  enableTransitionOnChange: true,    // Smooth transitions
}
```

## Usage

### 1. **Toggle Theme Button**

Use the pre-built toggle component:

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <div>
      <ThemeToggle /> {/* Automatically handles switching */}
    </div>
  )
}
```

### 2. **Access Theme in Components**

Use the `useThemeHook` for theme access:

```tsx
'use client'

import { useThemeHook } from '@/lib/theme'

export function MyComponent() {
  const { theme, setTheme, mounted } = useThemeHook()

  if (!mounted) return null // Prevent hydration mismatch

  return (
    <div>
      Current theme: {theme}
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  )
}
```

### 3. **Toggle Theme**

Simplified theme toggling:

```tsx
'use client'

import { useToggleTheme } from '@/lib/theme'

export function ThemeButton() {
  const { theme, toggle } = useToggleTheme()

  return (
    <button onClick={toggle}>
      Current: {theme}
    </button>
  )
}
```

### 4. **Check Dark Mode**

Detect if dark mode is active:

```tsx
'use client'

import { useThemeColors } from '@/lib/theme'

export function StatusDisplay() {
  const { isDark, currentTheme } = useThemeColors()

  return (
    <p>
      {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </p>
  )
}
```

## CSS Variables

### Light Theme (`:root`)

**Core Colors:**
```css
--background: oklch(0.98 0 0)      /* Nearly white */
--foreground: oklch(0.15 0 0)      /* Nearly black */
```

**Primary:**
```css
--primary: oklch(0.55 0.15 250)    /* Blue */
--primary-foreground: oklch(0.98 0 0)
```

**Status Colors:**
```css
--success: oklch(0.60 0.18 145)    /* Green */
--warning: oklch(0.75 0.18 75)     /* Yellow */
--destructive: oklch(0.55 0.20 25) /* Red */
```

### Dark Theme (`.dark`)

**Core Colors:**
```css
--background: oklch(0.12 0.01 250) /* Dark blue-gray */
--foreground: oklch(0.95 0 0)      /* Nearly white */
```

**Primary:**
```css
--primary: oklch(0.65 0.18 250)    /* Brighter blue */
--primary-foreground: oklch(0.12 0 0)
```

All color variables are automatically switched when `.dark` class is applied.

## OKLch Color Space

### Why OKLch?

- **Perceptually Uniform**: Colors with same lightness appear equally bright
- **Modern**: Better than HSL/RGB for modern color design
- **Accessible**: Better contrast control for accessibility
- **Intuitive**: Easy to create consistent color palettes

### Format: `oklch(L C H)`

- **L (Lightness)**: 0-1 (0 = black, 1 = white)
- **C (Chroma)**: 0-0.4 (saturation/intensity)
- **H (Hue)**: 0-360 degrees (color angle)

**Examples:**
```css
oklch(0.98 0 0)        /* White (no saturation) */
oklch(0.55 0.15 250)   /* Medium blue */
oklch(0.12 0.01 250)   /* Very dark blue-gray */
```

## Architecture

### Theme Provider

Located in [components/theme-provider.tsx](../../components/theme-provider.tsx):

- Wraps application with `next-themes` functionality
- Applies theme configuration automatically
- Manages theme persistence and system detection

```tsx
<ThemeProvider>
  <YourApp />
</ThemeProvider>
```

### Custom Hooks

Located in [lib/theme/use-theme-hook.ts](../../lib/theme/use-theme-hook.ts):

| Hook | Purpose |
|------|---------|
| `useThemeHook()` | Full theme control with mounted state |
| `useToggleTheme()` | Simple light/dark toggle |
| `useThemeColors()` | Detect current theme mode |

### CSS Cascade

1. **:root** - Light theme (default)
2. **.dark** - Dark theme overrides (when applied to `<html>`)
3. **@theme inline** - Tailwind mappings

## Customization

### Add New Color Variable

1. Add to `THEME_COLORS` in [lib/theme/theme-config.ts](../../lib/theme/theme-config.ts):

```typescript
export const THEME_COLORS: ColorScheme = {
  light: {
    'new-color': 'oklch(0.50 0.10 200)',
    // ...
  },
  dark: {
    'new-color': 'oklch(0.70 0.15 200)',
    // ...
  },
}
```

2. Add CSS variable to [app/globals.css](../globals.css):

```css
:root {
  --new-color: oklch(0.50 0.10 200);
}

.dark {
  --new-color: oklch(0.70 0.15 200);
}

@theme inline {
  --color-new-color: var(--new-color);
}
```

3. Use in Tailwind:

```tsx
<div className="bg-new-color text-new-color">
  Content
</div>
```

### Change Default Theme

Update `THEME_CONFIG` in [lib/theme/theme-config.ts](../../lib/theme/theme-config.ts):

```typescript
export const THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'dark', // Changed from 'light'
  // ...
}
```

## Best Practices

### 1. **Always Check `mounted` State**

Prevent hydration mismatches in client components:

```tsx
const { theme, mounted } = useThemeHook()

if (!mounted) return null // Or a skeleton

return <div>{theme}</div>
```

### 2. **Use CSS Variables Instead of Hardcoding Colors**

❌ Bad:
```tsx
<div style={{ color: '#333' }}>Text</div>
```

✅ Good:
```tsx
<div className="text-foreground">Text</div>
```

### 3. **Leverage Tailwind Color Classes**

All CSS variables are available as Tailwind classes:

```tsx
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground">
    Action
  </button>
</div>
```

### 4. **Test Both Themes**

Always verify components in both light and dark modes.

## Troubleshooting

### Theme Not Persisting

Check that `storageKey` matches localStorage:

```typescript
// Should see 'app-theme' in browser DevTools > Application > Local Storage
```

### Hydration Mismatch Error

Ensure client components check `mounted` state:

```tsx
'use client'

import { useThemeHook } from '@/lib/theme'

export function Component() {
  const { theme, mounted } = useThemeHook()

  if (!mounted) return null // Critical for preventing hydration mismatch

  return <div>{theme}</div>
}
```

### Colors Not Changing

1. Verify `.dark` class is applied to `<html>` element
2. Check that CSS variables are defined in [globals.css](../globals.css)
3. Ensure Tailwind is using the correct color variables

## Files Reference

| File | Purpose |
|------|---------|
| [lib/theme/theme-config.ts](../../lib/theme/theme-config.ts) | Configuration & color definitions |
| [lib/theme/use-theme-hook.ts](../../lib/theme/use-theme-hook.ts) | Custom theme hooks |
| [lib/theme/index.ts](../../lib/theme/index.ts) | Public API exports |
| [components/theme-provider.tsx](../../components/theme-provider.tsx) | Provider component |
| [components/theme-toggle.tsx](../../components/theme-toggle.tsx) | Toggle button |
| [app/globals.css](../globals.css) | CSS variables & styles |

## Related Technologies

- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme persistence & system detection
- **[OKLch](https://oklab.pages.dev/)** - Modern color space
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Icon library for toggle

## Contributing

When modifying the theme system:

1. Update both light and dark color definitions
2. Keep CSS variables organized by category
3. Test in both themes
4. Update this documentation
5. Maintain consistency with OKLch values
