import { useState, useEffect } from 'react'

/**
 * Theme hook supporting 'light', 'dark', and 'system' modes.
 * Persists selection in localStorage. On first visit with no stored preference,
 * detects OS color scheme preference automatically.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
    return 'system'
  })

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (mode) => {
      if (mode === 'dark') {
        root.classList.add('dark')
      } else if (mode === 'light') {
        root.classList.remove('dark')
      } else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    applyTheme(theme)

    // Listen for OS theme changes when in system mode
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  const setTheme = (mode) => {
    localStorage.setItem('theme', mode)
    setThemeState(mode)
  }

  return { theme, setTheme }
}
