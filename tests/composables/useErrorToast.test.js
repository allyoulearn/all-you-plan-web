import { describe, it, expect, vi } from 'vitest'
import { useErrorToast } from '@/composables/useErrorToast.js'

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

import { toast } from 'vue-sonner'

describe('useErrorToast', () => {
  describe('toastError()', () => {
    it('calls toast.error with the fallback message', () => {
      const { toastError } = useErrorToast()
      toastError(null, 'Fallback message')
      expect(toast.error).toHaveBeenCalledWith('Fallback message')
    })

    it('prefers the graphQL error message over the fallback', () => {
      const { toastError } = useErrorToast()
      const err = { graphQLErrors: [{ message: 'GraphQL error' }], message: 'raw' }
      toastError(err, 'Fallback')
      expect(toast.error).toHaveBeenCalledWith('Fallback')
    })

    it('uses the generic message when no error and no fallback', () => {
      const { toastError } = useErrorToast()
      toastError(null, null)
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred')
    })

    it('uses err.message when fallback is not provided', () => {
      const { toastError } = useErrorToast()
      const err = { message: 'direct error' }
      toastError(err)
      expect(toast.error).toHaveBeenCalledWith('direct error')
    })
  })

  describe('toastSuccess()', () => {
    it('calls toast.success with the message', () => {
      const { toastSuccess } = useErrorToast()
      toastSuccess('Done!')
      expect(toast.success).toHaveBeenCalledWith('Done!')
    })
  })
})
