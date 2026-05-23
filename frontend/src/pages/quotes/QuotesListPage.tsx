import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotesApi } from '@/api/quotes'
import { FileText, Send, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export function QuotesListPage() {
  const queryClient = useQueryClient()
  const { data: quotes, isLoading } = useQuery({ queryKey: ['quotes'], queryFn: () => quotesApi.getAll() })

  const sendQuote = useMutation({
    mutationFn: (id: string) => quotesApi.send(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Quote sent') },
  })

  const acceptQuote = useMutation({
    mutationFn: (id: string) => quotesApi.accept(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Quote accepted') },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quotes</h1>
        <p className="text-muted-foreground">{quotes?.length ?? 0} quotes</p>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : quotes && quotes.length > 0 ? (
        <div className="border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Quote #</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: any) => (
                <tr key={q.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{q.quoteNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.customerName}</td>
                  <td className="px-4 py-3 text-right">${q.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.status === 'Accepted' ? 'bg-green-100 text-green-700' : q.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {q.status === 'Draft' && <button onClick={() => sendQuote.mutate(q.id)} className="p-1 hover:bg-muted rounded" title="Send"><Send className="h-4 w-4" /></button>}
                      {q.status === 'Sent' && <button onClick={() => acceptQuote.mutate(q.id)} className="p-1 hover:bg-muted rounded text-green-600" title="Accept"><Check className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p>No quotes yet. Create one from a booking.</p>
      </div>}
    </div>
  )
}
