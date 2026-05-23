import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'

export function AddOnsListPage() {
  const { data: addons, isLoading } = useQuery({
    queryKey: ['addons'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken')
      const r = await fetch('/api/addons', { headers: { Authorization: `Bearer ${token}` } })
      return r.json()
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add-ons</h1>
        <p className="text-muted-foreground">Services you offer alongside rentals</p>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : addons && addons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {addons.map((a: any) => (
            <div key={a.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{a.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{a.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">${a.basePrice}/{a.unitType}</span>
                <span className={a.isActive ? 'text-green-600' : 'text-red-600'}>{a.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">No add-ons configured.</div>}
    </div>
  )
}
