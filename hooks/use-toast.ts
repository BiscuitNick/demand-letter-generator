import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

/**
 * Toast hook using sonner
 */
export function useToast() {
  const toast = ({ title, description, variant }: ToastOptions) => {
    const message = description ? `${title}\n${description}` : title

    if (variant === 'destructive') {
      sonnerToast.error(message)
    } else {
      sonnerToast.success(message)
    }
  }

  return { toast }
}
