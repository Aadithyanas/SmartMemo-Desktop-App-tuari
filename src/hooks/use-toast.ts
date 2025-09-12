import { useCallback } from "react"
import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title: string
  description?: string
  variant?: "default" | "destructive" | "success" | "info"
  duration?: number
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = "default", duration = 3000 }: ToastOptions) => {
      sonnerToast[variant === "destructive" ? "error" : "message"](
        title,
        {
          description,
          duration,
        }
      )
    },
    []
  )

  return { toast }
}
