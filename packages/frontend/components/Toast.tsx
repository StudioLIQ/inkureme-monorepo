"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: string; message: string; type: ToastType }

type ToastContextValue = {
  addToast: (message: string, type?: ToastType, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

export function ToastProvider({
  children,
  position = 'bottom-right',
  defaultDurations = { success: 2800, error: 4000, info: 2600 },
}: {
  children: React.ReactNode
  position?: Position
  defaultDurations?: { success: number; error: number; info: number }
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', durationMs?: number) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, message, type }])
      const dur = durationMs ?? (type === 'success' ? defaultDurations.success : type === 'error' ? defaultDurations.error : defaultDurations.info)
      if (dur > 0) {
        window.setTimeout(() => remove(id), dur)
      }
    },
    [remove, defaultDurations]
  )

  const value = useMemo(() => ({ addToast }), [addToast])

  const containerPos = useMemo(() => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2'
      default:
        return 'bottom-4 right-4'
    }
  }, [position])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container */}
      <div className={`fixed ${containerPos} z-[100] flex flex-col gap-2`}> 
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-md shadow-lg px-3 py-2 text-sm text-white transition-all backdrop-blur-sm ${
              t.type === 'success'
                ? 'bg-emerald-600/95'
              : t.type === 'error'
                ? 'bg-rose-600/95'
                : 'bg-gray-900/90'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
