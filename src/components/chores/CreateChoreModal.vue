<template>
  <Modal
    :model-value="modelValue"
    :title="t('chores.createTitle')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="create-chore-modal__form" @submit.prevent="handleSubmit">
      <TextField
        v-model="title"
        :label="t('tasks.title')"
        :placeholder="t('chores.titlePlaceholder')"
        :invalid="submitted && !title.trim()"
      />

      <label class="create-chore-modal__field">
        <span class="create-chore-modal__label">
          {{ t('chores.cadenceLabel') }}
        </span>

        <SegmentedControl
          v-model="cadenceType"
          :options="cadenceOptions"
          group-label="Cadence"
        />
      </label>

      <div v-if="cadenceType === 'weekly'" class="create-chore-modal__field">
        <span class="create-chore-modal__label">
          {{ t('chores.daysOfWeekLabel') }}
        </span>

        <div class="create-chore-modal__dow">
          <button
            v-for="(label, idx) in dayLabels"
            :key="idx"
            type="button"
            class="create-chore-modal__dow-btn"
            :class="daysOfWeek.includes(idx) ? 'create-chore-modal__dow-btn--active' : ''"
            :aria-pressed="daysOfWeek.includes(idx)"
            @click="toggleDay(idx)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <TextField
        v-if="cadenceType === 'daily'"
        v-model="interval"
        type="number"
        :label="t('chores.intervalLabel')"
        placeholder="1"
      />

      <TextField
        v-if="cadenceType === 'monthly'"
        v-model="dayOfMonth"
        type="number"
        :label="t('chores.dayOfMonthLabel')"
        placeholder="1"
      />
    </form>

    <template #footer>
      <Button variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </Button>

      <Button
        variant="primary"
        :disabled="saving || !title.trim() || !cadenceValid"
        @click="handleSubmit"
      >
        {{ saving ? t('chores.creating') : t('chores.create') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
/** CreateChoreModal — form to create a new recurring chore with cadence options. */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChoresStore } from '@/stores/chores.store.js'
import Modal from '@/components/ui/Modal.vue'
import TextField from '@/components/ui/TextField.vue'
import Button from '@/components/ui/Button.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'

export default {
  name: 'CreateChoreModal',
  components: { Modal, TextField, Button, SegmentedControl },
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useChoresStore()

    const title = ref('')
    const cadenceType = ref('daily')
    const daysOfWeek = ref([1, 2, 3, 4, 5])
    const interval = ref('1')
    const dayOfMonth = ref('1')
    const submitted = ref(false)
    const saving = ref(false)

    const cadenceOptions = computed(() => [
      { value: 'daily', label: t('chores.cadenceDaily') },
      { value: 'weekly', label: t('chores.cadenceWeekly') },
      { value: 'monthly', label: t('chores.cadenceMonthly') }
    ])

    const dayLabels = computed(() => [
      t('chores.dayShortSun'),
      t('chores.dayShortMon'),
      t('chores.dayShortTue'),
      t('chores.dayShortWed'),
      t('chores.dayShortThu'),
      t('chores.dayShortFri'),
      t('chores.dayShortSat')
    ])

    const cadenceValid = computed(() => {
      if (cadenceType.value === 'weekly') return daysOfWeek.value.length > 0
      if (cadenceType.value === 'monthly') {
        const n = Number(dayOfMonth.value)
        return Number.isInteger(n) && n >= 1 && n <= 31
      }
      if (cadenceType.value === 'daily') {
        const n = Number(interval.value)
        return Number.isInteger(n) && n >= 1
      }
      return true
    })

    function reset() {
      title.value = ''
      cadenceType.value = 'daily'
      daysOfWeek.value = [1, 2, 3, 4, 5]
      interval.value = '1'
      dayOfMonth.value = '1'
      submitted.value = false
      saving.value = false
    }

    watch(
      () => props.modelValue,
      open => {
        if (open) reset()
      }
    )

    function toggleDay(idx) {
      if (daysOfWeek.value.includes(idx)) {
        daysOfWeek.value = daysOfWeek.value.filter(d => d !== idx)
      } else {
        daysOfWeek.value = [...daysOfWeek.value, idx].sort((a, b) => a - b)
      }
    }

    function cancel() {
      emit('update:modelValue', false)
    }

    function buildCadence() {
      if (cadenceType.value === 'weekly') {
        return { type: 'weekly', daysOfWeek: daysOfWeek.value, interval: 1 }
      }
      if (cadenceType.value === 'monthly') {
        return { type: 'monthly', daysOfWeek: [], interval: 1, dayOfMonth: Number(dayOfMonth.value) }
      }
      return { type: 'daily', daysOfWeek: [], interval: Number(interval.value) }
    }

    async function handleSubmit() {
      submitted.value = true
      if (!title.value.trim() || !cadenceValid.value || saving.value) return
      saving.value = true
      try {
        await store.createChore({ title: title.value.trim(), cadence: buildCadence() })
        emit('update:modelValue', false)
      } catch {
        // Error already toasted by the store
      } finally {
        saving.value = false
      }
    }

    return {
      t,
      title,
      cadenceType,
      cadenceOptions,
      daysOfWeek,
      dayLabels,
      interval,
      dayOfMonth,
      submitted,
      saving,
      cadenceValid,
      toggleDay,
      cancel,
      handleSubmit
    }
  }
}
</script>

<style lang="scss" scoped>
.create-chore-modal {
  &__form {
    @apply flex flex-col gap-3.5;
  }

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__dow {
    @apply flex gap-1.5;
  }

  &__dow-btn {
    @apply inline-flex h-9 w-9 items-center justify-center rounded-pill border border-rule-soft bg-paper-2 text-[12px] font-medium text-ink transition-colors hover:bg-paper-3;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply bg-ink text-paper border-ink;
    }
  }
}
</style>
