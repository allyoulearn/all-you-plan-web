<template>
  <div class="dashboard-view">
    <h1 class="text-2xl font-bold text-primary-400">{{ t('dashboard.title') }}</h1>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'DashboardView',
  setup() {
    const { t } = useI18n()
    return { t }
  },
}
</script>
