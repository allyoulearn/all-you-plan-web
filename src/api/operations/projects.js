import { gql } from '@apollo/client/core'

export const PROJECTS_QUERY = gql`
  query Projects($includeArchived: Boolean) {
    projects(includeArchived: $includeArchived) {
      id
      name
      tag
      status
      blurb
      nudge
      startedOn
      targetOn
      order
      archived
      progress {
        done
        total
        percent
      }
    }
  }
`

export const PROJECT_BOARD_QUERY = gql`
  query ProjectBoard($id: ID!) {
    projectBoard(id: $id) {
      project {
        id
        name
        tag
        status
        blurb
        nudge
        startedOn
        targetOn
        order
        archived
        progress {
          done
          total
          percent
        }
      }
      backlog {
        id
        title
        note
        tag
        done
        column
        order
      }
      thisWeek {
        id
        title
        note
        tag
        done
        column
        order
      }
      doing {
        id
        title
        note
        tag
        done
        column
        order
      }
      done {
        id
        title
        note
        tag
        done
        column
        order
      }
    }
  }
`

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      column
    }
  }
`

export const COMPLETE_PROJECT_TASK = gql`
  mutation CompleteTask($id: ID!) {
    completeTask(id: $id) {
      id
      done
      completedAt
    }
  }
`
