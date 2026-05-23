import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { customersApi } from '@/api/customers'
import { itemsApi } from '@/api/items'
import { categoriesApi } from '@/api/categories'
import { bookingsApi } from '@/api/bookings'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

export function BookingsNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)

  // Form state
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<Array<{itemId: string; quantity: number; unitPrice: number}>>([])
  const [addOns, setAddOns] = useState<Array<{addOnId: string; quantity: number; unitPrice: number}>>([])
  const [dates, setDates] = useState({ startDate: '', endDate: '', pickupTime: '', returnTime: '', pickupLocation: '', dropoffLocation: '' })
  const [notes, setNotes] = useState({ customerNotes: '', internalNotes: '' })
  const [taxRate, setTaxRate] = useState(0.1025)

  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getAll() })
  const { data: itemsList } = useQuery({ queryKey: ['items'], queryFn: () => itemsApi.getAll() })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() })
  const { data: addOnsList } = useQuery({ queryKey: ['addons'], queryFn: () => itemsApi.getAll() && fetch('/api/addons').then(r => r.json()) })

  // Fetch addons
  const { data: addonsData } = useQuery({
    queryKey: ['addons-list'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken')
      const r = await fetch('/api/addons', { headers: { Authorization: `Bearer ${token}` } })
      return r.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const startDate = new Date(dates.startDate); const endDate = new Date(dates.endDate)
      const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000)
      return bookingsApi.create({
        customerId,
        startDate: dates.startDate,
        endDate: dates.endDate,
        pickupTime: dates.pickupTime || null,
        returnTime: dates.returnTime || null,
        pickupLocation: dates.pickupLocation || null,
        dropoffLocation: dates.dropoffLocation || null,
        taxRate,
        customerNotes: notes.customerNotes || null,
        internalNotes: notes.internalNotes || null,
        items: items.map(i => ({ ...i, unitPrice: i.unitPrice || 0 })),
        addOns: addOns.map(a => ({ ...a, unitPrice: a.unitPrice || 0 })),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Booking created!')
      navigate(`/bookings/${data.id}`)
    },
    onError: (err: any) => {
      const msg = err.response?.data || 'Failed to create booking'
      toast.error(typeof msg === 'string' ? msg : 'Conflict: item not available')
    },
  })

  const calculateTotal = () => {
    const startDate = new Date(dates.startDate); const endDate = new Date(dates.endDate)
    const days = isNaN(startDate.getTime()) || isNaN(endDate.getTime()) ? 0 : Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000))
    const itemsTotal = items.reduce((sum, it) => {
      const item = itemsList?.find(i => i.id === it.itemId)
      const price = it.unitPrice || item?.basePrice || 0
      return sum + (price * it.quantity * days)
    }, 0)
    const addOnsTotal = addOns.reduce((sum, a) => {
      const addon = addonsData?.find((x: any) => x.id === a.addOnId)
      const price = a.unitPrice || addon?.basePrice || 0
      return sum + (price * a.quantity)
    }, 0)
    const subtotal = itemsTotal + addOnsTotal
    const tax = subtotal * taxRate
    return { itemsTotal, addOnsTotal, subtotal, tax, total: subtotal + tax }
  }

  const totals = calculateTotal()

  const steps = ['Customer', 'Items', 'Add-ons', 'Dates', 'Review']

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-2xl font-bold">New Booking</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="bg-card border rounded-lg p-6">
        {/* Step 0: Customer */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Select Customer</h3>
            <div className="grid gap-2">
              {customers?.map((c: any) => (
                <button key={c.id} onClick={() => { setCustomerId(c.id); setStep(1) }}
                  className={`text-left p-4 border rounded-md hover:bg-muted/50 ${customerId === c.id ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="font-medium">{c.firstName} {c.lastName}{c.companyName ? ` — ${c.companyName}` : ''}</div>
                  <div className="text-xs text-muted-foreground">{c.email} {c.phone}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Items */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Select Items</h3>
            {categories?.map((cat: any) => (
              <div key={cat.id}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{cat.name}</h4>
                {itemsList?.filter((i: any) => i.categoryId === cat.id).map((item: any) => {
                  const selected = items.find(it => it.itemId === item.id)
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-md mb-2 hover:bg-muted/50">
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">${item.basePrice}/{item.unitType} · SKU: {item.sku || '—'} · Qty available: {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {selected ? (
                          <>
                            <input type="number" min={1} max={item.quantity} value={selected.quantity}
                              onChange={e => setItems(items.map(it => it.itemId === item.id ? {...it, quantity: +e.target.value} : it))}
                              className="w-16 px-2 py-1 border rounded text-sm text-center" />
                            <button onClick={() => setItems(items.filter(it => it.itemId !== item.id))}
                              className="text-xs text-destructive hover:underline">Remove</button>
                          </>
                        ) : (
                          <button onClick={() => setItems([...items, { itemId: item.id, quantity: 1, unitPrice: item.basePrice }])}
                            className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md">Add</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            {items.length > 0 && <div className="text-sm text-right text-muted-foreground">{items.length} item(s) selected</div>}
          </div>
        )}

        {/* Step 2: Add-ons */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Select Add-ons</h3>
            {addonsData?.map((addon: any) => {
              const selected = addOns.find(a => a.addOnId === addon.id)
              return (
                <div key={addon.id} className="flex items-center justify-between p-3 border rounded-md mb-2 hover:bg-muted/50">
                  <div>
                    <div className="text-sm font-medium">{addon.name}</div>
                    <div className="text-xs text-muted-foreground">{addon.description} · ${addon.basePrice}/{addon.unitType}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selected ? (
                      <>
                        <input type="number" min={1} value={selected.quantity}
                          onChange={e => setAddOns(addOns.map(a => a.addOnId === addon.id ? {...a, quantity: +e.target.value} : a))}
                          className="w-16 px-2 py-1 border rounded text-sm text-center" />
                        <button onClick={() => setAddOns(addOns.filter(a => a.addOnId !== addon.id))}
                          className="text-xs text-destructive hover:underline">Remove</button>
                      </>
                    ) : (
                      <button onClick={() => setAddOns([...addOns, { addOnId: addon.id, quantity: 1, unitPrice: addon.basePrice }])}
                        className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md">Add</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Step 3: Dates & Locations */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Dates & Locations</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date *</label>
                <input type="date" value={dates.startDate} onChange={e => setDates({...dates, startDate: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date *</label>
                <input type="date" value={dates.endDate} onChange={e => setDates({...dates, endDate: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Pickup Time</label>
                <input type="time" value={dates.pickupTime} onChange={e => setDates({...dates, pickupTime: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Return Time</label>
                <input type="time" value={dates.returnTime} onChange={e => setDates({...dates, returnTime: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Pickup Location</label>
              <input value={dates.pickupLocation} onChange={e => setDates({...dates, pickupLocation: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Dropoff Location</label>
              <input value={dates.dropoffLocation} onChange={e => setDates({...dates, dropoffLocation: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Customer Notes</label>
              <textarea value={notes.customerNotes} onChange={e => setNotes({...notes, customerNotes: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Internal Notes</label>
              <textarea value={notes.internalNotes} onChange={e => setNotes({...notes, internalNotes: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm" rows={2} />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Review Booking</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{customers?.find((c: any) => c.id === customerId)?.firstName} {customers?.find((c: any) => c.id === customerId)?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span>{dates.startDate} — {dates.endDate}</span></div>
              <div className="border-t pt-2 mt-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">Items</div>
                {items.map(it => {
                  const item = itemsList?.find(i => i.id === it.itemId)
                  return <div key={it.itemId} className="flex justify-between text-xs"><span>{item?.name} x{it.quantity}</span><span>${((it.unitPrice || item?.basePrice || 0) * it.quantity).toFixed(2)}</span></div>
                })}
              </div>
              {addOns.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Add-ons</div>
                  {addOns.map(a => {
                    const addon = addonsData?.find((x: any) => x.id === a.addOnId)
                    return <div key={a.addOnId} className="flex justify-between text-xs"><span>{addon?.name} x{a.quantity}</span><span>${((a.unitPrice || addon?.basePrice || 0) * a.quantity).toFixed(2)}</span></div>
                  })}
                </div>
              )}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-xs"><span>Items Subtotal</span><span>${totals.itemsTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span>Add-ons Subtotal</span><span>${totals.addOnsTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span>Tax ({(taxRate * 100).toFixed(2)}%)</span><span>${totals.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm disabled:opacity-30">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)}
              disabled={(step === 0 && !customerId) || (step === 1 && items.length === 0) || (step === 3 && (!dates.startDate || !dates.endDate))}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
              <Check className="h-4 w-4" /> {createMutation.isPending ? 'Creating...' : 'Create Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
