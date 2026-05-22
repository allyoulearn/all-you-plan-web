<template>
  <aside class="flex h-screen flex-col overflow-hidden border-r border-rule-soft bg-paper">
    <div class="flex items-baseline gap-2 px-[22px] pb-[18px] pt-[22px]">
      <span class="font-serif text-[26px] italic leading-none tracking-[-0.01em] text-ink">
        all you <em>
          plan
        </em>
      </span>
    </div>

    <nav class="flex-1 overflow-y-auto py-2">
      <div v-for="group in navGroups" :key="group.label">
        <p class="px-5 pb-1.5 pt-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {{ group.label }}
        </p>

        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="mx-2.5 my-px flex items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] text-ink transition-colors hover:bg-paper-3"
          active-class="!bg-ink !text-paper font-medium"
        >
          <Icon :name="item.icon" :size="16" />

          <span>
            {{ item.label }}
          </span>

          <span class="ml-auto font-mono text-[10px] text-muted">
            {{ item.key }}
          </span>
        </RouterLink>
      </div>
    </nav>

    <div class="flex items-center gap-2.5 border-t border-rule-soft px-[22px] py-3.5 text-[13px]">
      <span class="grid h-8 w-8 place-items-center rounded-pill bg-accent text-[13px] font-semibold text-accent-ink">
        {{ (auth.userName || 'U').charAt(0).toUpperCase() }}
      </span>

      <span class="text-ink">
        {{ auth.userName || 'You' }}
      </span>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import { navGroups } from './navConfig.js'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
</script>
