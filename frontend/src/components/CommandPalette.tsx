import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Command } from 'cmdk'
import { LayoutDashboard, Bus, Package, Users, BookOpen, FileText, Receipt, BarChart3, Settings, Plus, Search, Layers } from 'lucide-react'

const iconMap: Record<string, any> = {
  LayoutDashboard, Bus, Package, Users, BookOpen, FileText, Receipt, BarChart3, Settings, Plus, Layers,
}

const pageKeys = ['dashboard','items','categories','addons','customers','bookings','newBooking','quotes','invoices','reports','settings'] as const
const pageRoutes: Record<string, string> = {
  dashboard: '/', items: '/items', categories: '/categories', addons: '/addons', customers: '/customers',
  bookings: '/bookings', newBooking: '/bookings/new', quotes: '/quotes',
  invoices: '/invoices', reports: '/reports', settings: '/settings',
}

export function CommandPalette() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(prev => !prev) }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const pages = pageKeys.map(k => ({
    label: k === 'newBooking' ? t('bookings.newBooking') : t(`sidebar.${k}`),
    to: pageRoutes[k],
    iconKey: k === 'newBooking' ? 'Plus' : (k === 'dashboard' ? 'LayoutDashboard' : k.charAt(0).toUpperCase() + k.slice(1)),
    shortcut: t(`cmd.shortcuts.${k}`),
  }))

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command Menu" className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-card border rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Command.Input placeholder={t('cmd.placeholder')} className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">esc</kbd>
        </div>
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">{t('cmd.noResults')}</Command.Empty>
          <Command.Group heading={t('cmd.navigate')} className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            {pages.map((p) => {
              const Icon = iconMap[p.iconKey] || Bus
              return (
                <Command.Item key={p.to} value={p.label} onSelect={() => { setOpen(false); navigate(p.to) }}
                  className="flex items-center gap-3 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{p.label}</span>
                  {p.shortcut && <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{p.shortcut}</kbd>}
                </Command.Item>
              )
            })}
          </Command.Group>
        </Command.List>
        <div className="flex items-center gap-4 px-4 py-2 border-t text-[10px] text-muted-foreground">
          <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd> {t('cmd.navigateHint')}</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd> {t('cmd.openHint')}</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">Esc</kbd> {t('cmd.closeHint')}</span>
        </div>
      </div>
    </Command.Dialog>
  )
}
