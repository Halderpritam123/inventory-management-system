import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react'
import { useGetDashboardStatsQuery } from '@/features/dashboard/dashboardApi'
import { StatCard } from '@/components/StatCard'
import { CardSkeleton } from '@/components/LoadingSkeleton'
import { ErrorState } from '@/components/ErrorState'
import { LowStockTable } from '@/components/LowStockTable'

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useGetDashboardStatsQuery()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your inventory and orders.</p>
      </div>

      {isError ? (
        <ErrorState
          message="Failed to load dashboard statistics."
          onRetry={refetch}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <StatCard label="Total Products" value={stats?.total_products} icon={Package} />
                <StatCard label="Total Customers" value={stats?.total_customers} icon={Users} />
                <StatCard label="Total Orders" value={stats?.total_orders} icon={ShoppingCart} />
                <StatCard label="Low Stock" value={stats?.low_stock_products} icon={AlertTriangle} />
              </>
            )}
          </div>

          <LowStockTable />
        </>
      )}
    </div>
  )
}
