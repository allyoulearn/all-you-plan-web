<template>
  <div class="briefing-view">
    <h1 class="text-2xl font-bold text-primary-400">{{ t('briefing.title') }}</h1>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'BriefingView',
  setup() {
    const { t } = useI18n()
    return { t }
  },
}
</script>
