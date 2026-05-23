import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import apiClient from '@/api/client'

export function RevenueChart() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'revenue'], queryFn: () => apiClient.get('/reports/revenue').then(r => r.data) })

  const chartData = (data || []).map((d: any) => ({ name: new Date(d.year, d.month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), Revenue: d.total }))

  if (isLoading) return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
  if (chartData.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">{t('dashboard.noRevenue')}</div>

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `$${v}`} />
          <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }} formatter={(v: number) => [`$${v.toFixed(2)}`, t('chart.revenue')]} />
          <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
