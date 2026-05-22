/**
 * Projects store.
 * Manages the list of projects and the active project board. Exposes actions
 * to load all projects, load a specific project's board, and complete
 * individual board tasks.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { PROJECTS_QUERY, PROJECT_BOARD_QUERY, COMPLETE_PROJECT_TASK } from '@/api/operations'

export const useProjectsStore = defineStore('projects', () => {
  // -- State --
  const projects = ref([])
  const board = ref(null)
  const loading = ref(false)
  const error = ref('')

  // -- Actions --

  /**
   * Fetch all active (non-archived) projects from the API and replace the
   * local list.
   */
  async function loadProjects() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECTS_QUERY,
        variables: { includeArchived: false },
        fetchPolicy: 'network-only'
      })
      projects.value = data.projects
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch the Kanban board for the given project and store it locally.
   * @param {string} id - The project ID whose board to load
   */
  async function loadBoard(id) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECT_BOARD_QUERY,
        variables: { id },
        fetchPolicy: 'network-only'
      })
      board.value = data.projectBoard
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a project task as complete, then refresh the active board.
   * @param {string} id - The task ID to complete
   */
  async function completeTask(id) {
    await apolloClient.mutate({ mutation: COMPLETE_PROJECT_TASK, variables: { id } })
    if (board.value?.project?.id) {
      await loadBoard(board.value.project.id)
    }
  }

  return { projects, board, loading, error, loadProjects, loadBoard, completeTask }
})
