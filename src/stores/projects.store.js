import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import { PROJECTS_QUERY, PROJECT_BOARD_QUERY, COMPLETE_PROJECT_TASK } from '@/api/operations'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref([])
  const board = ref(null)
  const loading = ref(false)
  const error = ref('')

  async function loadProjects() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECTS_QUERY,
        variables: { includeArchived: false },
        fetchPolicy: 'network-only',
      })
      projects.value = data.projects
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadBoard(id) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await apolloClient.query({
        query: PROJECT_BOARD_QUERY,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      board.value = data.projectBoard
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function completeTask(id) {
    await apolloClient.mutate({ mutation: COMPLETE_PROJECT_TASK, variables: { id } })
    if (board.value?.project?.id) {
      await loadBoard(board.value.project.id)
    }
  }

  return { projects, board, loading, error, loadProjects, loadBoard, completeTask }
})
