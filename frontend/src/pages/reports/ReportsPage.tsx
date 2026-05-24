import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import apiClient from '@/api/client'
import { Gauge, TrendingUp, Users, FileText, ArrowUp, ArrowDown } from 'lucide-react'

function MonthPicker({ months, setMonths }: { months: number; setMonths: (m: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Period:</span>
      {[3, 6, 12].map(m => (
        <button key={m} onClick={() => setMonths(m)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            months === m ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>{m}M</button>
      ))}
    </div>
  )
}

export function ReportsPage() {
  const { t } = useTranslation()
  const [months, setMonths] = useState(6)

  const { data: util } = useQuery({
    queryKey: ['reports', 'utilization', months],
    queryFn: () => apiClient.get('/reports/utilization', { params: { months } }).then(r => r.data),
  })
  const { data: pipeline } = useQuery({
    queryKey: ['reports', 'pipeline', months],
    queryFn: () => apiClient.get('/reports/pipeline', { params: { months } }).then(r => r.data),
  })
  const { data: custData } = useQuery({
    queryKey: ['reports', 'customers'],
    queryFn: () => apiClient.get('/reports/customers').then(r => r.data),
  })
  const { data: quoteData } = useQuery({
    queryKey: ['reports', 'quotes'],
    queryFn: () => apiClient.get('/reports/quotes').then(r => r.data),
  })

  const statusColors: Record<string, string> = {
    Draft: '#94a3b8', Quoted: '#f59e0b', Confirmed: '#3b82f6',
    InProgress: '#22c55e', Completed: '#10b981', Canceled: '#ef4444',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-0.5">Operational insights for your rental business</p>
        </div>
        <MonthPicker months={months} setMonths={setMonths} />
      </div>

      {/* Row 1: Fleet Utilization + Booking Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Utilization */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><Gauge className="h-4 w-4 text-blue-600" /></div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Fleet Utilization</h2>
              {util?.overall && (
                <p className="text-xs text-slate-500">{util.overall.rate}% overall · {util.overall.totalBookedDays} of {util.overall.totalAvailableDays} days booked</p>
              )}
            </div>
          </div>
          {util?.items ? (
            <div className="space-y-2">
              {util.items.map((i: any) => (
                <div key={i.id} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-slate-700 truncate" title={i.name}>{i.name}</div>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${i.utilization > 75 ? 'bg-emerald-500' : i.utilization > 40 ? 'bg-amber-500' : 'bg-slate-300'}`}
                      style={{ width: `${i.utilization}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs font-medium text-slate-600">{i.utilization}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </div>

        {/* Booking Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-violet-600" /></div>
            <h2 className="font-semibold text-slate-900 text-sm">Booking Pipeline</h2>
          </div>
          {pipeline?.counts ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline.counts} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]}>
                    {pipeline.counts.map((d: any) => <Cell key={d.status} fill={statusColors[d.status] || '#94a3b8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Row 2: Quote Conversion + Customer Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Conversion */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center"><FileText className="h-4 w-4 text-amber-600" /></div>
            <h2 className="font-semibold text-slate-900 text-sm">Quote Conversion</h2>
          </div>
          {quoteData ? (
            <div className="space-y-4">
              {/* Big conversion rate number */}
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-slate-900">{quoteData.conversionRate}%</div>
                <div className="text-xs text-slate-500 mt-1">conversion rate · {quoteData.accepted} of {quoteData.total} accepted</div>
                <div className="text-xs text-slate-400 mt-0.5">avg {quoteData.avgDaysToAccept} days to accept</div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Sent', value: quoteData.sent, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Accepted', value: quoteData.accepted, color: 'bg-green-50 text-green-700' },
                  { label: 'Declined', value: quoteData.declined, color: 'bg-red-50 text-red-700' },
                  { label: 'Expired', value: quoteData.expired, color: 'bg-gray-50 text-gray-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`${color} rounded-xl p-3 text-center`}>
                    <div className="text-lg font-bold">{value}</div>
                    <div className="text-[10px] font-medium">{label}</div>
                  </div>
                ))}
              </div>

              {/* Monthly trend */}
              {quoteData.monthly?.length > 0 && (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quoteData.monthly.map((d: any) => ({
                      name: new Date(d.year, d.month - 1).toLocaleDateString('en-US', { month: 'short' }),
                      Created: d.created, Accepted: d.accepted
                    }))} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Bar dataKey="Created" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Accepted" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </div>

        {/* Customer Value */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Users className="h-4 w-4 text-emerald-600" /></div>
            <h2 className="font-semibold text-slate-900 text-sm">Customer Value</h2>
          </div>
          {custData ? (
            <div className="space-y-4">
              {/* Top customers */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Top Customers by Bookings</div>
                <div className="space-y-1">
                  {custData.topCustomers?.slice(0, 5).map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300 w-4">{i + 1}</span>
                        <span className="text-slate-800">{c.name}</span>
                        {c.companyName && <span className="text-xs text-slate-400">{c.companyName}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">{c.totalBookings} bookings</span>
                        <span className="font-medium text-slate-700">${c.totalRevenue.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New vs Returning */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Returning', value: custData.newVsReturning?.returning, color: 'text-emerald-600', icon: ArrowUp },
                  { label: 'Once', value: custData.newVsReturning?.once, color: 'text-amber-600', icon: ArrowDown },
                  { label: 'Never Booked', value: custData.newVsReturning?.zero, color: 'text-slate-400', icon: ArrowDown },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
                      <Icon className="h-2.5 w-2.5" />{label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Churn risk */}
              {custData.churnRisk?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Churn Risk (no recent booking)</div>
                  <div className="space-y-1">
                    {custData.churnRisk.slice(0, 4).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{c.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          c.risk === 'high' ? 'bg-red-100 text-red-700' :
                          c.risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.daysSince === 2147483647 ? 'never' : `${c.daysSince}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
