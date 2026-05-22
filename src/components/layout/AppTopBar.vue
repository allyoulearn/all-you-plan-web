<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import { useTheme } from '@/composables/useTheme.js'

const route = useRoute()
const { mode, toggleMode } = useTheme()

const crumbs = computed(() => (route.meta.crumbs || ['all you plan']).join(' · '))
const today = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
)
</script>

<template>
  <header class="sticky top-0 z-10 flex items-center gap-3.5 bg-paper px-8 py-4">
    <span class="text-[13px] text-muted">{{ crumbs }}</span>
    <span class="flex-1" />
    <span class="text-[13px] text-muted">{{ today }}</span>
    <IconButton icon="search" :size="34" aria-label="Search" />
    <IconButton icon="plus" :size="34" aria-label="Add" />
    <IconButton :icon="mode === 'dark' ? 'sun' : 'moon'" :size="34" aria-label="Toggle dark mode" @click="toggleMode" />
  </header>
</template>
