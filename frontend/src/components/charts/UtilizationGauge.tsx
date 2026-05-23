import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import apiClient from '@/api/client'

export function UtilizationGauge() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'utilization'], queryFn: () => apiClient.get('/reports/utilization').then(r => r.data) })

  if (isLoading) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>

  const rate = data?.utilizationRate ?? 0
  const chartData = [{ name: t('dashboard.booked'), value: rate }, { name: t('dashboard.available'), value: 100 - rate }]
  const color = rate > 75 ? '#22c55e' : rate > 40 ? '#f59e0b' : '#6b7280'

  return (
    <div className="space-y-3">
      <div className="text-center"><div className="text-3xl font-bold" style={{ color }}>{rate}%</div><div className="text-xs text-slate-500">{t('dashboard.last6Months')}</div></div>
      <div className="h-32"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={48} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}><Cell fill={color} /><Cell fill="hsl(var(--muted))" /></Pie><Legend verticalAlign="bottom" iconType="circle" formatter={v => <span className="text-xs text-slate-500">{v}</span>} /></PieChart></ResponsiveContainer></div>
      {data && <div className="text-xs text-center text-slate-500">{t('dashboard.itemDaysBooked', { booked: data.bookedDays, total: data.totalAvailableDays })}</div>}
    </div>
  )
}
