import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { categoriesApi, type CategoryResponse } from '@/api/categories'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Plus, X, GripVertical, HelpCircle, Bus, Camera, Tent, Wrench, Package, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

const fieldTypes = [
  { value: 'string', label: 'Text', example: 'e.g. "Mercedes-Benz"' },
  { value: 'number', label: 'Number', example: 'e.g. 54, 200, 3.5' },
  { value: 'select', label: 'Dropdown', example: 'e.g. Automatic, Manual' },
  { value: 'boolean', label: 'Yes/No', example: 'e.g. Has WiFi, Has Restroom' },
]

const categoryExamples = [
  { icon: Bus, name: 'Buses', fields: 'seats (number), transmission (dropdown), hasRestroom (yes/no)' },
  { icon: Camera, name: 'Cameras', fields: 'resolution (text), lensMount (dropdown), sensorSize (text)' },
  { icon: Tent, name: 'Party Tents', fields: 'dimensions (text), capacity (number), material (dropdown)' },
  { icon: Wrench, name: 'Tools', fields: 'brand (text), powerType (dropdown), weight (number)' },
  { icon: Package, name: 'Custom', fields: 'define whatever fields your items need' },
]

interface FieldDef {
  name: string; type: string; label: string; required: boolean; options?: string;
}

export function CategoriesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FieldDef[]>([])

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'], queryFn: () => categoriesApi.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const schema = buildSchema()
      return categoriesApi.create({ name, slug, description, attributeSchema: JSON.stringify(schema), displayOrder: 0 })
    },
    onSuccess: () => { resetForm(); toast.success('Category created') },
    onError: (err: any) => toast.error(err.response?.data?.title || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      const schema = buildSchema()
      return categoriesApi.update(editId!, { name, slug, description, attributeSchema: JSON.stringify(schema), displayOrder: 0 })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); resetForm(); toast.success('Category updated') },
    onError: (err: any) => toast.error(err.response?.data?.title || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category removed') },
  })

  const buildSchema = () => {
    const schema: Record<string, any> = {}
    fields.forEach(f => {
      schema[f.name] = { type: f.type, label: f.label, required: f.required }
      if (f.type === 'select' && f.options) schema[f.name].options = f.options.split(',').map(s => s.trim())
    })
    return schema
  }

  const resetForm = () => {
    setShowForm(false); setEditId(null); setName(''); setSlug(''); setDescription(''); setFields([])
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const startEdit = (cat: CategoryResponse) => {
    let schema: Record<string, any> = {}
    try { schema = JSON.parse(cat.attributeSchema || '{}') } catch {}
    const loadedFields: FieldDef[] = Object.entries(schema).map(([key, val]: [string, any]) => ({
      name: key,
      type: val.type || 'string',
      label: val.label || key,
      required: val.required || false,
      options: val.options ? val.options.join(', ') : undefined,
    }))

    setEditId(cat.id); setName(cat.name); setSlug(cat.slug); setDescription(cat.description || ''); setFields(loadedFields); setShowForm(true)
  }

  const addField = () => setFields([...fields, { name: '', type: 'string', label: '', required: false }])
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i))
  const updateField = (i: number, key: keyof FieldDef, value: any) => {
    const updated = [...fields]; (updated[i] as any)[key] = value; setFields(updated)
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editId) setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const isEditing = !!editId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-500">Define item types and their custom fields</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25">
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{isEditing ? 'Edit Category' : 'Create Category'}</h3>
                {isEditing && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{slug}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name *</label>
                  <input value={name} onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Buses, Cameras, Party Tents"
                    className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Slug *</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)}
                    className="mt-1 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What kind of items belong to this category?"
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
              </div>
            </div>

            {/* Examples panel (only in create mode) */}
            {!isEditing && (
              <div className="hidden lg:block w-64 bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-1.5 mb-3">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">Examples</span>
                </div>
                <div className="space-y-3">
                  {categoryExamples.map(({ icon: Icon, name: exName, fields: exFields }) => (
                    <div key={exName} className="text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-amber-900"><Icon className="h-3 w-3" /> {exName}</div>
                      <div className="text-amber-700 mt-0.5 ml-5">{exFields}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom fields builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-slate-700">Custom Fields</span>
                <span className="text-xs text-slate-400 ml-2">Define what information each item in this category should have</span>
              </div>
              <button onClick={addField}
                className="px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50">
                + Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-400">No custom fields yet.</p>
                <p className="text-xs text-slate-400 mt-1">Add fields like "seats", "transmission", "make" to capture item-specific data.</p>
              </div>
            )}

            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  <input value={f.name} onChange={e => updateField(i, 'name', e.target.value)}
                    placeholder="Field name (e.g. seats)"
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono" />
                  <input value={f.label} onChange={e => updateField(i, 'label', e.target.value)}
                    placeholder="Display label (e.g. Passenger Seats)"
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
                  <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)}
                    className="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    {fieldTypes.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                  </select>
                  {f.type === 'select' && (
                    <div className="flex items-center gap-1.5">
                      {(f.options?.split(',').filter(Boolean) || []).map((opt: string, oi: number) => (
                        <span key={oi} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] text-blue-700 whitespace-nowrap">
                          {opt.trim()}
                          <button onClick={() => {
                            const opts = (f.options || '').split(',').filter(Boolean);
                            opts.splice(oi, 1);
                            updateField(i, 'options', opts.join(','));
                          }} className="hover:text-red-500"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                      <input
                        placeholder={!f.options ? "Add option..." : ""}
                        className="w-28 px-2 py-1 border border-dashed border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-400"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            const existing = (f.options || '').split(',').filter(Boolean).map(s => s.trim());
                            updateField(i, 'options', [...existing, val].join(','));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                    <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} /> Required
                  </label>
                  <button onClick={() => removeField(i)} className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <button onClick={() => isEditing ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!name || !slug || createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow-lg shadow-blue-500/25">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin inline mr-1" />}
              {isEditing ? 'Save Changes' : 'Create Category'}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Existing categories */}
      {isLoading ? <div className="text-sm text-slate-400">Loading...</div> : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c: CategoryResponse) => {
            let schema: Record<string, any> = {}
            try { schema = JSON.parse(c.attributeSchema || '{}') } catch {}
            const fieldCount = Object.keys(schema).length
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{c.slug}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{c.itemCount} items</span>
                </div>
                {c.description && <p className="text-xs text-slate-500 mb-3">{c.description}</p>}
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Fields ({fieldCount})</div>
                  {fieldCount > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(schema).map(([key, val]: [string, any]) => (
                        <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600">
                          {val.label || key}
                          <span className="text-slate-400">({val.type})</span>
                          {val.required && <span className="text-red-400">*</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">No custom fields</span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <button onClick={() => startEdit(c)}
                    className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(c.id)}
                    className="text-[10px] text-slate-400 hover:text-red-500 font-medium">
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400">
          <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p>No categories defined yet. Create your first category to start adding items.</p>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Category"
        message="Are you sure? Items in this category will not be deleted, but they won't have a category anymore."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null) } }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
