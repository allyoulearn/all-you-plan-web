<template>
  <AppModal
    :model-value="modelValue"
    :close-on-backdrop="!saving"
    :aria-label="t('goals.createEyebrow')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="goal-modal__header">
        <span class="goal-modal__eyebrow">
          {{ t('goals.createEyebrow') }}
        </span>

        <h2 class="goal-modal__title">
          {{ t('goals.createPrompt') }}
        </h2>
      </div>
    </template>

    <GoalForm
      v-model="form"
      :submitted="submitted"
      @valid="formValid = $event"
    />

    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="saving" @click="handleSubmit">
        {{ saving ? t('goals.saving') : t('goals.saveCreate') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from '@/stores/goals.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import GoalForm from './GoalForm.vue'

const DEFAULT_FORM = () => ({ title: '', why: '', targetDate: '' })

export default {
  name: 'CreateGoalModal',
  components: { AppModal, AppButton, GoalForm },
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useGoalsStore()
    const form = ref(DEFAULT_FORM())
    const submitted = ref(false)
    const saving = ref(false)
    const formValid = ref(false)

    watch(
      () => props.modelValue,
      open => {
        if (open) {
          form.value = DEFAULT_FORM()
          submitted.value = false
          saving.value = false
        }
      }
    )

    return { t, form, submitted, saving, formValid, cancel, handleSubmit }

    function cancel() {
      emit('update:modelValue', false)
    }

    async function handleSubmit() {
      submitted.value = true
      if (!formValid.value || saving.value) return
      saving.value = true

      try {
        await store.create({
          title: form.value.title.trim(),
          why: form.value.why.trim(),
          targetDate: form.value.targetDate
        })

        emit('update:modelValue', false)
      } catch {
        // toasted by store
      } finally {
        saving.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.goal-modal {
  &__header {
    @apply flex flex-col gap-1.5;
  }

  &__eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  &__title {
    @apply font-serif font-normal text-ink;
    font-size: 28px;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }
}
</style>
