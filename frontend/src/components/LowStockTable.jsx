import { useGetProductsQuery } from '@/features/products/productsApi'
import { TableSkeleton } from './LoadingSkeleton'
import { EmptyState } from './EmptyState'
import { AlertTriangle } from 'lucide-react'

const LOW_STOCK_THRESHOLD = 5

export function LowStockTable() {
  const { data: products = [], isLoading, isError } = useGetProductsQuery()

  const lowStock = products.filter((p) => p.stock_quantity < LOW_STOCK_THRESHOLD)

  if (isLoading) return <TableSkeleton rows={3} cols={3} />
  if (isError) return <p className="text-sm text-destructive">Failed to load products.</p>

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Low Stock Products</h3>
        <span className="ml-auto text-xs text-muted-foreground">&lt; {LOW_STOCK_THRESHOLD} units</span>
      </div>
      {lowStock.length === 0 ? (
        <EmptyState
          title="All products are well-stocked"
          description="No products are below the low stock threshold."
          icon={AlertTriangle}
        />
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((product) => (
              <tr key={product.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{product.sku}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    product.stock_quantity === 0
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {product.stock_quantity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
