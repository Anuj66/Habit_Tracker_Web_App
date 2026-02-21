import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { XCircle } from 'lucide-react'
import { registerErrorHandler, unregisterErrorHandler } from '../errorNotifications'

const ToastContext = React.createContext(null)

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    ({ type, title, message, key }) => {
      setToasts((current) => {
        if (key && current.some((t) => t.key === key)) {
          return current
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const duration =
          type === 'success' ? 3000 : type === 'info' ? 4000 : type === 'warning' ? 5000 : 6000
        const toast = { id, type, title, message, key }
        setTimeout(() => removeToast(id), duration)
        return [...current, toast]
      })
    },
    [removeToast],
  )

  useEffect(() => {
    const handler = (payload) => {
      const title =
        payload.category === 'network_error'
          ? 'Network issue'
          : payload.category === 'validation_error'
          ? 'Validation error'
          : payload.category === 'auth_error'
          ? 'Authentication error'
          : payload.category === 'not_found'
          ? 'Not found'
          : payload.statusCode && payload.statusCode >= 500
          ? 'Server error'
          : 'Request error'

      const type =
        payload.category === 'network_error'
          ? 'error'
          : payload.category === 'validation_error'
          ? 'warning'
          : payload.category === 'client_error'
          ? 'warning'
          : payload.category === 'auth_error'
          ? 'warning'
          : payload.category === 'not_found'
          ? 'info'
          : 'error'

      const keyBase = payload.errorCode || payload.category || 'unknown_error'
      const key = `${keyBase}:${payload.statusCode || ''}`

      addToast({
        type,
        title,
        message:
          payload.message ||
          (payload.category === 'network_error'
            ? 'Unable to reach the server. Check your connection and try again.'
            : 'Something went wrong. Please try again.'),
        key,
      })
    }

    registerErrorHandler(handler)
    return () => {
      unregisterErrorHandler()
    }
  }, [addToast])

  const value = useMemo(
    () => ({
      addToast,
      removeToast,
    }),
    [addToast, removeToast],
  )

  const getToastStyles = (type) => {
    if (type === 'success') {
      return 'bg-emerald-600 text-white'
    }
    if (type === 'info') {
      return 'bg-blue-600 text-white'
    }
    if (type === 'warning') {
      return 'bg-amber-500 text-white'
    }
    return 'bg-red-600 text-white'
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center space-y-2 px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-md w-full rounded-xl shadow-lg flex items-start gap-3 px-4 py-3 ${getToastStyles(
              toast.type,
            )}`}
          >
            <div className="flex-1">
              <div className="font-semibold text-sm">{toast.title}</div>
              {toast.message && (
                <div className="text-xs mt-1 opacity-90 break-words">{toast.message}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <XCircle size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => React.useContext(ToastContext)

export default ToastProvider

