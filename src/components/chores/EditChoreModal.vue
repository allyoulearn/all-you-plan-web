<template>
  <AppModal
    :model-value="modelValue"
    :title="t('chores.editTitle')"
    :close-on-backdrop="!saving"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <ChoreForm v-if="form" v-model="form" :submitted="submitted" @valid="formValid = $event" />

    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>
      <AppButton variant="primary" :disabled="saving || !formValid" @click="handleSubmit">
        {{ saving ? t('chores.saving') : t('chores.save') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/** EditChoreModal — wraps the shared ChoreForm with the edit-flow chrome. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChoresStore } from '@/stores/chores.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ChoreForm from './ChoreForm.vue'

function fromChore(chore) {
  if (!chore) return null
  return {
    title: chore.title,
    cadence: {
      type: chore.cadence.type,
      daysOfWeek: chore.cadence.daysOfWeek ?? [],
      interval: chore.cadence.interval ?? 1,
      dayOfMonth: chore.cadence.dayOfMonth ?? null
    },
    active: chore.active
  }
}

export default {
  name: 'EditChoreModal',
  components: { AppModal, AppButton, ChoreForm },
  props: {
    modelValue: { type: Boolean, default: false },
    chore: { type: Object, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useChoresStore()
    const form = ref(fromChore(props.chore))
    const submitted = ref(false)
    const saving = ref(false)
    const formValid = ref(true)

    watch(
      () => [props.modelValue, props.chore],
      ([open]) => {
        if (open) {
          form.value = fromChore(props.chore)
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
      if (!formValid.value || saving.value || !props.chore) return
      saving.value = true
      try {
        await store.updateChore(props.chore.id, {
          title: form.value.title.trim(),
          cadence: buildCadence(form.value.cadence),
          active: form.value.active
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
