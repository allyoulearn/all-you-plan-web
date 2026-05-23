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

// Re-export COMPLETE_TASK from today.js as COMPLETE_PROJECT_TASK so both stores
// share the same document node, keeping the Apollo cache coherent (WEB-T05-015).
export { COMPLETE_TASK as COMPLETE_PROJECT_TASK } from './today.js'

export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $tag: String, $blurb: String) {
    createProject(name: $name, tag: $tag, blurb: $blurb) {
      id
      name
      tag
      status
      blurb
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

export const UPDATE_PROJECT = gql`
  mutation UpdateProject(
    $id: ID!
    $name: String
    $tag: String
    $status: ProjectStatus
    $blurb: String
    $nudge: String
    $startedOn: String
    $targetOn: String
    $archived: Boolean
  ) {
    updateProject(
      id: $id
      name: $name
      tag: $tag
      status: $status
      blurb: $blurb
      nudge: $nudge
      startedOn: $startedOn
      targetOn: $targetOn
      archived: $archived
    ) {
      id
      name
      tag
      status
      blurb
      nudge
      startedOn
      targetOn
      archived
    }
  }
`

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`
