import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { invoicesApi } from '@/api/invoices'
import { Receipt } from 'lucide-react'

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700', Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700', PartiallyPaid: 'bg-yellow-100 text-yellow-700',
  Overdue: 'bg-red-100 text-red-700', Void: 'bg-gray-100 text-gray-500 line-through',
}

export function InvoicesListPage() {
  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => invoicesApi.getAll() })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">{invoices?.length ?? 0} invoices</p>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : invoices && invoices.length > 0 ? (
        <div className="border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Paid</th>
                <th className="text-right px-4 py-3 font-medium">Due</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-medium hover:underline">{inv.invoiceNumber}</Link>
                    <div className="text-xs text-muted-foreground">{inv.bookingNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.type}</td>
                  <td className="px-4 py-3 text-right">${inv.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-600">${inv.amountPaid.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-destructive">${inv.amountDue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || ''}`}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
        <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p>No invoices yet.</p>
      </div>}
    </div>
  )
}
