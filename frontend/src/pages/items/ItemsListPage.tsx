import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { itemsApi, type ItemResponse } from '@/api/items'
import { categoriesApi } from '@/api/categories'
import { Plus, Bus } from 'lucide-react'
import { useState } from 'react'

export function ItemsListPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', { search, categoryId: categoryFilter || undefined }],
    queryFn: () => itemsApi.getAll({ search, categoryId: categoryFilter || undefined }),
  })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('items.title')}</h1>
          <p className="text-slate-500">{t('items.subtitle')}</p>
        </div>
        <Link to="new"className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
          <Plus className="h-4 w-4" /> {t('items.addItem')}
        </Link>
      </div>

      <div className="flex gap-4">
        <input type="search" placeholder={t('items.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm">
          <option value="">{t('items.allCategories')}</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <div className="text-sm text-slate-400">{t('items.loading')}</div> : items && items.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50/50">
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('items.name')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('items.category')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('items.sku')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('items.price')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('items.qty')}</th>
            </tr></thead>
            <tbody>
              {items.map((item: ItemResponse) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <Link to={`${item.id}`} className="font-medium hover:underline text-slate-900 flex items-center gap-2"><Bus className="h-4 w-4 text-slate-400" />{item.name}</Link>
                    {item.customFields && (() => { try { const cf = JSON.parse(item.customFields); const entries = Object.entries(cf).slice(0, 4); return entries.length > 0 ? <div className="flex flex-wrap gap-1 mt-1">{entries.map(([k, v]: any) => <span key={k} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500">{v}</span>)}</div> : null } catch { return null } })()}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{item.categoryName}</td>
                  <td className="px-5 py-3 text-slate-500">{item.sku || '—'}</td>
                  <td className="px-5 py-3 text-right">${item.basePrice.toFixed(2)}/{item.unitType}</td>
                  <td className="px-5 py-3 text-right">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60">
          <Bus className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">{t('items.noItems')}</h3>
          <p className="text-sm text-slate-500 mt-1">{t('items.noItemsDesc')}</p>
        </div>
      )}
    </div>
  )
}
