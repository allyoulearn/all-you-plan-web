<template>
  <div>
    <!-- Screen heading -->
    <AppScreenHeading :eyebrow="eyebrow" :title="title" :emphasis="emphasis" />

    <!-- Note card -->
    <AppCard>
      <p class="placeholder-screen__note">
        {{ note }}
      </p>
    </AppCard>
  </div>
</template>

<script>
/** PlaceholderScreen — stub screen layout used while a full view is not yet implemented. */
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppCard from '@/components/ui/AppCard.vue'

export default {
  name: 'PlaceholderScreen',
  components: { AppScreenHeading, AppCard },
  props: {
    /** Optional eyebrow label shown above the title */
    eyebrow: { type: String, default: '' },
    /** Main screen title */
    title: { type: String, default: '' },
    /** Italic emphasis word appended to the title */
    emphasis: { type: String, default: '' },
    /** Body note text displayed inside the card */
    note: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.placeholder-screen {
  &__note {
    @apply text-[15px] text-ink-2;
  }
}
</style>
