import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { itemsApi } from '@/api/items'
import { categoriesApi } from '@/api/categories'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FieldSchema {
  type: string; label: string; required: boolean; options?: string[];
}

export function ItemNewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: '', categoryId: '', sku: '', description: '',
    unitType: 'Day', basePrice: 0, depositAmount: 0, quantity: 1,
  })
  const [customValues, setCustomValues] = useState<Record<string, any>>({})

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() })

  // Parse the selected category's schema
  const selectedCategory = useMemo(() =>
    categories?.find((c: any) => c.id === form.categoryId),
    [categories, form.categoryId]
  )

  const schema: Record<string, FieldSchema> = useMemo(() => {
    if (!selectedCategory?.attributeSchema) return {}
    try { return JSON.parse(selectedCategory.attributeSchema) }
    catch { return {} }
  }, [selectedCategory])

  // Reset custom values when category changes
  useEffect(() => {
    setCustomValues({})
  }, [form.categoryId])

  const createMutation = useMutation({
    mutationFn: () => itemsApi.create({
      ...form,
      customFields: JSON.stringify(customValues),
      images: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success('Item created')
      navigate('..')
    },
    onError: (err: any) => toast.error(err.response?.data?.title || err.response?.data || 'Failed to create item'),
  })

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: field === 'basePrice' || field === 'depositAmount' || field === 'quantity' ? +e.target.value : e.target.value })

  const updateCustom = (key: string, value: any) =>
    setCustomValues(prev => ({ ...prev, [key]: value }))

  const schemaFields = Object.entries(schema)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold text-slate-900">{t('items.newItem')}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
        {/* Basic fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">{t('items.name')} *</label>
            <input value={form.name} onChange={update('name')}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">{t('items.category')} *</label>
            <select value={form.categoryId} onChange={update('categoryId')}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="">Select category...</option>
              {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">{t('items.sku')}</label>
            <input value={form.sku} onChange={update('sku')}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">{t('items.price')} *</label>
            <input type="number" min={0} step="0.01" value={form.basePrice} onChange={update('basePrice')}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Unit Type</label>
            <select value={form.unitType} onChange={update('unitType')}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="Day">Day</option><option value="Hour">Hour</option>
              <option value="Week">Week</option><option value="Month">Month</option>
              <option value="Flat">Flat</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Deposit</label>
            <input type="number" min={0} step="0.01" value={form.depositAmount} onChange={update('depositAmount')}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">{t('items.qty')}</label>
            <input type="number" min={1} value={form.quantity} onChange={update('quantity')}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>

        {/* Dynamic custom fields from category schema */}
        {schemaFields.length > 0 && (
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              {selectedCategory?.name} Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemaFields.map(([key, field]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-slate-700">
                    {field.label || key}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={customValues[key] || ''}
                      onChange={e => updateCustom(key, e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm">
                      <option value="">Select...</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <div className="mt-1 flex items-center gap-3 h-[42px]">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" name={`cf-${key}`} checked={customValues[key] === true}
                          onChange={() => updateCustom(key, true)} /> Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" name={`cf-${key}`} checked={customValues[key] === false}
                          onChange={() => updateCustom(key, false)} /> No
                      </label>
                    </div>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={customValues[key] ?? ''}
                      onChange={e => updateCustom(key, e.target.value === '' ? '' : +e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
                  ) : (
                    <input
                      type="text"
                      value={customValues[key] || ''}
                      onChange={e => updateCustom(key, e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {form.categoryId && schemaFields.length === 0 && (
          <div className="border-t pt-5">
            <p className="text-sm text-slate-400 text-center py-4">
              This category has no custom fields defined.
            </p>
          </div>
        )}

        {/* Description */}
        <div className="border-t pt-5">
          <label className="text-sm font-medium text-slate-700">{t('common.description')}</label>
          <textarea value={form.description} onChange={update('description')} rows={3}
            className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => createMutation.mutate()}
            disabled={!form.name || !form.categoryId || createMutation.isPending}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow-lg shadow-blue-500/25">
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
            {t('items.saveItem')}
          </button>
          <button onClick={() => navigate('..')} className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
