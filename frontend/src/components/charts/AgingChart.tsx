import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import apiClient from '@/api/client'

export function AgingChart() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'outstanding'], queryFn: () => apiClient.get('/reports/outstanding').then(r => r.data) })

  if (isLoading) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>

  const chartData = [
    { name: t('common.date'), value: data?.current ?? 0 },
    { name: '1-30d', value: data?.days1to30 ?? 0 },
    { name: '31-60d', value: data?.days31to60 ?? 0 },
    { name: '61-90d', value: data?.days61to90 ?? 0 },
    { name: '90d+', value: data?.days90Plus ?? 0 },
  ]
  const colors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444', '#7f1d1d']

  if (chartData.every(d => d.value === 0)) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">{t('dashboard.noOutstanding')}</div>

  return (
    <div>
      <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `$${v}`} /><Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff' }} formatter={(v: number) => [`$${v.toFixed(2)}`, t('chart.outstanding')]} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{chartData.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Bar></BarChart></ResponsiveContainer></div>
      {data && <div className="text-xs text-center text-slate-500 mt-1">{t('dashboard.totalOutstanding')}: <span className="font-bold text-red-600">${data.total.toFixed(2)}</span></div>}
    </div>
  )
}
