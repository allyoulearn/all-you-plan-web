/**
 * GraphQL operations for the unified Tasks workspace.
 *
 * Query: TASK_WORKSPACE_QUERY (the whole "plate" — every open task plus a
 * summary count block; optionally includes recently-done tasks).
 *
 * Mutations: the workspace shares the canonical task resolvers
 * (`createTask` / `updateTask` / `completeTask` / `deleteTask`) with the
 * Today and Projects surfaces. Those root fields are already exported as
 * CREATE_TASK / COMPLETE_TASK (today.js) and UPDATE_TASK / DELETE_TASK
 * (projects.js). To avoid duplicate barrel exports while still giving the
 * tasks store a self-contained set of documents, this module re-declares the
 * same operations under workspace-scoped names whose selection sets return
 * the richer Task fields the workspace reads (urgency/category/kind/due).
 * The mock link and the API both key off the GraphQL root field name, so the
 * JS export name is irrelevant to resolution.
 */
import { gql } from '@apollo/client/core'

/**
 * The full Tasks workspace payload: the flat task list (grouped/filtered
 * client-side) plus the summary counters that drive the urgency strip.
 * `includeDone` adds recently-completed tasks so the "Show done" toggle can
 * reveal them without a second query shape.
 */
export const TASK_WORKSPACE_QUERY = gql`
  query TaskWorkspace($includeDone: Boolean) {
    taskWorkspace(includeDone: $includeDone) {
      tasks {
        id
        title
        note
        urgency
        category
        kind
        dueDate
        due {
          label
          daysLeft
        }
        done
        tag
        priority
        order
        projectId
        project {
          id
          name
        }
      }
      summary {
        total
        overdue
        dated
        critical
        high
        doneRecently
      }
    }
  }
`

/**
 * Create a task from the workspace composer. Uses the shared CreateTaskInput
 * (title, note, category, urgency, kind, dueDate, projectId, tag). Returns
 * the id only — the store reloads the workspace after the mutation so the
 * grouped lists and summary stay authoritative.
 */
export const CREATE_WORKSPACE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
    }
  }
`

/** Update a task's workspace fields via the shared UpdateTaskInput. */
export const UPDATE_WORKSPACE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
    }
  }
`

/** Toggle a task's done state. Mirrors the Today/Projects completeTask. */
export const COMPLETE_WORKSPACE_TASK = gql`
  mutation CompleteTask($id: ID!) {
    completeTask(id: $id) {
      id
      done
    }
  }
`

/** Permanently delete a task. */
export const DELETE_WORKSPACE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`
