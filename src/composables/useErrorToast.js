/**
 * Error and success toast composable.
 * Wraps vue-sonner's toast utility with convenience helpers for displaying
 * GraphQL / JS error messages and success confirmations.
 *
 * Error-surfacing convention (WEB-T09-003):
 * - Mutations that the user explicitly triggered (capture, save, complete, etc.)
 *   call toastError() so the user is immediately notified of the failure.
 * - Background loads (store load() actions) set their error.value ref for
 *   inline display in the view; they do NOT call toastError(). This keeps
 *   passive data-fetching failures unobtrusive while still surfacing the error
 *   through the view's error state binding.
 * - Auth flow errors (login, register, forgotPassword, resetPassword) re-throw
 *   to the calling view, which renders an inline error paragraph. This gives
 *   auth forms precise placement of the error message relative to the form.
 */
import { toast } from 'vue-sonner'

export function useErrorToast() {
  /**
   * Resolve the display message from an error object without showing a toast.
   * Useful when the view wants to display the error inline rather than as a toast.
   * Priority: GraphQL error → networkError → err.message → fallbackMsg → generic.
   * Including `networkError.message` (WEB-W2-20) surfaces the server's
   * diagnostic on transport-layer failures (502/503/etc.) rather than the
   * wrapper's generic "Network error" text.
   * @param {Error|object} err - The caught error object
   * @param {string} [fallbackMsg] - Message to display when no specific error text is available
   * @returns {string}
   */
  function resolveErrorMessage(err, fallbackMsg) {
    return (
      err?.graphQLErrors?.[0]?.message ||
      err?.networkError?.message ||
      err?.message ||
      fallbackMsg ||
      'An unexpected error occurred'
    )
  }

  /**
   * Show an error toast, preferring the GraphQL message over a fallback.
   * Priority: GraphQL error → err.message → fallbackMsg → generic message.
   * @param {Error|object} err - The caught error object
   * @param {string} [fallbackMsg] - Message to display when no specific error text is available
   */
  function toastError(err, fallbackMsg) {
    toast.error(resolveErrorMessage(err, fallbackMsg))
  }

  /**
   * Show a success toast.
   * @param {string} message - The success message to display
   */
  function toastSuccess(message) {
    toast.success(message)
  }

  return { resolveErrorMessage, toastError, toastSuccess }
}
