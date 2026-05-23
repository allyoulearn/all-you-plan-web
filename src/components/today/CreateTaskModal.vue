<template>
  <Modal
    :model-value="modelValue"
    :title="t('tasks.createTitle')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="create-task-modal__form" @submit.prevent="handleSubmit">
      <TextField
        v-model="title"
        :label="t('tasks.title')"
        :placeholder="t('tasks.titlePlaceholder')"
        :invalid="submitted && !title.trim()"
      />

      <TextField
        v-model="scheduledTime"
        type="time"
        :label="t('tasks.timeLabel')"
      />

      <TextField
        v-model="tag"
        :label="t('tasks.tagLabel')"
        :placeholder="t('tasks.tagPlaceholder')"
      />

      <TextField
        v-model="effortMinutes"
        type="number"
        :label="t('tasks.effort')"
        :placeholder="t('tasks.effortPlaceholder')"
      />
    </form>

    <template #footer>
      <Button variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </Button>

      <Button
        variant="primary"
        :disabled="saving || !title.trim()"
        @click="handleSubmit"
      >
        {{ saving ? t('tasks.creating') : t('tasks.create') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/** CreateTaskModal — form to create a new task for the today view. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTodayStore } from '@/stores/today.store.js'
import Modal from '@/components/ui/Modal.vue'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

export default {
  name: 'CreateTaskModal',
  components: { Modal, TextField, Button },
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useTodayStore()

    const title = ref('')
    const scheduledTime = ref('')
    const tag = ref('')
    const effortMinutes = ref('')
    const submitted = ref(false)
    const saving = ref(false)

    function reset() {
      title.value = ''
      scheduledTime.value = ''
      tag.value = ''
      effortMinutes.value = ''
      submitted.value = false
      saving.value = false
    }

    watch(
      () => props.modelValue,
      open => {
        if (open) reset()
      }
    )

    function cancel() {
      emit('update:modelValue', false)
    }

    async function handleSubmit() {
      submitted.value = true
      if (!title.value.trim() || saving.value) return
      saving.value = true
      try {
        await store.createTask({
          title: title.value.trim(),
          scheduledTime: scheduledTime.value || undefined,
          tag: tag.value.trim() || undefined,
          effortMinutes: effortMinutes.value ? Number(effortMinutes.value) : undefined
        })
        emit('update:modelValue', false)
      } catch {
        // Error already toasted by the store
      } finally {
        saving.value = false
      }
    }

    return { t, title, scheduledTime, tag, effortMinutes, submitted, saving, cancel, handleSubmit }
  }
}
</script>

<style lang="scss" scoped>
.create-task-modal {
  &__form {
    @apply flex flex-col gap-3.5;
  }
}
</style>
