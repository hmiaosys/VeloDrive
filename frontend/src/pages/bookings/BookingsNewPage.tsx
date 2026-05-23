import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { customersApi } from '@/api/customers'
import { itemsApi } from '@/api/items'
import { categoriesApi } from '@/api/categories'
import { bookingsApi } from '@/api/bookings'
import { addonsApi } from '@/api/addons'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

export function BookingsNewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)

  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<Array<{itemId: string; quantity: number; unitPrice: number}>>([])
  const [addOns, setAddOns] = useState<Array<{addOnId: string; quantity: number; unitPrice: number}>>([])
  const [dates, setDates] = useState({ startDate: '', endDate: '', pickupTime: '', returnTime: '', pickupLocation: '', dropoffLocation: '' })
  const [notes, setNotes] = useState({ customerNotes: '', internalNotes: '' })
  const [taxRate] = useState(0.1025)

  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getAll() })
  const { data: itemsList } = useQuery({ queryKey: ['items'], queryFn: () => itemsApi.getAll() })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() })
  const { data: addonsData } = useQuery({ queryKey: ['addons'], queryFn: () => addonsApi.getAll() })

  const createMutation = useMutation({
    mutationFn: () => bookingsApi.create({ customerId, startDate: dates.startDate, endDate: dates.endDate, pickupTime: dates.pickupTime || null, returnTime: dates.returnTime || null, pickupLocation: dates.pickupLocation || null, dropoffLocation: dates.dropoffLocation || null, taxRate, customerNotes: notes.customerNotes || null, internalNotes: notes.internalNotes || null, items: items.map(i => ({ ...i, unitPrice: i.unitPrice || 0 })), addOns: addOns.map(a => ({ ...a, unitPrice: a.unitPrice || 0 })) }),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); toast.success(t('bookings.wizard.created')); navigate(`/bookings/${data.id}`) },
    onError: (err: any) => { const msg = err.response?.data; toast.error(typeof msg === 'string' ? msg : t('bookings.wizard.createFailed')) },
  })

  const calculateTotal = () => {
    const s = new Date(dates.startDate); const e = new Date(dates.endDate)
    const days = isNaN(s.getTime()) || isNaN(e.getTime()) ? 0 : Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000))
    const itemsTotal = items.reduce((sum, it) => { const item = itemsList?.find(i => i.id === it.itemId); return sum + ((it.unitPrice || item?.basePrice || 0) * it.quantity * days) }, 0)
    const addOnsTotal = addOns.reduce((sum, a) => { const addon = addonsData?.find((x: any) => x.id === a.addOnId); return sum + ((a.unitPrice || addon?.basePrice || 0) * a.quantity) }, 0)
    const subtotal = itemsTotal + addOnsTotal; const tax = subtotal * taxRate
    return { itemsTotal, addOnsTotal, subtotal, tax, total: subtotal + tax }
  }
  const totals = calculateTotal()
  const stepNames = [t('bookings.wizard.customer'), t('bookings.wizard.items'), t('bookings.wizard.addons'), t('bookings.wizard.dates'), t('bookings.wizard.review')]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold text-slate-900">{t('bookings.newBooking')}</h1>
      </div>

      <div className="flex gap-2">{stepNames.map((s, i) => <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />)}</div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t('bookings.wizard.selectCustomer')}</h3>
            {customers?.map((c: any) => (
              <button key={c.id} onClick={() => { setCustomerId(c.id); setStep(1) }}
                className={`w-full text-left p-4 rounded-xl border hover:bg-slate-50 transition-colors ${customerId === c.id ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'}`}>
                <div className="font-medium text-slate-900">{c.firstName} {c.lastName}{c.companyName ? ` — ${c.companyName}` : ''}</div>
                <div className="text-xs text-slate-500">{c.email} {c.phone}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t('bookings.wizard.selectItems')}</h3>
            {categories?.map((cat: any) => (
              <div key={cat.id}>
                <h4 className="text-sm font-medium text-slate-500 mb-2">{cat.name}</h4>
                {itemsList?.filter((i: any) => i.categoryId === cat.id).map((item: any) => {
                  const selected = items.find(it => it.itemId === item.id)
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl mb-2 hover:bg-slate-50">
                      <div><div className="text-sm font-medium text-slate-900">{item.name}</div><div className="text-xs text-slate-500">${item.basePrice}/{item.unitType} · SKU: {item.sku || '—'} · {t('bookings.wizard.qtyAvailable')}: {item.quantity}</div></div>
                      <div className="flex items-center gap-3">
                        {selected ? (
                          <><input type="number" min={1} max={item.quantity} value={selected.quantity} onChange={e => setItems(items.map(it => it.itemId === item.id ? {...it, quantity: +e.target.value} : it))} className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center" />
                          <button onClick={() => setItems(items.filter(it => it.itemId !== item.id))} className="text-xs text-red-600 hover:underline">{t('bookings.wizard.remove')}</button></>
                        ) : (
                          <button onClick={() => setItems([...items, { itemId: item.id, quantity: 1, unitPrice: item.basePrice }])} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium">{t('bookings.wizard.add')}</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            {items.length > 0 && <div className="text-sm text-right text-slate-500">{t('bookings.wizard.selected', { count: items.length })}</div>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t('bookings.wizard.selectAddons')}</h3>
            {addonsData?.map((addon: any) => {
              const selected = addOns.find(a => a.addOnId === addon.id)
              return (
                <div key={addon.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl mb-2 hover:bg-slate-50">
                  <div><div className="text-sm font-medium text-slate-900">{addon.name}</div><div className="text-xs text-slate-500">{addon.description} · ${addon.basePrice}/{addon.unitType}</div></div>
                  <div className="flex items-center gap-3">
                    {selected ? (
                      <><input type="number" min={1} value={selected.quantity} onChange={e => setAddOns(addOns.map(a => a.addOnId === addon.id ? {...a, quantity: +e.target.value} : a))} className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center" />
                      <button onClick={() => setAddOns(addOns.filter(a => a.addOnId !== addon.id))} className="text-xs text-red-600 hover:underline">{t('bookings.wizard.remove')}</button></>
                    ) : (
                      <button onClick={() => setAddOns([...addOns, { addOnId: addon.id, quantity: 1, unitPrice: addon.basePrice }])} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium">{t('bookings.wizard.add')}</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t('bookings.wizard.datesLocations')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[['startDate', t('bookings.wizard.startDate'), 'date'], ['endDate', t('bookings.wizard.endDate'), 'date'], ['pickupTime', t('bookings.wizard.pickupTime'), 'time'], ['returnTime', t('bookings.wizard.returnTime'), 'time']].map(([key, label, type]) => (
                <div key={key}><label className="text-sm font-medium text-slate-700">{label}{(key === 'startDate' || key === 'endDate') ? ' *' : ''}</label><input type={type} value={(dates as any)[key]} onChange={e => setDates({...dates, [key]: e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" /></div>
              ))}
            </div>
            {[['pickupLocation', t('bookings.wizard.pickupLocation')], ['dropoffLocation', t('bookings.wizard.dropoffLocation')]].map(([key, label]) => (
              <div key={key}><label className="text-sm font-medium text-slate-700">{label}</label><input value={(dates as any)[key]} onChange={e => setDates({...dates, [key]: e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" /></div>
            ))}
            {[['customerNotes', t('bookings.wizard.customerNotes')], ['internalNotes', t('bookings.wizard.internalNotes')]].map(([key, label]) => (
              <div key={key}><label className="text-sm font-medium text-slate-700">{label}</label><textarea value={(notes as any)[key]} onChange={e => setNotes({...notes, [key]: e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" rows={2} /></div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t('bookings.wizard.reviewBooking')}</h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">{t('bookings.customer')}</span><span className="text-slate-900">{customers?.find((c: any) => c.id === customerId)?.firstName} {customers?.find((c: any) => c.id === customerId)?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t('bookings.dates')}</span><span className="text-slate-900">{dates.startDate} — {dates.endDate}</span></div>
              <div className="border-t pt-2"><div className="text-xs font-medium text-slate-500 mb-1">{t('bookings.items')}</div>
                {items.map(it => { const item = itemsList?.find(i => i.id === it.itemId); const s = new Date(dates.startDate); const e = new Date(dates.endDate); const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000)); return <div key={it.itemId} className="flex justify-between text-xs"><span>{item?.name} x{it.quantity} ({days}d)</span><span>${((it.unitPrice || item?.basePrice || 0) * it.quantity * days).toFixed(2)}</span></div> })}
              </div>
              {addOns.length > 0 && <div className="border-t pt-2"><div className="text-xs font-medium text-slate-500 mb-1">{t('bookings.wizard.addons')}</div>
                {addOns.map(a => { const addon = addonsData?.find((x: any) => x.id === a.addOnId); return <div key={a.addOnId} className="flex justify-between text-xs"><span>{addon?.name} x{a.quantity}</span><span>${((a.unitPrice || addon?.basePrice || 0) * a.quantity).toFixed(2)}</span></div> })}
              </div>}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-xs"><span>{t('bookings.wizard.itemsSubtotal')}</span><span>${totals.itemsTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span>{t('bookings.wizard.addonsSubtotal')}</span><span>${totals.addOnsTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span>{t('bookings.wizard.tax')} ({(taxRate * 100).toFixed(2)}%)</span><span>${totals.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-slate-900"><span>{t('bookings.wizard.total')}</span><span>${totals.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-30"><ArrowLeft className="h-4 w-4" /> {t('bookings.wizard.back')}</button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={(step === 0 && !customerId) || (step === 1 && items.length === 0) || (step === 3 && (!dates.startDate || !dates.endDate || dates.endDate < dates.startDate))}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow-lg shadow-blue-500/25">
              {t('bookings.wizard.next')} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 shadow-lg shadow-blue-500/25">
              <Check className="h-4 w-4" /> {createMutation.isPending ? t('bookings.wizard.creating') : t('bookings.wizard.createBooking')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
