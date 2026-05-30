/** GraphQL operations for the Goals top-level tab. */
import { gql } from '@apollo/client/core'

const GOAL_FIELDS = gql`
  fragment GoalFields on Goal {
    id
    title
    why
    targetDate
    status
    archived
    progress
    linkedProjects {
      id
      name
      progress
      kind
    }
    linkedChores {
      id
      name
      progress
      kind
    }
    createdAt
    updatedAt
  }
`

export const GOALS_QUERY = gql`
  ${GOAL_FIELDS}
  query Goals {
    goals {
      ...GoalFields
    }
  }
`

export const GOAL_QUERY = gql`
  ${GOAL_FIELDS}
  query Goal($id: ID!) {
    goal(id: $id) {
      ...GoalFields
    }
  }
`

export const CREATE_GOAL = gql`
  ${GOAL_FIELDS}
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) {
      ...GoalFields
    }
  }
`

export const UPDATE_GOAL = gql`
  ${GOAL_FIELDS}
  mutation UpdateGoal($id: ID!, $input: UpdateGoalInput!) {
    updateGoal(id: $id, input: $input) {
      ...GoalFields
    }
  }
`

export const ARCHIVE_GOAL = gql`
  mutation ArchiveGoal($id: ID!) {
    archiveGoal(id: $id)
  }
`
