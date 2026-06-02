import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const THEMES = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    const idx = THEMES.findIndex((t) => t.value === theme)
    const next = THEMES[(idx + 1) % THEMES.length]
    setTheme(next.value)
  }

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[2]
  const Icon = current.icon

  return (
    <button
      onClick={cycle}
      aria-label={`Switch theme (current: ${current.label})`}
      className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
