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

/** Fetch a single project's Kanban board with dynamic columns and tasks-by-column. */
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
      columns {
        id
        label
        order
      }
      tasksByColumn {
        columnId
        tasks {
          id
          title
          note
          tag
          done
          columnId
          order
          priority
          scheduledDate
          scheduledTime
          effortMinutes
          subtasks {
            id
            text
            done
          }
        }
      }
    }
  }
`

/** Create a new column at the end of a project's board. */
export const CREATE_COLUMN = gql`
  mutation CreateColumn($projectId: ID!, $label: String!) {
    createColumn(projectId: $projectId, label: $label) {
      id
      label
      order
    }
  }
`

/** Rename a column. */
export const UPDATE_COLUMN = gql`
  mutation UpdateColumn($id: ID!, $label: String) {
    updateColumn(id: $id, label: $label) {
      id
      label
      order
    }
  }
`

/** Reorder all columns within a project by passing the full ordered id list. */
export const REORDER_COLUMNS = gql`
  mutation ReorderColumns($projectId: ID!, $columnIds: [ID!]!) {
    reorderColumns(projectId: $projectId, columnIds: $columnIds) {
      id
      order
    }
  }
`

/** Delete a column, either moving its tasks elsewhere or deleting them too. */
export const DELETE_COLUMN = gql`
  mutation DeleteColumn($id: ID!, $mode: DeleteColumnMode!, $moveToColumnId: ID) {
    deleteColumn(id: $id, mode: $mode, moveToColumnId: $moveToColumnId)
  }
`

/** Move a task to a different column (or different slot in the same column). */
export const MOVE_TASK = gql`
  mutation MoveTask($id: ID!, $columnId: ID!, $order: Int!) {
    moveTask(id: $id, columnId: $columnId, order: $order) {
      id
      columnId
      order
    }
  }
`

/** Reorder tasks inside a column by passing the full ordered id list. */
export const REORDER_TASKS_IN_COLUMN = gql`
  mutation ReorderTasksInColumn($columnId: ID!, $taskIds: [ID!]!) {
    reorderTasksInColumn(columnId: $columnId, taskIds: $taskIds) {
      id
      order
    }
  }
`

/** Update a task. Returns every field the task detail modal reads so callers
 *  can rely on a single round trip after a save. */
export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      title
      note
      tag
      done
      columnId
      order
      priority
      scheduledDate
      scheduledTime
      effortMinutes
      subtasks {
        id
        text
        done
      }
    }
  }
`

/** Append a subtask checklist item to a task. */
export const ADD_SUBTASK = gql`
  mutation AddSubtask($taskId: ID!, $text: String!) {
    addSubtask(taskId: $taskId, text: $text) {
      id
      subtasks {
        id
        text
        done
      }
    }
  }
`

/** Update a subtask's text or completion state. */
export const UPDATE_SUBTASK = gql`
  mutation UpdateSubtask($taskId: ID!, $subtaskId: ID!, $text: String, $done: Boolean) {
    updateSubtask(taskId: $taskId, subtaskId: $subtaskId, text: $text, done: $done) {
      id
      subtasks {
        id
        text
        done
      }
    }
  }
`

/** Remove a subtask from its parent task. */
export const DELETE_SUBTASK = gql`
  mutation DeleteSubtask($taskId: ID!, $subtaskId: ID!) {
    deleteSubtask(taskId: $taskId, subtaskId: $subtaskId) {
      id
      subtasks {
        id
        text
        done
      }
    }
  }
`

/** Permanently delete a task. */
export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
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
