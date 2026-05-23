import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { bookingsApi, type BookingResponse } from '@/api/bookings'
import { Plus } from 'lucide-react'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Quoted: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-green-100 text-green-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Canceled: 'bg-red-100 text-red-700',
}

export function BookingsListPage() {
  const [statusFilter, setStatusFilter] = useState('')

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: () => bookingsApi.getAll({ status: statusFilter || undefined }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">{bookings?.length ?? 0} bookings</p>
        </div>
        <Link to="/bookings/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> New Booking
        </Link>
      </div>

      <div className="flex gap-2">
        {['', 'Draft', 'Quoted', 'Confirmed', 'InProgress', 'Completed', 'Canceled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : bookings && bookings.length > 0 ? (
        <div className="border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Booking #</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Dates</th>
                <th className="text-left px-4 py-3 font-medium">Items</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: BookingResponse) => (
                <tr key={b.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link to={`/bookings/${b.id}`} className="font-medium hover:underline">{b.bookingNumber}</Link>
                  </td>
                  <td className="px-4 py-3">{b.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.items.map(i => i.itemName).join(', ')}</td>
                  <td className="px-4 py-3 text-right font-medium">${b.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || ''}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">No bookings found.</div>}
    </div>
  )
}
