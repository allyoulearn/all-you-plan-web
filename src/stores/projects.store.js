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
  COMPLETE_PROJECT_TASK
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
    completeTask
  }
})
