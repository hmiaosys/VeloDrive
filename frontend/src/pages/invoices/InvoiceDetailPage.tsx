import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { invoicesApi } from '@/api/invoices'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [payForm, setPayForm] = useState({ amount: 0, method: 'BankTransfer', reference: '', notes: '' })

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getById(id!),
    enabled: !!id,
  })

  const recordPayment = useMutation({
    mutationFn: () => invoicesApi.recordPayment(id!, payForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoice', id] }); toast.success('Payment recorded'); setPayForm({ amount: 0, method: 'BankTransfer', reference: '', notes: '' }) },
    onError: () => toast.error('Failed to record payment'),
  })

  if (isLoading || !invoice) return <div className="text-muted-foreground">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">{invoice.customer?.name} · Booking {invoice.booking?.bookingNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">${invoice.totalAmount.toFixed(2)}</div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-xs text-muted-foreground">Paid</div>
          <div className="text-2xl font-bold text-green-600">${invoice.amountPaid.toFixed(2)}</div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-xs text-muted-foreground">Due</div>
          <div className="text-2xl font-bold text-destructive">${invoice.amountDue.toFixed(2)}</div>
        </div>
      </div>

      {/* Record Payment */}
      {invoice.amountDue > 0 && (
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Record Payment</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input type="number" step="0.01" max={invoice.amountDue} placeholder="Amount"
              value={payForm.amount || ''} onChange={e => setPayForm({...payForm, amount: +e.target.value})}
              className="px-3 py-2 border rounded-md text-sm" />
            <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})}
              className="px-3 py-2 border rounded-md text-sm">
              <option value="BankTransfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="CreditCard">Credit Card</option>
              <option value="Other">Other</option>
            </select>
            <input placeholder="Reference #" value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})}
              className="px-3 py-2 border rounded-md text-sm" />
            <button onClick={() => recordPayment.mutate()} disabled={payForm.amount <= 0 || recordPayment.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
              {recordPayment.isPending ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-3">Payment History</h3>
        {invoice.payments && invoice.payments.length > 0 ? (
          <div className="space-y-2">
            {invoice.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 text-sm">
                <div>
                  <span className="font-medium">${p.amount.toFixed(2)}</span>
                  <span className="text-muted-foreground ml-2">{p.method}</span>
                </div>
                <div className="text-muted-foreground">
                  {p.reference && <span className="mr-3">Ref: {p.reference}</span>}
                  {new Date(p.receivedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}
      </div>
    </div>
  )
}
