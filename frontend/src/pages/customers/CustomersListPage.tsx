import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { customersApi, type CustomerResponse } from '@/api/customers'
import { Plus, Search, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function CustomersListPage() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setShowForm(false)
      setForm({ firstName: '', lastName: '', companyName: '', email: '', phone: '', billingAddress: '', notes: '', source: '' })
      toast.success('Customer created')
    },
    onError: () => toast.error('Failed to create customer'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">{customers?.length ?? 0} customers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">New Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="First Name *" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
            <input placeholder="Last Name *" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
            <input placeholder="Company" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
            <input placeholder="Source (e.g. Website, Referral)" value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
          </div>
          <textarea placeholder="Billing Address" value={form.billingAddress} onChange={e => setForm({...form, billingAddress: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" rows={2} />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={!form.firstName || !form.lastName || createMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
              {createMutation.isPending ? 'Saving...' : 'Save Customer'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="search" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm" />
        </div>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : customers && customers.length > 0 ? (
        <div className="border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-right px-4 py-3 font-medium">Bookings</th>
                <th className="text-right px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: CustomerResponse) => (
                <tr key={c.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link to={`/customers/${c.id}`} className="font-medium hover:underline">{c.firstName} {c.lastName}</Link>
                    <div className="text-xs text-muted-foreground">{c.source}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.companyName || '—'}</td>
                  <td className="px-4 py-3">
                    {c.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</div>}
                    {c.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">{c.totalBookings}</td>
                  <td className="px-4 py-3 text-right font-medium">${c.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">No customers found.</div>}
    </div>
  )
}
