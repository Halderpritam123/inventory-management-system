import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema } from '@/lib/schemas'

const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 placeholder-gray-400 dark:placeholder-gray-500"

export function ProductForm({ onSubmit, defaultValues, isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues || { name: '', sku: '', price: '', stock_quantity: 0 },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input
          {...register('name')}
          className={inputClass}
          placeholder="Product name"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
        <input
          {...register('sku')}
          className={`${inputClass} font-mono`}
          placeholder="SKU-001"
        />
        {errors.sku && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.sku.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
        <input
          {...register('price', { valueAsNumber: true })}
          type="number"
          step="0.01"
          min="0.01"
          className={inputClass}
          placeholder="0.00"
        />
        {errors.price && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.price.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
        <input
          {...register('stock_quantity', { valueAsNumber: true })}
          type="number"
          min="0"
          className={inputClass}
          placeholder="0"
        />
        {errors.stock_quantity && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.stock_quantity.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  )
}
