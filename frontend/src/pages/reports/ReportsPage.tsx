import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import apiClient from '@/api/client'
import { TrendingUp, AlertCircle, Gauge } from 'lucide-react'

export function ReportsPage() {
  const { t } = useTranslation()
  const [months, setMonths] = useState(6)

  const { data: revenue } = useQuery({
    queryKey: ['reports', 'revenue', months],
    queryFn: () => apiClient.get('/reports/revenue', { params: { months } }).then(r => r.data),
  })
  const { data: utilization } = useQuery({
    queryKey: ['reports', 'utilization', months],
    queryFn: () => apiClient.get('/reports/utilization', { params: { months } }).then(r => r.data),
  })
  const { data: outstanding } = useQuery({
    queryKey: ['reports', 'outstanding'],
    queryFn: () => apiClient.get('/reports/outstanding').then(r => r.data),
  })

  const revData = (revenue || []).map((d: any) => ({ name: new Date(d.year, d.month - 1).toLocaleDateString('en-US', { month: 'short' }), Revenue: d.total }))
  const agingData = [{ name: t('common.date'), value: outstanding?.current ?? 0 }, { name: '1-30d', value: outstanding?.days1to30 ?? 0 }, { name: '31-60d', value: outstanding?.days31to60 ?? 0 }, { name: '61-90d', value: outstanding?.days61to90 ?? 0 }, { name: '90d+', value: outstanding?.days90Plus ?? 0 }]
  const agingColors = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#7f1d1d']

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">{t('reports.title')}</h1><p className="text-slate-500 mt-0.5">{t('reports.subtitle')}</p></div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Period:</span>
          {[3, 6, 12].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                months === m ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {m}M
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6"><div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-blue-600" /></div><h2 className="font-semibold text-slate-900">{t('reports.monthlyRevenue')}</h2></div>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={revData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={v => `$${v}`} /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(v: number) => [`$${v.toFixed(2)}`, t('chart.revenue')]} /><Bar dataKey="Revenue" fill="url(#revGrad)" radius={[6, 6, 0, 0]} /><defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs></BarChart></ResponsiveContainer></div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6"><div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-red-500" /></div><h2 className="font-semibold text-slate-900">{t('reports.receivablesAging')}</h2></div>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={agingData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={v => `$${v}`} /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={(v: number) => [`$${v.toFixed(2)}`, t('chart.outstanding')]} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{agingData.map((_, i) => <Cell key={i} fill={agingColors[i]} />)}</Bar></BarChart></ResponsiveContainer></div>
          {outstanding && <div className="text-center mt-4"><span className="text-sm text-slate-500">{t('reports.totalOutstanding')}: </span><span className="text-lg font-bold text-red-600">${outstanding.total.toFixed(2)}</span></div>}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6"><div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Gauge className="h-4 w-4 text-emerald-600" /></div><h2 className="font-semibold text-slate-900">{t('reports.fleetUtilization')}</h2></div>
          {utilization ? (
            <div className="flex items-center justify-center py-8"><div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-40 h-40 -rotate-90"><circle cx="80" cy="80" r="64" fill="none" stroke="#e2e8f0" strokeWidth="16" /><circle cx="80" cy="80" r="64" fill="none" stroke="url(#utilGrad)" strokeWidth="16" strokeDasharray={`${2 * Math.PI * 64}`} strokeDashoffset={`${2 * Math.PI * 64 * (1 - utilization.utilizationRate / 100)}`} strokeLinecap="round" /><defs><linearGradient id="utilGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs></svg>
                <div className="absolute text-center"><div className="text-3xl font-bold text-slate-900">{utilization.utilizationRate}%</div><div className="text-xs text-slate-500">{t('reports.utilization')}</div></div>
              </div>
              <div className="mt-6 text-sm text-slate-500">{t('dashboard.itemDaysBooked', { booked: utilization.bookedDays, total: utilization.totalAvailableDays })}</div>
            </div></div>
          ) : <div className="text-sm text-slate-400 py-8 text-center">{t('reports.noUtilization')}</div>}
        </div>
      </div>
    </div>
  )
}
