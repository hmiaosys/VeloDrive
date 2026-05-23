import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { bookingsApi, type BookingResponse } from '@/api/bookings'
import { Plus } from 'lucide-react'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700', Quoted: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700', InProgress: 'bg-green-100 text-green-700',
  Completed: 'bg-emerald-100 text-emerald-700', Canceled: 'bg-red-100 text-red-700',
}

export function BookingsListPage() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('')
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: () => bookingsApi.getAll({ status: statusFilter || undefined }),
  })

  const statuses = ['', 'Draft', 'Quoted', 'Confirmed', 'InProgress', 'Completed', 'Canceled']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('bookings.title')}</h1>
          <p className="text-slate-500">{t('bookings.subtitle', { count: bookings?.length ?? 0 })}</p>
        </div>
        <Link to="/bookings/new" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
          <Plus className="h-4 w-4" /> {t('bookings.newBooking')}
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s ? t(`bookings.${s.charAt(0).toLowerCase() + s.slice(1)}`) : t('common.all')}
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-sm text-slate-400">{t('common.loading')}</div> : bookings && bookings.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50/50">
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('bookings.bookingNumber')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('bookings.customer')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('bookings.dates')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('bookings.items')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('bookings.total')}</th>
              <th className="text-center px-5 py-3 font-medium text-slate-600">{t('bookings.status')}</th>
            </tr></thead>
            <tbody>
              {bookings.map((b: BookingResponse) => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3"><Link to={`/bookings/${b.id}`} className="font-medium hover:underline text-slate-900">{b.bookingNumber}</Link></td>
                  <td className="px-5 py-3">{b.customerName}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate-500">{b.items.map(i => i.itemName).join(', ')}</td>
                  <td className="px-5 py-3 text-right font-medium">${b.totalAmount.toFixed(2)}</td>
                  <td className="px-5 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || ''}`}>{t(`bookings.${b.status.charAt(0).toLowerCase() + b.status.slice(1)}`, b.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400">{t('bookings.noBookings')}</div>}
    </div>
  )
}
