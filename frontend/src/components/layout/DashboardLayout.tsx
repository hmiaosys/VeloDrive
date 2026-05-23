import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard, Bus, Package, Users, BookOpen,
  FileText, Receipt, BarChart3, Settings, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/items', icon: Bus, label: 'Items' },
  { to: '/addons', icon: Package, label: 'Add-ons' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/bookings', icon: BookOpen, label: 'Bookings' },
  { to: '/quotes', icon: FileText, label: 'Quotes' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <Bus className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground">VeloDrive</span>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="text-sm font-medium text-sidebar-foreground">{user?.fullName}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mt-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-4 px-4 border-b bg-background lg:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm text-muted-foreground">
            {user?.tenantId ? `Tenant: ${user.tenantId.slice(0, 8)}...` : ''}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
