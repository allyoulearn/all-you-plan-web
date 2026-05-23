/**
 * Projects store.
 * Manages the list of projects and the active project board. Exposes actions
 * to load all projects, load a specific project's board, and complete
 * individual board tasks.
 *
 * Error-surfacing policy: load errors set their respective error ref for
 * inline display; mutation errors additionally toast via useErrorToast.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo.js'
import {
  PROJECTS_QUERY,
  PROJECT_BOARD_QUERY,
  COMPLETE_PROJECT_TASK,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  CREATE_TASK
} from '@/api/operations/index.js'
import { useErrorToast } from '@/composables/useErrorToast.js'

export const useProjectsStore = defineStore('projects', () => {
  // -- State --
  const projects = ref([])
  const board = ref(null)
  const loadingProjects = ref(false)
  const loadingBoard = ref(false)
  const errorProjects = ref('')
  const errorBoard = ref('')

  // -- Actions --

  /**
   * Fetch all active (non-archived) projects from the API and replace the
   * local list.
   */
  async function loadProjects() {
    loadingProjects.value = true
    errorProjects.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECTS_QUERY,
        variables: { includeArchived: false },
        fetchPolicy: 'network-only'
      })
      projects.value = data.projects
    } catch (e) {
      errorProjects.value = e.message
    } finally {
      loadingProjects.value = false
    }
  }

  /**
   * Fetch the Kanban board for the given project and store it locally.
   * @param {string} id - The project ID whose board to load
   */
  async function loadBoard(id) {
    loadingBoard.value = true
    errorBoard.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECT_BOARD_QUERY,
        variables: { id },
        fetchPolicy: 'network-only'
      })
      board.value = data.projectBoard
    } catch (e) {
      errorBoard.value = e.message
    } finally {
      loadingBoard.value = false
    }
  }

  /**
   * Mark a project task as complete, then refresh the active board.
   * @param {string} id - The task ID to complete
   * @throws Re-throws the API error after surfacing it via errorBoard + toast.
   */
  async function completeTask(id) {
    const { toastError } = useErrorToast()
    try {
      await apolloClient.mutate({ mutation: COMPLETE_PROJECT_TASK, variables: { id } })
      if (board.value?.project?.id) {
        await loadBoard(board.value.project.id)
      }
    } catch (e) {
      errorBoard.value = e.message
      toastError(e, 'Failed to complete task')
      throw e
    }
  }

  /**
   * Create a new project, then refresh the projects list.
   * @param {{ name: string, tag?: string, blurb?: string }} input
   * @returns {Promise<object>} Created project
   */
  async function createProject(input) {
    const { toastError } = useErrorToast()
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_PROJECT,
        variables: { name: input.name, tag: input.tag ?? null, blurb: input.blurb ?? null }
      })
      await loadProjects()
      return data.createProject
    } catch (e) {
      errorProjects.value = e.message
      toastError(e, 'Failed to create project')
      throw e
    }
  }

  /**
   * Update a project's fields; if a board is currently loaded for the same
   * project, refresh it; otherwise refresh the project list.
   * @param {string} id - Project ID
   * @param {object} input - Fields to update
   */
  async function updateProject(id, input) {
    const { toastError } = useErrorToast()
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROJECT,
        variables: { id, ...input }
      })
      if (board.value?.project?.id === id) {
        await loadBoard(id)
      }
      await loadProjects()
      return data.updateProject
    } catch (e) {
      errorBoard.value = e.message
      toastError(e, 'Failed to update project')
      throw e
    }
  }

  /**
   * Archive (soft-delete) a project — sets archived:true, then refreshes lists.
   * @param {string} id
   */
  async function archiveProject(id) {
    return updateProject(id, { archived: true })
  }

  /**
   * Permanently delete a project (cascades tasks server-side).
   * @param {string} id
   */
  async function deleteProject(id) {
    const { toastError } = useErrorToast()
    try {
      await apolloClient.mutate({ mutation: DELETE_PROJECT, variables: { id } })
      if (board.value?.project?.id === id) {
        board.value = null
      }
      await loadProjects()
    } catch (e) {
      errorProjects.value = e.message
      toastError(e, 'Failed to delete project')
      throw e
    }
  }

  /**
   * Create a new task under a project (defaults to the backlog column).
   * Only fields with real values are sent — the server's zod schema rejects
   * `null` for optional fields, so omitting them is the safe shape.
   * @param {{ title: string, projectId: string, note?: string, column?: string, tag?: string, scheduledDate?: string }} input
   */
  async function createTask(input) {
    const { toastError } = useErrorToast()
    const taskInput = {
      title: input.title,
      projectId: input.projectId,
      column: input.column ?? 'backlog'
    }
    if (input.note) taskInput.note = input.note
    if (input.tag) taskInput.tag = input.tag
    if (input.scheduledDate) taskInput.scheduledDate = input.scheduledDate
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_TASK,
        variables: { input: taskInput }
      })
      if (board.value?.project?.id === input.projectId) {
        await loadBoard(input.projectId)
      }
      return data.createTask
    } catch (e) {
      errorBoard.value = e.message
      toastError(e, 'Failed to create task')
      throw e
    }
  }

  return {
    projects,
    board,
    loadingProjects,
    loadingBoard,
    errorProjects,
    errorBoard,
    loadProjects,
    loadBoard,
    completeTask,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    createTask
  }
})
