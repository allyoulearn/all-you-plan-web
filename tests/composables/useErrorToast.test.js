import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorToast } from '@/composables/useErrorToast.js'

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

import { toast } from 'vue-sonner'

describe('useErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toastError()', () => {
    it('uses the fallback message when the error has no graphQL or plain message', () => {
      const { toastError } = useErrorToast()
      toastError(null, 'Fallback message')
      expect(toast.error).toHaveBeenCalledWith('Fallback message')
    })

    it('prefers the graphQL error message over fallback and err.message', () => {
      const { toastError } = useErrorToast()
      const err = { graphQLErrors: [{ message: 'GraphQL error' }], message: 'raw' }
      toastError(err, 'Fallback')
      expect(toast.error).toHaveBeenCalledWith('GraphQL error')
    })

    it('uses err.message when no graphQL error is present, even if fallback is given', () => {
      const { toastError } = useErrorToast()
      const err = { message: 'plain error' }
      toastError(err, 'Fallback')
      expect(toast.error).toHaveBeenCalledWith('plain error')
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

    it('uses generic message when err is undefined and no fallback', () => {
      const { toastError } = useErrorToast()
      toastError(undefined)
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred')
    })

    it('handles empty graphQLErrors array by falling through to err.message', () => {
      const { toastError } = useErrorToast()
      const err = { graphQLErrors: [], message: 'network error' }
      toastError(err, 'Fallback')
      expect(toast.error).toHaveBeenCalledWith('network error')
    })

    it('handles multiple graphQLErrors by using the first message only', () => {
      const { toastError } = useErrorToast()

      const err = {
        graphQLErrors: [{ message: 'first error' }, { message: 'second error' }]
      }

      toastError(err)
      expect(toast.error).toHaveBeenCalledWith('first error')
    })
  })

  describe('resolveErrorMessage()', () => {
    it('prefers graphQL error message over err.message and fallback', () => {
      const { resolveErrorMessage } = useErrorToast()
      const err = { graphQLErrors: [{ message: 'GraphQL error' }], message: 'raw' }
      expect(resolveErrorMessage(err, 'Fallback')).toBe('GraphQL error')
    })

    it('uses err.message when no graphQL error is present', () => {
      const { resolveErrorMessage } = useErrorToast()
      const err = { message: 'plain error' }
      expect(resolveErrorMessage(err, 'Fallback')).toBe('plain error')
    })

    it('uses fallback when err has no message or graphQL errors', () => {
      const { resolveErrorMessage } = useErrorToast()
      expect(resolveErrorMessage(null, 'Fallback message')).toBe('Fallback message')
    })

    it('returns generic message when everything is absent', () => {
      const { resolveErrorMessage } = useErrorToast()
      expect(resolveErrorMessage(null, null)).toBe('An unexpected error occurred')
    })
  })

  describe('toastSuccess()', () => {
    it('calls toast.success with the message', () => {
      const { toastSuccess } = useErrorToast()
      toastSuccess('Done!')
      expect(toast.success).toHaveBeenCalledWith('Done!')
    })

    it('calls toast.success with an empty string when passed one', () => {
      const { toastSuccess } = useErrorToast()
      toastSuccess('')
      expect(toast.success).toHaveBeenCalledWith('')
    })
  })
})
