'use client'

import * as React from 'react'

type Toast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ToastState = {
  toasts: Toast[]
}

let count = 0
let memoryState: ToastState = { toasts: [] }
const listeners: Array<(state: ToastState) => void> = []

function dispatch(state: ToastState) {
  memoryState = state
  listeners.forEach((listener) => listener(memoryState))
}

function toast(payload: Omit<Toast, 'id'>) {
  count += 1
  const id = String(count)
  const nextToast: Toast = { ...payload, id, open: true }
  dispatch({ toasts: [nextToast, ...memoryState.toasts].slice(0, 1) })

  return {
    id,
    dismiss: () => {
      dispatch({
        toasts: memoryState.toasts.map((t) => (t.id === id ? { ...t, open: false } : t)),
      })
    },
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (!toastId) {
        dispatch({ toasts: [] })
        return
      }

      dispatch({ toasts: memoryState.toasts.filter((t) => t.id !== toastId) })
    },
  }
}

export { useToast, toast }
