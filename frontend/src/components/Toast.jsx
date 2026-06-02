import { useState, useCallback, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, description, variant = 'default' }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, title, description, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-xl
              bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50
              ${t.variant === 'destructive'
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-200 dark:border-gray-700'
              }`}
          >
            {t.variant === 'destructive' ? (
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t.title}</p>
              )}
              {t.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
