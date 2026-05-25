/**
 * GraphQL operations for the Wren AI coaching conversation.
 *
 * Queries / Mutations / Subscription for the new agent surface.
 * See docs/superpowers/specs/2026-05-23-wren-llm-integration-design.md
 */
import { gql } from '@apollo/client/core'

const APPLIED_ACTION_FIELDS = gql`
  fragment AppliedActionFields on WrenAppliedAction {
    kind
    summary
    refType
    refId
    undoToken
    undoExpiresAt
  }
`

const WREN_MESSAGE_FIELDS = gql`
  fragment WrenMessageFields on WrenMessage {
    id
    sender
    text
    status
    actions {
      __typename
      ... on WrenSuggestedAction {
        label
      }
      ... on WrenAppliedAction {
        ...AppliedActionFields
      }
      ... on WrenUpgradeAction {
        kind
        summary
        planId
      }
    }
    createdAt
  }
  ${APPLIED_ACTION_FIELDS}
`

export const WREN_MESSAGES_QUERY = gql`
  query WrenMessages {
    wrenMessages {
      ...WrenMessageFields
    }
  }
  ${WREN_MESSAGE_FIELDS}
`

export const WREN_CONVERSATION_QUERY = gql`
  query WrenConversation {
    wrenConversation {
      id
    }
  }
`

export const SEND_WREN_MESSAGE = gql`
  mutation SendWrenMessage($text: String!) {
    sendWrenMessage(text: $text) {
      ...WrenMessageFields
    }
  }
  ${WREN_MESSAGE_FIELDS}
`

export const WREN_SETTINGS_QUERY = gql`
  query WrenSettings {
    wrenSettings {
      displayName
      tone
      enabled
      dailyTurnCap
    }
  }
`

export const UPDATE_WREN_SETTINGS = gql`
  mutation UpdateWrenSettings(
    $displayName: String
    $tone: WrenTone
    $enabled: Boolean
    $dailyTurnCap: Int
  ) {
    updateWrenSettings(
      displayName: $displayName
      tone: $tone
      enabled: $enabled
      dailyTurnCap: $dailyTurnCap
    ) {
      displayName
      tone
      enabled
      dailyTurnCap
    }
  }
`

export const WREN_MEMORY_NOTES_QUERY = gql`
  query WrenMemoryNotes {
    wrenMemoryNotes {
      id
      text
      tags
      updatedAt
    }
  }
`

export const EXPORT_WREN_CONVERSATION = gql`
  query ExportWrenConversation($format: WrenExportFormat!) {
    exportWrenConversation(format: $format) {
      format
      filename
      content
    }
  }
`

export const UNDO_WREN_ACTION = gql`
  mutation UndoWrenAction($undoToken: String!) {
    undoWrenAction(undoToken: $undoToken)
  }
`

export const CONFIRM_WREN_ACTION = gql`
  mutation ConfirmWrenAction($confirmToken: String!) {
    confirmWrenAction(confirmToken: $confirmToken) {
      ...AppliedActionFields
    }
  }
  ${APPLIED_ACTION_FIELDS}
`

export const CANCEL_WREN_ACTION = gql`
  mutation CancelWrenAction($confirmToken: String!) {
    cancelWrenAction(confirmToken: $confirmToken)
  }
`

export const WREN_STREAM_SUBSCRIPTION = gql`
  subscription WrenStream($conversationId: ID!) {
    wrenStream(conversationId: $conversationId) {
      __typename
      ... on WrenTokenDelta {
        messageId
        text
      }
      ... on WrenActionStarted {
        messageId
        tempId
        kind
        summary
      }
      ... on WrenActionEvent {
        messageId
        tempId
        action {
          ...AppliedActionFields
        }
      }
      ... on WrenPendingConfirmationEvent {
        messageId
        confirmToken
        tool
        summary
        refType
        refId
        expiresAt
      }
      ... on WrenConfirmationResolvedEvent {
        messageId
        confirmToken
        resolution
        action {
          ...AppliedActionFields
        }
      }
      ... on WrenComplete {
        message {
          ...WrenMessageFields
        }
      }
      ... on WrenError {
        messageId
        code
        errorMessage
      }
    }
  }
  ${APPLIED_ACTION_FIELDS}
  ${WREN_MESSAGE_FIELDS}
`
