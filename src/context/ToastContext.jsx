import { createContext, useCallback, useContext, useState } from 'react'
import { LuCircleCheck, LuTriangleAlert } from 'react-icons/lu'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const show = useCallback((message, tone = 'success') => {
    const id = Date.now()
    setToast({ id, message, tone })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[1000] flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className={`toast-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.tone === 'error' ? 'bg-rose-600' : 'bg-ink'
            }`}
          >
            {toast.tone === 'error' ? <LuTriangleAlert className="shrink-0" /> : <LuCircleCheck className="shrink-0" />}
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
