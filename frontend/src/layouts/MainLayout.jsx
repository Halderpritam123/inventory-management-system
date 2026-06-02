import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* Sidebar — static on md+, off-canvas on mobile */}
      <Sidebar />

      {/* Main area — takes remaining space, no extra margin needed */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
