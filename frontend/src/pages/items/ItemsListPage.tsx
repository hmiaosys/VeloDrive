import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { itemsApi, type ItemResponse } from '@/api/items'
import { categoriesApi } from '@/api/categories'
import { Plus, Bus, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

export function ItemsListPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', { search, categoryId: categoryFilter || undefined }],
    queryFn: () => itemsApi.getAll({ search, categoryId: categoryFilter || undefined }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Items</h1>
          <p className="text-muted-foreground">Manage your rentable items</p>
        </div>
        <Link
          to="/items/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Link>
      </div>

      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 border rounded-md text-sm bg-background"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-background"
        >
          <option value="">All Categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items && items.length > 0 ? (
        <div className="border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: ItemResponse) => (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link to={`/items/${item.id}`} className="font-medium hover:underline">
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        {item.name}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.categoryName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.sku || '—'}</td>
                  <td className="px-4 py-3 text-right">${item.basePrice.toFixed(2)}/{item.unitType}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Bus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium">No items yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add your first rentable item to get started.</p>
        </div>
      )}
    </div>
  )
}
