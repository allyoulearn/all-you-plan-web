<template>
  <div class="sendoff-card">
    <WrenTurn :prompt="prose.headline">
      <p class="sendoff-card__body">{{ prose.body }}</p>

      <div class="sendoff-card__action">
        <AppButton
          v-if="!saved"
          variant="primary"
          :disabled="disabled || saving"
          @click="$emit('finish')"
        >
          {{ saving ? t('review.saving') : t('review.finishReview') }}
        </AppButton>

        <template v-else>
          <p class="sendoff-card__saved">{{ t('review.reviewSaved') }}</p>
          <AppButton variant="ghost" size="sm" @click="$emit('edit')">
            {{ t('review.edit') }}
          </AppButton>
        </template>
      </div>
    </WrenTurn>
  </div>
</template>

<script>
/** SendoffCard — Wren-turn that renders the dynamically composed send-off. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WrenTurn from '@/components/review/WrenTurn.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { composeSendoff } from '@/components/review/sendoffComposer.js'

export default {
  name: 'SendoffCard',
  components: { WrenTurn, AppButton },
  props: {
    input: { type: Object, required: true },
    saving: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    saved: { type: Boolean, default: false }
  },
  emits: ['finish', 'edit'],
  setup(props) {
    const { t } = useI18n()
    const prose = computed(() => composeSendoff(props.input))
    return { t, prose }
  }
}
</script>

<style lang="scss" scoped>
// SendoffCard reinstates card chrome on top of WrenTurn — the conversation's
// closer earns the visual weight that the section prompts don't.
.sendoff-card {
  @apply rounded-md bg-accent p-5 text-accent-ink shadow-accent-glow;

  // Override WrenTurn's defaults so prompt/mark/callout sit on the accent.
  :deep(.wren-turn) {
    @apply mb-0;
  }

  :deep(.wren-turn__prompt) {
    @apply text-accent-ink;
  }

  :deep(.wren-turn__mark) {
    @apply text-accent-ink opacity-90;
  }

  :deep(.wren-turn__callout) {
    @apply text-accent-ink opacity-80;
  }

  &__body {
    @apply mt-2 text-[14px] leading-relaxed text-accent-ink;
  }

  &__action {
    @apply mt-4 flex items-center gap-3;
  }

  &__saved {
    @apply font-mono text-[11px] text-accent-ink opacity-80;
  }
}
</style>
