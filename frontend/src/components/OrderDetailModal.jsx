import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useGetOrderByIdQuery } from '@/features/orders/ordersApi'
import { useGetCustomersQuery } from '@/features/customers/customersApi'
import { useGetProductsQuery } from '@/features/products/productsApi'

export function OrderDetailModal({ orderId, open, onClose }) {
  const { data: order, isLoading } = useGetOrderByIdQuery(orderId, { skip: !orderId })
  const { data: customers = [] } = useGetCustomersQuery()
  const { data: products = [] } = useGetProductsQuery()

  const customer = customers.find((c) => c.id === order?.customer_id)
  const getProductName = (pid) => products.find((p) => p.id === pid)?.name ?? pid

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-50">Order Details</Dialog.Title>
            <button
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading…</div>
          ) : order ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Order ID</p>
                  <p className="font-mono text-xs truncate text-gray-900 dark:text-gray-50">{order.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Customer</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{customer?.full_name ?? order.customer_id}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Created</p>
                  <p className="text-gray-900 dark:text-gray-50">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Total</p>
                  <p className="font-semibold text-xl text-gray-900 dark:text-gray-50">${parseFloat(order.total_amount).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Product</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Unit Price</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-50">{getProductName(item.product_id)}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">${parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-50">${parseFloat(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
