import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'

export function AddOnsListPage() {
  const { t } = useTranslation()
  const { data: addons, isLoading } = useQuery({
    queryKey: ['addons'],
    queryFn: async () => { const token = localStorage.getItem('accessToken'); const r = await fetch('/api/addons', { headers: { Authorization: `Bearer ${token}` } }); return r.json() },
  })

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">{t('addons.title')}</h1><p className="text-slate-500">{t('addons.subtitle')}</p></div>
      {isLoading ? <div className="text-sm text-slate-400">{t('common.loading')}</div> : addons && addons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {addons.map((a: any) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-blue-500" /><h3 className="font-semibold text-sm text-slate-900">{a.name}</h3></div>
              <p className="text-xs text-slate-500 mb-3">{a.description}</p>
              <div className="flex justify-between text-sm"><span className="text-slate-600">${a.basePrice}/{a.unitType}</span><span className={a.isActive ? 'text-green-600' : 'text-red-600'}>{a.isActive ? t('addons.active') : t('addons.inactive')}</span></div>
            </div>
          ))}
        </div>
      ) : <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400"><p>{t('addons.noAddons')}</p></div>}
    </div>
  )
}
