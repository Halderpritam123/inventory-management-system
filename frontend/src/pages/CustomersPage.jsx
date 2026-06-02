import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
} from '@/features/customers/customersApi'
import { CustomerForm } from '@/components/CustomerForm'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { useToast } from '@/components/Toast'

export default function CustomersPage() {
  const toast = useToast()
  const { data: customers = [], isLoading, isError, refetch } = useGetCustomersQuery()
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const handleCreate = async (data) => {
    try {
      const payload = { full_name: data.full_name, email: data.email }
      if (data.phone) payload.phone = data.phone
      await createCustomer(payload).unwrap()
      toast({ title: 'Customer created', variant: 'default' })
      setAddOpen(false)
    } catch (err) {
      toast({ title: 'Error', description: err?.data?.detail || 'Failed to create customer', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCustomer(deleteId).unwrap()
      toast({ title: 'Customer deleted', variant: 'default' })
      setDeleteId(null)
    } catch (err) {
      toast({ title: 'Error', description: err?.data?.detail || 'Failed to delete customer', variant: 'destructive' })
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your customer registry.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : isError ? (
        <ErrorState message="Failed to load customers." onRetry={refetch} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Add your first customer to get started." />
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Phone</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-50">{customer.full_name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{customer.email}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{customer.phone || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(customer.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      aria-label="Delete customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Add Customer</Dialog.Title>
            <CustomerForm onSubmit={handleCreate} isSubmitting={isCreating} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Customer"
        description="This will permanently remove the customer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="Delete"
      />
    </div>
  )
}
