import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, ShoppingCart, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Overlay — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/*
        On md+: static sidebar, part of flex layout — no fixed positioning
        On mobile: fixed off-canvas drawer, toggled by hamburger in Navbar
      */}
      <aside
        className={cn(
          'flex flex-col w-64 shrink-0',
          'border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950',
          // Desktop: always visible, static in flow
          'hidden md:flex',
          // Mobile: fixed drawer overlay
          open && '!flex fixed inset-y-0 left-0 z-50 md:static md:z-auto'
        )}
      >
        <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-6">
          <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            InventoryOS
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile toggle — rendered outside sidebar so it sits in the Navbar row */}
      <button
        className="fixed bottom-4 right-4 z-50 md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </>
  )
}
