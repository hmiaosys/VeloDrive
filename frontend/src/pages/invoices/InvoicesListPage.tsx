import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { invoicesApi } from '@/api/invoices'
import { Receipt } from 'lucide-react'

const statusColors: Record<string, string> = { Draft: 'bg-gray-100 text-gray-700', Sent: 'bg-blue-100 text-blue-700', Paid: 'bg-green-100 text-green-700', PartiallyPaid: 'bg-yellow-100 text-yellow-700', Overdue: 'bg-red-100 text-red-700', Void: 'bg-gray-100 text-gray-500 line-through' }

export function InvoicesListPage() {
  const { t } = useTranslation()
  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => invoicesApi.getAll() })

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">{t('invoices.title')}</h1><p className="text-slate-500">{t('invoices.subtitle', { count: invoices?.length ?? 0 })}</p></div>
      {isLoading ? <div className="text-sm text-slate-400">{t('common.loading')}</div> : invoices && invoices.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50/50">
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('invoices.invoiceNumber')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('invoices.customer')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('invoices.type')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('invoices.total')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('invoices.paid')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('invoices.due')}</th>
              <th className="text-center px-5 py-3 font-medium text-slate-600">{t('invoices.status')}</th>
            </tr></thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3"><Link to={`/invoices/${inv.id}`} className="font-medium hover:underline text-slate-900">{inv.invoiceNumber}</Link><div className="text-xs text-slate-400">{inv.bookingNumber}</div></td>
                  <td className="px-5 py-3 text-slate-500">{inv.customerName}</td>
                  <td className="px-5 py-3 text-slate-500">{inv.type}</td>
                  <td className="px-5 py-3 text-right">${inv.totalAmount.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-green-600">${inv.amountPaid.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-medium text-red-600">${inv.amountDue.toFixed(2)}</td>
                  <td className="px-5 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || ''}`}>{t(`invoices.${inv.status.charAt(0).toLowerCase() + inv.status.slice(1)}`, inv.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-300" /><p>{t('invoices.noInvoices')}</p>
        </div>
      )}
    </div>
  )
}
