import { toast } from 'vue-sonner'

export function useErrorToast() {
  function toastError(err, fallbackMsg) {
    const message =
      fallbackMsg ||
      err?.graphQLErrors?.[0]?.message ||
      err?.message ||
      'An unexpected error occurred'
    toast.error(message)
  }

  function toastSuccess(message) {
    toast.success(message)
  }

  return { toastError, toastSuccess }
}
