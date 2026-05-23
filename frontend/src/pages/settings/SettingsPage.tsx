import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { Building2, Palette, Users, Globe, CreditCard, Copy, Check, Shield, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)

  const cards = [
    { icon: Users, key: 'team', to: '/settings/team' },
    { icon: Palette, key: 'branding' },
    { icon: Globe, key: 'domain' },
    { icon: CreditCard, key: 'billing' },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      <div><h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1><p className="text-slate-500 mt-0.5">{t('settings.subtitle')}</p></div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6"><div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-blue-600" /></div><div><h2 className="font-semibold text-slate-900">{t('settings.businessProfile')}</h2><p className="text-xs text-slate-500">{t('settings.businessProfileDesc')}</p></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-slate-500 uppercase">{t('settings.tenantId')}</label><div className="mt-1 flex items-center gap-2"><code className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm font-mono text-slate-600 truncate">{user?.tenantId}</code><button onClick={() => { navigator.clipboard.writeText(user?.tenantId || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-2 hover:bg-slate-100 rounded-lg">{copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}</button></div></div>
          <div><label className="text-xs font-medium text-slate-500 uppercase">{t('settings.accountRole')}</label><div className="mt-1 flex items-center gap-2"><Shield className="h-4 w-4 text-slate-400" /><span className="text-sm font-medium text-slate-900">{user?.role}</span></div></div>
          <div><label className="text-xs font-medium text-slate-500 uppercase">{t('settings.email')}</label><div className="mt-1 text-sm text-slate-900">{user?.email}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ icon: Icon, key, to }) =>
          to ? (
            <Link key={key} to={to}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3"><Icon className="h-5 w-5 text-blue-600" /></div>
              <h3 className="font-semibold text-slate-900 text-sm">{t(`settings.${key}`)}</h3>
              <p className="text-xs text-slate-500 mt-1">{t(`settings.${key}Desc`)}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-blue-600 font-medium group-hover:gap-2 transition-all">
                Manage <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ) : (
            <div key={key} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 opacity-50">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3"><Icon className="h-5 w-5 text-slate-400" /></div>
              <h3 className="font-semibold text-slate-900 text-sm">{t(`settings.${key}`)}</h3>
              <p className="text-xs text-slate-500 mt-1">{t(`settings.${key}Desc`)}</p>
              <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{t('settings.comingSoon')}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
