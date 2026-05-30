/** GraphQL operations for account management. */
import { gql } from '@apollo/client/core'

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($emailConfirmation: String!) {
    deleteAccount(emailConfirmation: $emailConfirmation)
  }
`

/**
 * Change the signed-in user's password. Server verifies the current password
 * then sets the new one and bumps the user's tokenVersion so other sessions
 * are invalidated. Resolves a boolean (true on success).
 */
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`
