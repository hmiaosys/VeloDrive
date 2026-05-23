import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard, Bus, Package, Users, BookOpen,
  FileText, Receipt, BarChart3, Settings, LogOut, Menu, X, Search, Sparkles
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CommandPalette } from '@/components/CommandPalette'
import { PageTransition } from '@/components/PageTransition'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const iconMap: Record<string, any> = {
  dashboard: LayoutDashboard, items: Bus, addons: Package, customers: Users,
  bookings: BookOpen, quotes: FileText, invoices: Receipt, reports: BarChart3, settings: Settings,
}

export function DashboardLayout() {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => { clearAuth(); navigate('/login') }

  const navKeys = ['dashboard','items','addons','customers','bookings','quotes','invoices','reports','settings']
  const navItems = navKeys.map(key => ({
    to: key === 'dashboard' ? '/' : `/${key}`,
    icon: iconMap[key],
    label: t(`sidebar.${key}`),
  }))

  return (
    <>
    <CommandPalette />
    <div className="flex h-screen bg-[#f6f7fb]">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform lg:static lg:translate-x-0',
        'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight">{t('app.name')}</div>
            <div className="text-[10px] text-blue-300/70 font-medium">{t('app.tagline')}</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}>
                <Icon className={cn('h-4 w-4 transition-colors', active ? 'text-blue-400' : 'text-slate-500')} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.fullName?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.fullName}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 mt-3 w-full px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors">
            <LogOut className="h-3.5 w-3.5" /> {t('sidebar.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-4 px-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <LanguageSwitcher />
          <div className="w-2" />
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 rounded-lg transition-colors"
          >
            <Search className="h-3 w-3" />
            <span>{t('sidebar.quickSearch')}</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-400">⌘K</kbd>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </>
  )
}
