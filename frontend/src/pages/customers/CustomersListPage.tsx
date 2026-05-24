import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { customersApi, type CustomerResponse } from '@/api/customers'
import { Plus, Search, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function CustomersListPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', companyName: '', email: '', phone: '', billingAddress: '', notes: '', source: '' })
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll(search || undefined),
  })

  const createMutation = useMutation({
    mutationFn: () => customersApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setShowForm(false); setForm({ firstName: '', lastName: '', companyName: '', email: '', phone: '', billingAddress: '', notes: '', source: '' }); toast.success(t('customers.created')) },
    onError: () => toast.error(t('customers.createFailed')),
  })

  const count = customers?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('customers.title')}</h1>
          <p className="text-slate-500">{t('customers.subtitle', { count })}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
          <Plus className="h-4 w-4" /> {t('customers.addCustomer')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">{t('customers.newCustomer')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder={`${t('customers.firstName')} *`} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
            <input placeholder={`${t('customers.lastName')} *`} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
            <input placeholder={t('customers.company')} value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
            <input placeholder={t('customers.email')} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
            <input placeholder={t('customers.phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
            <input placeholder={t('customers.source')} value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
          </div>
          <textarea placeholder={t('customers.billingAddress')} value={form.billingAddress} onChange={e => setForm({...form, billingAddress: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" rows={2} />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={!form.firstName || !form.lastName || createMutation.isPending}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {createMutation.isPending ? t('customers.saving') : t('customers.saveCustomer')}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="search" placeholder={t('customers.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </div>

      {isLoading ? <div className="text-sm text-slate-400">{t('common.loading')}</div> : customers && customers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50/50">
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('customers.name')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('customers.company')}</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">{t('customers.contact')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('customers.bookings')}</th>
              <th className="text-right px-5 py-3 font-medium text-slate-600">{t('customers.revenue')}</th>
            </tr></thead>
            <tbody>
              {customers.map((c: CustomerResponse) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3"><Link to={`${c.id}`} className="font-medium hover:underline text-slate-900">{c.firstName} {c.lastName}</Link><div className="text-xs text-slate-400">{c.source}</div></td>
                  <td className="px-5 py-3 text-slate-500">{c.companyName || '—'}</td>
                  <td className="px-5 py-3">{c.email && <div className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" />{c.email}</div>}{c.phone && <div className="flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3 w-3" />{c.phone}</div>}</td>
                  <td className="px-5 py-3 text-right">{c.totalBookings}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">${c.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400">{t('customers.noCustomers')}</div>}
    </div>
  )
}
