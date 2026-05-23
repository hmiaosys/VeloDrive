import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { dashboardApi } from '@/api/dashboard'
import { Bus, Users, Receipt, TrendingUp, Calendar, AlertCircle } from 'lucide-react'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get })

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>

  const stats = [
    { label: 'Active Items', value: data?.stats.activeItems ?? '—', icon: Bus },
    { label: 'Customers', value: data?.stats.totalCustomers ?? '—', icon: Users },
    { label: 'Active Bookings', value: data?.stats.activeBookings ?? '—', icon: Calendar },
    { label: 'Revenue (MTD)', value: `$${(data?.stats.revenueMtd ?? 0).toLocaleString()}`, icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.fullName}</h1>
          <p className="text-muted-foreground">Here's what's happening today.</p>
        </div>
        <Link to="/bookings/new" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          New Booking
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Upcoming Bookings</h2>
            {data.upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingBookings.map((b) => (
                  <Link key={b.id} to={`/bookings/${b.id}`} className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted">
                    <div>
                      <div className="text-sm font-medium">{b.customerName}</div>
                      <div className="text-xs text-muted-foreground">{b.bookingNumber} — {new Date(b.startDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${b.totalAmount.toFixed(2)}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{b.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Outstanding Invoices
            </h2>
            {data.outstandingInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">All clear — no outstanding invoices.</p>
            ) : (
              <div className="space-y-3">
                {data.outstandingInvoices.map((inv) => (
                  <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted">
                    <div>
                      <div className="text-sm font-medium">{inv.customerName}</div>
                      <div className="text-xs text-muted-foreground">{inv.invoiceNumber} — Due {new Date(inv.dueAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-destructive">${inv.amountDue.toFixed(2)}</div>
                      <span className="text-xs text-muted-foreground">{inv.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
