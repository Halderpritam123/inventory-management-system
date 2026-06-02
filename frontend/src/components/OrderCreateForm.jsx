import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useGetCustomersQuery } from '@/features/customers/customersApi'
import { useGetProductsQuery } from '@/features/products/productsApi'
import { useCreateOrderMutation } from '@/features/orders/ordersApi'
import { useToast } from '@/components/Toast'

const selectClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"

export function OrderCreateForm({ onSuccess, onCancel }) {
  const toast = useToast()
  const { data: customers = [] } = useGetCustomersQuery()
  const { data: products = [] } = useGetProductsQuery()
  const [createOrder, { isLoading }] = useCreateOrderMutation()

  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])

  const addItem = () => setItems((prev) => [...prev, { product_id: '', quantity: 1 }])
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))
  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const computedTotal = items.reduce((sum, item) => {
    if (!item.product_id || !item.quantity) return sum
    const product = products.find((p) => p.id === item.product_id)
    if (!product) return sum
    return sum + parseFloat(product.price) * parseInt(item.quantity, 10)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerId) return toast({ title: 'Please select a customer', variant: 'destructive' })
    const validItems = items.filter((i) => i.product_id && i.quantity > 0)
    if (validItems.length === 0) return toast({ title: 'Add at least one product', variant: 'destructive' })

    try {
      await createOrder({
        customer_id: customerId,
        items: validItems.map((i) => ({ product_id: i.product_id, quantity: parseInt(i.quantity, 10) })),
      }).unwrap()
      toast({ title: 'Order created', variant: 'default' })
      onSuccess?.()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.detail || 'Failed to create order',
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className={selectClass}
        >
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} ({c.email})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Products</label>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:underline"
          >
            <Plus className="h-3 w-3" /> Add item
          </button>
        </div>

        {items.map((item, idx) => {
          const product = products.find((p) => p.id === item.product_id)
          const subtotal = product && item.quantity > 0
            ? parseFloat(product.price) * parseInt(item.quantity, 10)
            : 0

          return (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={item.product_id}
                onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                className={`flex-1 ${selectClass}`}
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${parseFloat(p.price).toFixed(2)}) — {p.stock_quantity} in stock
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                placeholder="Qty"
              />

              {subtotal > 0 && (
                <span className="min-w-[68px] text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  ${subtotal.toFixed(2)}
                </span>
              )}

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Estimated Total</span>
          <span className="font-semibold text-gray-900 dark:text-gray-50">${computedTotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">Backend calculates the final total.</p>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Creating…' : 'Create Order'}
        </button>
      </div>
    </form>
  )
}
