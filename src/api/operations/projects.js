/**
 * GraphQL operations for projects and project boards.
 *
 * Queries: PROJECTS_QUERY (list with progress), PROJECT_BOARD_QUERY
 * (board with backlog/thisWeek/doing/done columns).
 * Mutations: UPDATE_TASK (column move), CREATE_PROJECT, UPDATE_PROJECT,
 * DELETE_PROJECT. COMPLETE_PROJECT_TASK is re-exported from today.js so both
 * stores share one document node (WEB-W1-12, WEB-T05-015).
 */
import { gql } from '@apollo/client/core'

/** Fetch every project (optionally including archived). */
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

/** Fetch a single project's Kanban board with task columns. */
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

/** Update a task; primarily used to move it to a different Kanban column. */
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

/** Create a new project with required name and optional tag / blurb. */
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

/** Update any subset of a project's fields (including archived). */
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

/** Permanently delete a project (cascades tasks server-side). */
export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`
