import { useEffect, useMemo, useState } from 'react'
import { Plus, Eye, Trash2 } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
} from '@/features/orders/ordersApi'
import { useGetCustomersQuery } from '@/features/customers/customersApi'
import { OrderCreateForm } from '@/components/OrderCreateForm'
import { OrderDetailModal } from '@/components/OrderDetailModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { useToast } from '@/components/Toast'

const PAGE_SIZE = 5

export default function OrdersPage() {
  const toast = useToast()
  const { data: orders = [], isLoading, isError, refetch } = useGetOrdersQuery()
  const { data: customers = [] } = useGetCustomersQuery()
  const [deleteOrder] = useDeleteOrderMutation()
  const [currentPage, setCurrentPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [viewOrderId, setViewOrderId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return orders.slice(start, start + PAGE_SIZE)
  }, [orders, currentPage])

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  const getCustomerName = (customerId) =>
    customers.find((c) => c.id === customerId)?.full_name ?? 'Unknown'

  const handleDelete = async () => {
    try {
      await deleteOrder(deleteId).unwrap()
      toast({ title: 'Order cancelled and inventory restored', variant: 'default' })
      setDeleteId(null)
    } catch (err) {
      toast({ title: 'Error', description: err?.data?.detail || 'Failed to cancel order', variant: 'destructive' })
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage customer orders.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Order
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState message="Failed to load orders." onRetry={refetch} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Create your first order to get started." />
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Created</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{order.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-50">{getCustomerName(order.customer_id)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-50">${parseFloat(order.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewOrderId(order.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label="View order details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(order.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        aria-label="Cancel order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {pagedOrders.length} of {orders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </>
      )}

      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Create Order</Dialog.Title>
            <OrderCreateForm
              onSuccess={() => setCreateOpen(false)}
              onCancel={() => setCreateOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <OrderDetailModal
        orderId={viewOrderId}
        open={!!viewOrderId}
        onClose={() => setViewOrderId(null)}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Cancel Order"
        description="This will cancel the order and restore inventory for all items."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Cancel Order"
      />
    </div>
  )
}
