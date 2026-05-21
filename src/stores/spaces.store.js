import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apolloClient } from '@/api/apollo'
import {
  GET_SPACES,
  GET_SPACE,
  CREATE_SPACE,
  UPDATE_SPACE,
  ARCHIVE_SPACE,
} from '@/api/operations'

export const useSpacesStore = defineStore('spaces', () => {
  const spaces = ref([])
  const loading = ref(false)

  const activeSpaces = computed(() => spaces.value.filter(s => !s.archived))

  async function fetchSpaces() {
    loading.value = true
    try {
      const { data } = await apolloClient.query({
        query: GET_SPACES,
        fetchPolicy: 'network-only',
      })
      spaces.value = data.spaces
    } finally {
      loading.value = false
    }
  }

  async function fetchSpace(id) {
    const { data } = await apolloClient.query({
      query: GET_SPACE,
      variables: { id },
    })
    return data.space
  }

  async function createSpace(input) {
    loading.value = true
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_SPACE,
        variables: input,
      })
      spaces.value.push(data.createSpace)
      return data.createSpace
    } finally {
      loading.value = false
    }
  }

  async function updateSpace(id, updates) {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_SPACE,
      variables: { id, ...updates },
    })
    const index = spaces.value.findIndex(s => s.id === id)
    if (index !== -1) {
      spaces.value[index] = data.updateSpace
    }
    return data.updateSpace
  }

  async function archiveSpace(id) {
    const { data } = await apolloClient.mutate({
      mutation: ARCHIVE_SPACE,
      variables: { id },
    })
    const index = spaces.value.findIndex(s => s.id === id)
    if (index !== -1) {
      spaces.value[index] = data.archiveSpace
    }
    return data.archiveSpace
  }

  return {
    spaces,
    loading,
    activeSpaces,
    fetchSpaces,
    fetchSpace,
    createSpace,
    updateSpace,
    archiveSpace,
  }
})
