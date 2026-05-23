<template>
  <Modal
    :model-value="modelValue"
    :title="t('projects.createTitle')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="create-project-modal__form" @submit.prevent="handleSubmit">
      <TextField
        v-model="name"
        :label="t('projects.nameLabel')"
        :placeholder="t('projects.namePlaceholder')"
        :invalid="submitted && !name.trim()"
      />

      <TextField
        v-model="tag"
        :label="t('projects.tagLabel')"
        :placeholder="t('projects.tagPlaceholder')"
      />

      <label class="create-project-modal__field">
        <span class="create-project-modal__label">
          {{ t('projects.blurbLabel') }}
        </span>

        <textarea
          v-model="blurb"
          rows="3"
          :placeholder="t('projects.blurbPlaceholder')"
          class="create-project-modal__textarea"
        />
      </label>
    </form>

    <template #footer>
      <Button variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </Button>

      <Button
        variant="primary"
        :disabled="saving || !name.trim()"
        @click="handleSubmit"
      >
        {{ saving ? t('projects.creating') : t('projects.create') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/** CreateProjectModal — form to create a new project. */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects.store.js'
import Modal from '@/components/ui/Modal.vue'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'

export default {
  name: 'CreateProjectModal',
  components: { Modal, TextField, Button },
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'created'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useProjectsStore()

    const name = ref('')
    const tag = ref('')
    const blurb = ref('')
    const submitted = ref(false)
    const saving = ref(false)

    function reset() {
      name.value = ''
      tag.value = ''
      blurb.value = ''
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
      if (!name.value.trim() || saving.value) return
      saving.value = true
      try {
        const created = await store.createProject({
          name: name.value.trim(),
          tag: tag.value.trim() || undefined,
          blurb: blurb.value.trim() || undefined
        })
        emit('created', created)
        emit('update:modelValue', false)
      } catch {
        // Error already toasted by the store
      } finally {
        saving.value = false
      }
    }

    return { t, name, tag, blurb, submitted, saving, cancel, handleSubmit }
  }
}
</script>

<style lang="scss" scoped>
.create-project-modal {
  &__form {
    @apply flex flex-col gap-3.5;
  }

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__textarea {
    @apply min-h-[80px] rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted focus:border-muted;
  }
}
</style>
