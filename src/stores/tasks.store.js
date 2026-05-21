import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apolloClient } from '@/api/apollo'
import {
  GET_TASKS,
  GET_EISENHOWER_MATRIX,
  CREATE_TASK,
  UPDATE_TASK,
  COMPLETE_TASK,
  DELETE_TASK,
  SNOOZE_TASK,
  COMPLETE_SUBTASK,
  ADD_SUBTASK,
} from '@/api/operations'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const matrix = ref({ do: [], schedule: [], delegate: [], drop: [] })
  const loading = ref(false)

  async function fetchTasks(filters = {}) {
    loading.value = true
    try {
      const { data } = await apolloClient.query({
        query: GET_TASKS,
        variables: filters,
        fetchPolicy: 'network-only',
      })
      tasks.value = data.tasks
    } finally {
      loading.value = false
    }
  }

  async function fetchMatrix() {
    loading.value = true
    try {
      const { data } = await apolloClient.query({
        query: GET_EISENHOWER_MATRIX,
        fetchPolicy: 'network-only',
      })
      matrix.value = data.eisenhowerMatrix
    } finally {
      loading.value = false
    }
  }

  async function createTask(input) {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_TASK,
      variables: input,
    })
    tasks.value.push(data.createTask)
    return data.createTask
  }

  async function updateTask(id, updates) {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_TASK,
      variables: { id, ...updates },
    })
    _replaceTask(data.updateTask)
    return data.updateTask
  }

  async function completeTask(id) {
    const { data } = await apolloClient.mutate({
      mutation: COMPLETE_TASK,
      variables: { id },
    })
    const { completed, nextInstance } = data.completeTask
    _replaceTask(completed)
    if (nextInstance) {
      tasks.value.push(nextInstance)
    }
    return data.completeTask
  }

  async function deleteTask(id) {
    await apolloClient.mutate({
      mutation: DELETE_TASK,
      variables: { id },
    })
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  async function snoozeTask(id, until) {
    const { data } = await apolloClient.mutate({
      mutation: SNOOZE_TASK,
      variables: { id, until },
    })
    _replaceTask(data.snoozeTask)
    return data.snoozeTask
  }

  async function completeSubtask(taskId, subtaskId, completed) {
    const { data } = await apolloClient.mutate({
      mutation: COMPLETE_SUBTASK,
      variables: { taskId, subtaskId, completed },
    })
    _replaceTask(data.completeSubtask)
    return data.completeSubtask
  }

  async function addSubtask(taskId, title) {
    const { data } = await apolloClient.mutate({
      mutation: ADD_SUBTASK,
      variables: { taskId, title },
    })
    _replaceTask(data.addSubtask)
    return data.addSubtask
  }

  function _replaceTask(updated) {
    const index = tasks.value.findIndex(t => t.id === updated.id)
    if (index !== -1) {
      tasks.value[index] = updated
    }
  }

  return {
    tasks,
    matrix,
    loading,
    fetchTasks,
    fetchMatrix,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    snoozeTask,
    completeSubtask,
    addSubtask,
  }
})
