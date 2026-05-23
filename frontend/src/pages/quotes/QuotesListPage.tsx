import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { quotesApi } from '@/api/quotes'
import { FileText, Send, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const statusCls: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-green-100 text-green-700',
  Declined: 'bg-red-100 text-red-700',
  Expired: 'bg-yellow-100 text-yellow-700',
}

export function QuotesListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: quotes, isLoading } = useQuery({ queryKey: ['quotes'], queryFn: () => quotesApi.getAll() })

  const sendQuote = useMutation({
    mutationFn: (id: string) => quotesApi.send(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success(t('quotes.quoteSent')) },
    onError: (err: any) => toast.error(err.response?.data || t('quotes.quoteSent') + ' failed'),
  })
  const acceptQuote = useMutation({
    mutationFn: (id: string) => quotesApi.accept(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success(t('quotes.quoteAccepted')) },
    onError: (err: any) => toast.error(err.response?.data || t('quotes.quoteAccepted') + ' failed'),
  })

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">{t('quotes.title')}</h1><p className="text-slate-500">{t('quotes.subtitle', { count: quotes?.length ?? 0 })}</p></div>
      {isLoading ? <div className="text-sm text-slate-400">{t('common.loading')}</div> : quotes && quotes.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50/50">
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('quotes.quoteNumber')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('quotes.customer')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('quotes.amount')}</th>
              <th className="text-center px-5 py-3 font-medium text-slate-600">{t('quotes.status')}</th>
              <th className="text-center px-5 py-3 font-medium text-slate-600">{t('quotes.actions')}</th>
            </tr></thead>
            <tbody>
              {quotes.map((q: any) => {
                const status = q.status // Now a string like "Draft", "Sent", "Accepted"
                const isSending = sendQuote.isPending && sendQuote.variables === q.id
                const isAccepting = acceptQuote.isPending && acceptQuote.variables === q.id
                return (
                  <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-900">{q.quoteNumber}</td>
                    <td className="px-5 py-3 text-slate-500">{q.customerName}</td>
                    <td className="px-5 py-3 text-right">${q.totalAmount?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls[status] || 'bg-gray-100 text-gray-700'}`}>
                        {t(`quotes.${status.toLowerCase()}`, status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {status === 'Draft' && (
                          <button onClick={() => sendQuote.mutate(q.id)} disabled={isSending}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title={t('quotes.send')}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </button>
                        )}
                        {status === 'Sent' && (
                          <button onClick={() => acceptQuote.mutate(q.id)} disabled={isAccepting}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title={t('quotes.accept')}>
                            {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" /><p>{t('quotes.noQuotes')}</p>
        </div>
      )}
    </div>
  )
}
