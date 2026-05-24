import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { addonsApi } from '@/api/addons'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Package, Plus, Pencil, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AddOnsListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', unitType: 'Day', basePrice: 0, isPerItem: false, quantity: 1, customFields: '' })

  const { data: addons, isLoading } = useQuery({
    queryKey: ['addons'], queryFn: () => addonsApi.getAll(),
  })

  const resetForm = () => { setShowForm(false); setEditingId(null); setForm({ name: '', description: '', unitType: 'Day', basePrice: 0, isPerItem: false, quantity: 1, customFields: '' }) }

  const createMutation = useMutation({
    mutationFn: () => addonsApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addons'] }); resetForm(); toast.success('Add-on created') },
    onError: () => toast.error('Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: () => addonsApi.update(editingId!, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addons'] }); resetForm(); toast.success('Updated') },
    onError: () => toast.error('Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addonsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addons'] }); toast.success('Removed') },
  })

  const startEdit = (a: any) => {
    setEditingId(a.id); setForm({ name: a.name, description: a.description || '', unitType: a.unitType, basePrice: a.basePrice, isPerItem: a.isPerItem, quantity: a.quantity || 1, customFields: a.customFields || '' }); setShowForm(true)
  }

  const update = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [f]: f === 'basePrice' || f === 'quantity' ? +e.target.value : f === 'isPerItem' ? (e.target as HTMLInputElement).checked : e.target.value })

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">{t('addons.title')}</h1><p className="text-slate-500">{t('addons.subtitle')}</p></div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25">
          <Plus className="h-4 w-4" /> New Add-on
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">{editingId ? 'Edit Add-on' : 'New Add-on'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Name *</label>
              <input value={form.name} onChange={update('name')} placeholder="e.g. Professional Driver"
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <input value={form.description} onChange={update('description')}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Unit Type</label>
              <select value={form.unitType} onChange={update('unitType')}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm">
                <option value="Day">Per Day</option><option value="Hour">Per Hour</option>
                <option value="Flat">Flat Fee</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Price *</label>
              <input type="number" min={0} step="0.01" value={form.basePrice} onChange={update('basePrice')}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Quantity Available</label>
              <input type="number" min={1} value={form.quantity} onChange={update('quantity')}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Resource Info (JSON array)</label>
              <textarea value={form.customFields} onChange={update('customFields')} rows={3}
                placeholder='[{"name":"James","license":"CDL-12345"}]'
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono text-xs" />
              <p className="text-[10px] text-slate-400 mt-1">Optional. Record specific resources (drivers, guides) as a JSON array.</p>
            </div>
            <div className="flex items-center gap-2 h-full pt-6">
              <input type="checkbox" id="isPerItem" checked={form.isPerItem} onChange={update('isPerItem')}
                className="rounded border-slate-300" />
              <label htmlFor="isPerItem" className="text-sm text-slate-700">Charge per item (e.g. driver per bus)</label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!form.name || isPending}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
              {editingId ? 'Save Changes' : 'Create Add-on'}
            </button>
            <button onClick={resetForm} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <div className="text-sm text-slate-400">{t('common.loading')}</div> : addons && addons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {addons.map((a: any) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Package className="h-4 w-4 text-blue-500" /><h3 className="font-semibold text-sm text-slate-900">{a.name}</h3></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(a)} className="p-1 hover:bg-slate-100 rounded-lg" title="Edit"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1 hover:bg-red-50 rounded-lg" title="Delete"><X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">{a.description || 'No description'}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">${a.basePrice}/{a.unitType}</span>
                <span className="text-xs text-slate-400">{a.quantity || 1} available</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className={a.isPerItem ? 'text-blue-600' : 'text-slate-400'}>{a.isPerItem ? 'Per item' : ''}</span>
                <span className={a.isActive ? 'text-green-600' : 'text-red-600'}>{a.isActive ? t('addons.active') : t('addons.inactive')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400"><p>{t('addons.noAddons')}</p></div>}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Add-on"
        message="Are you sure you want to delete this add-on? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null) } }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
