/**
 * Error and success toast composable.
 * Wraps vue-sonner's toast utility with convenience helpers for displaying
 * GraphQL / JS error messages and success confirmations.
 */
import { toast } from 'vue-sonner'

export function useErrorToast() {
  /**
   * Show an error toast, preferring the GraphQL message or a custom fallback.
   * @param {Error|object} err - The caught error object
   * @param {string} [fallbackMsg] - Message to display when no specific error text is available
   */
  function toastError(err, fallbackMsg) {
    const message =
      fallbackMsg ||
      err?.graphQLErrors?.[0]?.message ||
      err?.message ||
      'An unexpected error occurred'
    toast.error(message)
  }

  /**
   * Show a success toast.
   * @param {string} message - The success message to display
   */
  function toastSuccess(message) {
    toast.success(message)
  }

  return { toastError, toastSuccess }
}
