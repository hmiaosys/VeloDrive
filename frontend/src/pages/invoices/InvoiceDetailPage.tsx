import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { invoicesApi } from '@/api/invoices'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export function InvoiceDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [payForm, setPayForm] = useState({ amount: 0, method: 'BankTransfer', reference: '', notes: '' })

  const { data: invoice, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoicesApi.getById(id!), enabled: !!id })

  const recordPayment = useMutation({
    mutationFn: () => invoicesApi.recordPayment(id!, payForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoice', id] }); toast.success(t('invoices.detail.paymentRecorded')); setPayForm({ amount: 0, method: 'BankTransfer', reference: '', notes: '' }) },
    onError: () => toast.error(t('invoices.detail.paymentFailed')),
  })

  const methods = ['BankTransfer', 'Cash', 'Check', 'CreditCard', 'Other']

  if (isLoading || !invoice) return <div className="text-slate-400">{t('common.loading')}</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></button>
        <div><h1 className="text-2xl font-bold text-slate-900">{invoice.invoiceNumber}</h1><p className="text-slate-500">{invoice.customer?.name} · {invoice.booking?.bookingNumber}</p></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: t('invoices.total'), value: invoice.totalAmount, cls: '' }, { label: t('invoices.paid'), value: invoice.amountPaid, cls: 'text-green-600' }, { label: t('invoices.due'), value: invoice.amountDue, cls: 'text-red-600' }].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 text-center">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${cls}`}>${value.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {invoice.amountDue > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2"><DollarSign className="h-4 w-4" />{t('invoices.detail.recordPayment')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input type="number" step="0.01" max={invoice.amountDue} placeholder={t('invoices.detail.amount')} value={payForm.amount || ''} onChange={e => setPayForm({...payForm, amount: +e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
            <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
              {methods.map(m => <option key={m} value={m}>{t(`invoices.detail.${m.charAt(0).toLowerCase() + m.slice(1)}`, m)}</option>)}
            </select>
            <input placeholder={t('invoices.detail.reference')} value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
            <button onClick={() => recordPayment.mutate()} disabled={payForm.amount <= 0 || recordPayment.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{recordPayment.isPending ? t('invoices.detail.recording') : t('invoices.detail.record')}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="font-semibold text-sm text-slate-900 mb-3">{t('invoices.detail.paymentHistory')}</h3>
        {invoice.payments?.length ? (
          <div className="space-y-2">
            {invoice.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                <div><span className="font-medium text-slate-900">${p.amount.toFixed(2)}</span><span className="text-slate-500 ml-2">{p.method}</span></div>
                <div className="text-slate-500">{p.reference && <span className="mr-3">Ref: {p.reference}</span>}{new Date(p.receivedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-400">{t('invoices.detail.noPayments')}</p>}
      </div>
    </div>
  )
}
