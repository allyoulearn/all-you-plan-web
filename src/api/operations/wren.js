/**
 * GraphQL operations for the Wren AI coaching conversation.
 *
 * Queries: WREN_MESSAGES_QUERY (full history).
 * Mutations: SEND_WREN_MESSAGE (user → Wren). The mutation returns the coach
 * reply, which the store appends after the optimistic user message
 * (WEB-W1-12).
 */
import { gql } from '@apollo/client/core'

/** Fetch the full Wren message history (chronological). */
export const WREN_MESSAGES_QUERY = gql`
  query WrenMessages {
    wrenMessages {
      id
      sender
      text
      actions
      createdAt
    }
  }
`

/** Send a user message and receive the coach reply in one round-trip. */
export const SEND_WREN_MESSAGE = gql`
  mutation SendWrenMessage($text: String!) {
    sendWrenMessage(text: $text) {
      id
      sender
      text
      actions
      createdAt
    }
  }
`
