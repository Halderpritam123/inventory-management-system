import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '@/features/products/productsApi'
import { ProductForm } from '@/components/ProductForm'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { useToast } from '@/components/Toast'

const PAGE_SIZE = 5

export default function ProductsPage() {
  const toast = useToast()
  const { data: products = [], isLoading, isError, refetch } = useGetProductsQuery()
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [currentPage, setCurrentPage] = useState(1)

  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return products.slice(start, start + PAGE_SIZE)
  }, [products, currentPage])

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  const handleCreate = async (data) => {
    try {
      await createProduct(data).unwrap()
      toast({ title: 'Product created', variant: 'default' })
      setAddOpen(false)
    } catch (err) {
      toast({ title: 'Error', description: err?.data?.detail || 'Failed to create product', variant: 'destructive' })
    }
  }

  const handleUpdate = async (data) => {
    try {
      await updateProduct({ id: editProduct.id, ...data }).unwrap()
      toast({ title: 'Product updated', variant: 'default' })
      setEditProduct(null)
    } catch (err) {
      toast({ title: 'Error', description: err?.data?.detail || 'Failed to update product', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteId).unwrap()
      toast({ title: 'Product deleted', variant: 'default' })
      setDeleteId(null)
    } catch (err) {
      toast({ title: 'Error', description: err?.data?.detail || 'Failed to delete product', variant: 'destructive' })
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState message="Failed to load products." onRetry={refetch} />
      ) : products.length === 0 ? (
        <EmptyState title="No products yet" description="Add your first product to get started." />
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">SKU</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Stock</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.map((product) => (
                <tr key={product.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-50">{product.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">{product.sku}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-50">${parseFloat(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.stock_quantity < 5
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditProduct(product)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        aria-label="Delete product"
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
            Showing {pagedProducts.length} of {products.length} products
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

      {/* Add Dialog */}
      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Add Product</Dialog.Title>
            <ProductForm onSubmit={handleCreate} isSubmitting={isCreating} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Dialog */}
      <Dialog.Root open={!!editProduct} onOpenChange={(v) => !v && setEditProduct(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Edit Product</Dialog.Title>
            {editProduct && (
              <ProductForm
                onSubmit={handleUpdate}
                defaultValues={editProduct}
                isSubmitting={isUpdating}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Product"
        description="This action cannot be undone. The product will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
      />
    </div>
  )
}
