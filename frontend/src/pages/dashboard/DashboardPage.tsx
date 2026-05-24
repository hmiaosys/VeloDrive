import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { dashboardApi } from '@/api/dashboard'
import { Bus, Calendar, FileText, Clock, AlertCircle, MapPin, Phone, ChevronRight } from 'lucide-react'

export function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get })

  const name = user?.firstName ?? ''
  const greeting = `${t('dashboard.greeting')}${name ? `, ${name}` : ''} 👋`

  if (isLoading) return <div className="space-y-6"><div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div></div>

  const stats = data?.stats
  const schedule = data?.todaySchedule ?? []
  const attention = data?.needsAttention

  const statCards = [
    { value: stats?.itemsOutNow ?? '—', label: 'On Rent Now', icon: Bus, to: 'bookings', bg: 'bg-blue-50', color: 'text-blue-700' },
    { value: stats?.availableToday ?? '—', label: 'Available Today', icon: Calendar, to: 'items', bg: 'bg-emerald-50', color: 'text-emerald-700' },
    { value: stats?.pendingQuotes ?? '—', label: 'Pending Quotes', icon: FileText, to: 'quotes', bg: 'bg-amber-50', color: 'text-amber-700' },
    { value: stats?.activeThisWeek ?? '—', label: 'Active This Week', icon: Clock, to: 'bookings', bg: 'bg-violet-50', color: 'text-violet-700' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
        <p className="text-slate-500 mt-0.5">{t('dashboard.subtitle')}</p>
      </div>

      {/* Operational stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ value, label, icon: Icon, to, bg, color }) => (
          <Link key={label} to={to}
            className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{label}</div>
              </div>
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule - takes 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Today's Schedule
          </h2>
          {schedule.length > 0 ? (
            <div className="space-y-3">
              {schedule.map((b: any) => {
                const isPickup = b.startDate === new Date().toISOString().split('T')[0]
                const isDropoff = b.endDate === new Date().toISOString().split('T')[0]
                return (
                  <Link key={b.id} to={`bookings/${b.id}`}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors border border-transparent hover:border-blue-100">
                    <div className={`mt-0.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isPickup ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isPickup ? 'PICKUP' : 'RETURN'}
                      {isPickup && b.pickupTime ? <div className="text-[9px] font-normal">{b.pickupTime}</div> : null}
                      {isDropoff && b.returnTime ? <div className="text-[9px] font-normal">{b.returnTime}</div> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{b.customerName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{b.items?.join(', ')}</div>
                      {b.pickupLocation && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <MapPin className="h-3 w-3" /> {b.pickupLocation}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-medium text-slate-500">{b.bookingNumber}</div>
                      {b.phone && <div className="flex items-center gap-1 text-xs text-slate-400 mt-1"><Phone className="h-3 w-3" />{b.phone}</div>}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">Nothing scheduled today. Enjoy the quiet!</div>
          )}
        </div>

        {/* Needs attention - takes 1/3 */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" /> Needs Attention
          </h2>

          <div className="space-y-5">
            {/* Draft bookings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Draft Bookings</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{attention?.draftBookings?.length ?? 0}</span>
              </div>
              {attention?.draftBookings?.length > 0 ? (
                <div className="space-y-1.5">
                  {attention.draftBookings.map((b: any) => (
                    <Link key={b.id} to={`bookings/${b.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-sm">
                      <div>
                        <div className="font-medium text-slate-800">{b.customerName}</div>
                        <div className="text-xs text-slate-400">{b.bookingNumber} · {b.startDate}</div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    </Link>
                  ))}
                </div>
              ) : <div className="text-xs text-slate-400 py-2">None — nice work</div>}
            </div>

            {/* Expiring quotes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quotes Expiring Soon</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">{attention?.expiringQuotes?.length ?? 0}</span>
              </div>
              {attention?.expiringQuotes?.length > 0 ? (
                <div className="space-y-1.5">
                  {attention.expiringQuotes.map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-sm">
                      <div>
                        <div className="font-medium text-slate-800">{q.customerName}</div>
                        <div className="text-xs text-slate-400">${q.totalAmount?.toFixed(2)} · Expires {new Date(q.validUntil).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-xs text-slate-400 py-2">None — all good</div>}
            </div>

            {/* Unpaid invoices */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unpaid Invoices</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{attention?.unpaidInvoices?.length ?? 0}</span>
              </div>
              {attention?.unpaidInvoices?.length > 0 ? (
                <div className="space-y-1.5">
                  {attention.unpaidInvoices.map((inv: any) => (
                    <Link key={inv.id} to={`../../invoices/${inv.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-sm">
                      <div>
                        <div className="font-medium text-slate-800">{inv.customerName}</div>
                        <div className="text-xs text-slate-400">{inv.invoiceNumber} · Due {new Date(inv.dueAt).toLocaleDateString()}</div>
                      </div>
                      <span className="text-sm font-bold text-red-600">${inv.amountDue?.toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
              ) : <div className="text-xs text-slate-400 py-2">All paid up</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
