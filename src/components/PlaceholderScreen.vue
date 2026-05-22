<template>
  <div>
    <ScreenHeading :eyebrow="eyebrow" :title="title" :emphasis="emphasis" />

    <Card>
      <p class="placeholder-screen__note">
        {{ note }}
      </p>
    </Card>
  </div>
</template>

<script>
/** PlaceholderScreen — stub screen layout used while a full view is not yet implemented. */
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import Card from '@/components/ui/Card.vue'

export default {
  name: 'PlaceholderScreen',
  components: { ScreenHeading, Card },
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
