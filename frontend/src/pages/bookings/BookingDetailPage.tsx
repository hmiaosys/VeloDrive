import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { bookingsApi } from '@/api/bookings'
import { quotesApi } from '@/api/quotes'
import { ArrowLeft, Calendar, MapPin, Clock, FileText, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700', Quoted: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700', InProgress: 'bg-green-100 text-green-700',
  Completed: 'bg-emerald-100 text-emerald-700', Canceled: 'bg-red-100 text-red-700',
}

export function BookingDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showInvoice, setShowInvoice] = useState(false)
  const [invForm, setInvForm] = useState({ type: 'deposit', amount: 0 })

  const { data, isLoading } = useQuery({ queryKey: ['booking', id], queryFn: () => bookingsApi.getById(id!), enabled: !!id })

  const createQuote = useMutation({
    mutationFn: () => quotesApi.create(id!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); toast.success(t('bookings.detail.quoteCreated')) },
    onError: () => toast.error(t('bookings.detail.quoteFailed')),
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => bookingsApi.updateStatus(id!, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); toast.success(t('bookings.detail.statusUpdated')) },
    onError: () => toast.error(t('bookings.detail.statusFailed')),
  })

  const createInvoice = useMutation({
    mutationFn: () => fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ bookingId: id, type: invForm.type, amount: invForm.amount }) }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['booking', id] }); setShowInvoice(false); toast.success(t('bookings.detail.invoiceCreated')) },
    onError: () => toast.error(t('bookings.detail.invoiceFailed')),
  })

  if (isLoading || !data) return <div className="text-slate-400">{t('common.loading')}</div>
  const b = data.booking

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-slate-900">{b.bookingNumber}</h1><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || ''}`}>{t(`bookings.${b.status.charAt(0).toLowerCase() + b.status.slice(1)}`, b.status)}</span></div>
          <p className="text-slate-500">{b.customerName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900">{t('bookings.detail.details')}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="h-4 w-4 text-slate-400" />{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</div>
          {b.pickupTime && <div className="flex items-center gap-2 text-sm text-slate-600"><Clock className="h-4 w-4 text-slate-400" />{b.pickupTime} — {b.returnTime}</div>}
          {b.pickupLocation && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-slate-400" />{b.pickupLocation}</div>}
          {b.customerNotes && <div className="text-sm bg-slate-50 p-3 rounded-xl">{b.customerNotes}</div>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900">{t('bookings.detail.financials')}</h3>
          {b.items.map(i => <div key={i.id} className="flex justify-between text-sm"><span>{i.itemName} x{i.quantity}</span><span>${i.lineTotal.toFixed(2)}</span></div>)}
          {b.addOns.map(a => <div key={a.id} className="flex justify-between text-sm"><span>{a.addOnName} x{a.quantity}</span><span>${a.lineTotal.toFixed(2)}</span></div>)}
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-sm"><span>{t('bookings.detail.subtotal')}</span><span>${b.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>{t('bookings.detail.tax')}</span><span>${b.taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-900"><span>{t('bookings.total')}</span><span>${b.totalAmount.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="font-semibold text-sm text-slate-900 mb-3">{t('bookings.detail.actions')}</h3>
        <div className="flex flex-wrap gap-2">
          {b.status === 'Draft' && <><button onClick={() => createQuote.mutate()} disabled={createQuote.isPending} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"><FileText className="h-4 w-4 inline mr-1" />{t('bookings.detail.generateQuote')}</button><button onClick={() => updateStatus.mutate('Confirmed')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">{t('bookings.detail.confirmBooking')}</button></>}
          {b.status === 'Quoted' && <button onClick={() => updateStatus.mutate('Confirmed')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">{t('bookings.detail.confirm')}</button>}
          {b.status === 'Confirmed' && <button onClick={() => updateStatus.mutate('InProgress')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">{t('bookings.detail.start')}</button>}
          {b.status === 'InProgress' && <button onClick={() => updateStatus.mutate('Completed')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">{t('bookings.detail.complete')}</button>}
          {(b.status === 'Draft' || b.status === 'Quoted') && <button onClick={() => updateStatus.mutate('Canceled')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium">{t('bookings.detail.cancel')}</button>}
          <button onClick={() => { setInvForm({ type: 'deposit', amount: b.totalAmount * 0.3 }); setShowInvoice(!showInvoice) }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium"><Receipt className="h-4 w-4 inline mr-1" />{t('bookings.detail.createInvoice')}</button>
        </div>
        {showInvoice && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3">
            <h4 className="text-sm font-medium">{t('bookings.detail.newInvoice')}</h4>
            <select value={invForm.type} onChange={e => setInvForm({...invForm, type: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
              <option value="deposit">{t('bookings.detail.deposit')}</option>
              <option value="full">{t('bookings.detail.fullInvoice')}</option>
            </select>
            <input type="number" value={invForm.amount} onChange={e => setInvForm({...invForm, amount: +e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm w-40" />
            <button onClick={() => createInvoice.mutate()} disabled={createInvoice.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{createInvoice.isPending ? t('bookings.detail.creating') : t('bookings.detail.createInvoice')}</button>
          </div>
        )}
      </div>

      {data.invoices && data.invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-sm text-slate-900 mb-3">{t('bookings.detail.invoices')}</h3>
          <div className="space-y-2">
            {data.invoices.map((inv: any) => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm">
                <span className="font-medium text-slate-900">{inv.invoiceNumber}</span><span className="text-slate-500">{inv.type}</span>
                <span className={inv.status === 'Paid' ? 'text-green-600' : inv.status === 'Overdue' ? 'text-red-600' : 'text-slate-500'}>{inv.status}</span>
                <span className="font-medium">${inv.totalAmount.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
