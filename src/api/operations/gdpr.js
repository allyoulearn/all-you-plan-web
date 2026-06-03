/** GraphQL operations for GDPR data export + soft-delete (Phase 4 Item B). */
import { gql } from '@apollo/client/core'

export const REQUEST_DATA_EXPORT = gql`
  mutation RequestDataExport {
    requestDataExport {
      downloadUrl
      sizeBytes
      expiresAt
      sha256
    }
  }
`

export const REQUEST_ACCOUNT_DELETION = gql`
  mutation RequestAccountDeletion($reason: String) {
    requestAccountDeletion(reason: $reason) {
      requestedAt
      purgeAt
      reason
    }
  }
`

export const CANCEL_ACCOUNT_DELETION = gql`
  mutation CancelAccountDeletion {
    cancelAccountDeletion
  }
`
