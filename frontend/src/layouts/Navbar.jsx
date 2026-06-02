import { ThemeToggle } from '@/components/ThemeToggle'

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 px-4 backdrop-blur">
      <div className="flex flex-1 items-center justify-between">
        <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50 md:hidden">InventoryOS</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
