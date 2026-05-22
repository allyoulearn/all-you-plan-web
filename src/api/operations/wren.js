import { gql } from '@apollo/client/core'

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
