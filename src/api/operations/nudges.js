import gql from 'graphql-tag'

export const NUDGE_FRAGMENT = gql`
  fragment NudgeFields on Nudge {
    id
    taskId
    type
    message
    read
    createdAt
  }
`

export const GET_NUDGES = gql`
  ${NUDGE_FRAGMENT}
  query GetNudges($unreadOnly: Boolean) {
    nudges(unreadOnly: $unreadOnly) {
      ...NudgeFields
    }
  }
`

export const MARK_NUDGE_READ = gql`
  ${NUDGE_FRAGMENT}
  mutation MarkNudgeRead($id: ID!) {
    markNudgeRead(id: $id) {
      ...NudgeFields
    }
  }
`

export const MARK_ALL_NUDGES_READ = gql`
  mutation MarkAllNudgesRead {
    markAllNudgesRead
  }
`

export const NUDGE_CREATED_SUBSCRIPTION = gql`
  ${NUDGE_FRAGMENT}
  subscription NudgeCreated($userId: ID!) {
    nudgeCreated(userId: $userId) {
      ...NudgeFields
    }
  }
`
