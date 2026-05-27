<template>
  <AppModal
    :model-value="modelValue"
    :title="t('chores.createTitle')"
    :close-on-backdrop="!saving"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <ChoreForm
      v-model="form"
      :submitted="submitted"
      @valid="formValid = $event"
    />

    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="saving || !formValid" @click="handleSubmit">
        {{ saving ? t('chores.creating') : t('chores.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/** CreateChoreModal — wraps the shared ChoreForm with the create-flow chrome. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChoresStore } from '@/stores/chores.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ChoreForm from './ChoreForm.vue'

const DEFAULT_FORM = () => ({
  title: '',
  cadence: { type: 'daily', daysOfWeek: [], interval: 1, dayOfMonth: 1 },
  active: true
})

export default {
  name: 'CreateChoreModal',
  components: { AppModal, AppButton, ChoreForm },
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useChoresStore()
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

    function buildCadence(c) {
      if (c.type === 'weekly') return { type: 'weekly', daysOfWeek: c.daysOfWeek, interval: 1 }

      if (c.type === 'monthly') {
        return { type: 'monthly', daysOfWeek: [], interval: 1, dayOfMonth: c.dayOfMonth }
      }

      return { type: 'daily', daysOfWeek: [], interval: c.interval }
    }

    async function handleSubmit() {
      submitted.value = true
      if (!formValid.value || saving.value) return
      saving.value = true

      try {
        await store.createChore({
          title: form.value.title.trim(),
          cadence: buildCadence(form.value.cadence)
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
