<template>
  <AppModal
    :model-value="open"
    :title="mode === 'edit' ? t('calendar.eventSheet.editTitle') : t('calendar.eventSheet.createTitle')"
    :close-on-backdrop="!saving"
    @update:model-value="onModelUpdate"
  >
    <form class="event-sheet__form" @submit.prevent="save">
      <!-- Title -->
      <AppTextField
        v-model="form.title"
        :label="t('calendar.eventSheet.titleLabel')"
        :placeholder="t('calendar.eventSheet.titlePlaceholder')"
        :invalid="submitted && !form.title.trim()"
      />

      <!-- Date + all-day toggle -->
      <div class="event-sheet__row">
        <div class="event-sheet__field event-sheet__field--grow">
          <AppDatePicker
            v-model="form.date"
            :label="t('calendar.eventSheet.dateLabel')"
            :invalid="submitted && !form.date"
          />
        </div>

        <button
          type="button"
          class="event-sheet__toggle"
          :class="form.allDay ? 'event-sheet__toggle--on' : 'event-sheet__toggle--off'"
          :aria-pressed="form.allDay"
          @click="toggleAllDay"
        >
          <span class="event-sheet__toggle-dot" />
          {{ t('calendar.eventSheet.allDayLabel') }}
        </button>
      </div>

      <!-- Start / end time, only when not all-day -->
      <div v-if="!form.allDay" class="event-sheet__row">
        <label class="event-sheet__field event-sheet__field--grow">
          <span class="event-sheet__label">
            {{ t('calendar.eventSheet.startsLabel') }}
          </span>

          <input
            v-model="form.startTime"
            type="time"
            class="event-sheet__input"
          />
        </label>

        <label class="event-sheet__field event-sheet__field--grow">
          <span class="event-sheet__label">
            {{ t('calendar.eventSheet.endsLabel') }}
          </span>

          <input
            v-model="form.endTime"
            type="time"
            class="event-sheet__input"
          />
        </label>
      </div>

      <!-- Location -->
      <AppTextField
        v-model="form.location"
        :label="t('calendar.eventSheet.locationLabel')"
        :placeholder="t('calendar.eventSheet.locationPlaceholder')"
        icon="map-pin"
      />

      <!-- Notes -->
      <label class="event-sheet__field">
        <span class="event-sheet__label">
          {{ t('calendar.eventSheet.notesLabel') }}
        </span>

        <textarea
          v-model="form.notes"
          rows="3"
          maxlength="2000"
          :placeholder="t('calendar.eventSheet.notesPlaceholder')"
          class="event-sheet__textarea"
        />
      </label>

      <!-- Highlight -->
      <label class="event-sheet__highlight">
        <AppCheckbox
          v-model="form.accent"
          :aria-label="t('calendar.eventSheet.accentLabel')"
        />

        <span class="event-sheet__highlight-text">
          <span class="event-sheet__highlight-label">
            {{ t('calendar.eventSheet.accentLabel') }}
          </span>

          <span class="event-sheet__highlight-hint">
            {{ t('calendar.eventSheet.accentHint') }}
          </span>
        </span>
      </label>
    </form>

    <template #footer>
      <AppButton
        v-if="mode === 'edit'"
        variant="ghost"
        :disabled="saving"
        @click="del"
      >
        {{ t('calendar.eventSheet.delete') }}
      </AppButton>

      <span class="event-sheet__footer-spacer" />

      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('calendar.eventSheet.cancel') }}
      </AppButton>

      <AppButton
        variant="primary"
        :disabled="!canSave || saving"
        @click="save"
      >
        {{
          saving
            ? t('calendar.eventSheet.saving')
            : mode === 'edit'
              ? t('calendar.eventSheet.save')
              : t('calendar.eventSheet.create')
        }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
/**
 * CalendarEventSheet — single modal for both creating and editing calendar
 * events. Open with `mode: 'create'` and a `date` to seed, or `mode: 'edit'`
 * with the full `event` object. Saves through the calendar store, so the grid
 * updates without a refetch.
 *
 * Visually aligned with the other AppModal-based modals (CreateProjectModal,
 * CreateChoreModal): same header, body, and footer layout; same field
 * primitives (AppTextField, AppCheckbox, AppButton).
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalendarStore } from '@/stores/calendar.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

export default {
  name: 'CalendarEventSheet',
  components: { AppModal, AppTextField, AppDatePicker, AppButton, AppCheckbox },
  props: {
    open: { type: Boolean, default: false },
    mode: { type: String, default: 'create' },
    event: { type: Object, default: null },
    date: { type: String, default: null }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useCalendarStore()
    const submitted = ref(false)
    const saving = ref(false)
    const form = ref(blankForm())

    /** Save is allowed once the title is non-empty and a date is set; when
     *  not all-day, also require both times so we never persist a half-set
     *  range that the agenda doesn't know how to render. */
    const canSave = computed(() => {
      if (!form.value.title.trim() || !form.value.date) return false

      if (!form.value.allDay) {
        if (!form.value.startTime || !form.value.endTime) return false
        if (form.value.startTime >= form.value.endTime) return false
      }

      return true
    })

    watch(
      () => props.open,
      isOpen => {
        if (!isOpen) return
        submitted.value = false
        saving.value = false

        if (props.mode === 'edit' && props.event) {
          form.value = {
            title: props.event.title ?? '',
            date: props.event.date ?? '',
            accent: !!props.event.accent,
            allDay: props.event.allDay !== false && !props.event.startTime,
            startTime: props.event.startTime ?? '',
            endTime: props.event.endTime ?? '',
            location: props.event.location ?? '',
            notes: props.event.notes ?? ''
          }

          // Server-side allDay is authoritative when defined; the fallback
          // above is only for legacy rows persisted before the field landed.
          if (typeof props.event.allDay === 'boolean') {
            form.value.allDay = props.event.allDay
          }
        } else {
          form.value = blankForm(props.date)
        }
      }
    )

    return { t, form, submitted, saving, canSave, toggleAllDay, save, del, cancel, onModelUpdate }

    // -- Function definitions --

    /** A fresh form with sensible defaults, seeded to today (or `seedDate`). */
    function blankForm(seedDate = null) {
      const today = new Date().toISOString().slice(0, 10)
      return {
        title: '',
        date: seedDate ?? today,
        accent: false,
        allDay: true,
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        notes: ''
      }
    }

    /** Flip the all-day flag. When turning all-day OFF, seed sensible
     *  defaults so the time inputs aren't blank on first open. */
    function toggleAllDay() {
      form.value.allDay = !form.value.allDay

      if (!form.value.allDay) {
        if (!form.value.startTime) form.value.startTime = '09:00'
        if (!form.value.endTime) form.value.endTime = '10:00'
      }
    }

    /** Persist the event via the calendar store. Routes to create vs update
     *  based on the `mode` prop. Emits `saved` + `close` on success; on
     *  failure the modal stays open so the user can retry. */
    async function save() {
      submitted.value = true
      if (!canSave.value || saving.value) return
      saving.value = true

      // Build a tidy payload: drop times entirely when all-day, trim free-text
      // fields so blank strings persist as null on the server side.
      const payload = {
        title: form.value.title.trim(),
        date: form.value.date,
        accent: form.value.accent,
        allDay: form.value.allDay,
        startTime: form.value.allDay ? null : form.value.startTime || null,
        endTime: form.value.allDay ? null : form.value.endTime || null,
        location: form.value.location.trim() || null,
        notes: form.value.notes.trim() || null
      }

      try {
        if (props.mode === 'edit' && props.event) {
          await store.updateEvent(props.event.id, payload)
        } else {
          await store.createEvent(payload)
        }

        emit('saved')
        emit('close')
      } catch {
        /* store-level toast surfaces the error; keep modal open for retry */
      } finally {
        saving.value = false
      }
    }

    /** Confirm + delete the current event through the calendar store. */
    async function del() {
      if (!props.event) return
      if (!window.confirm(t('calendar.eventSheet.deleteConfirm', { title: props.event.title }))) return
      saving.value = true

      try {
        await store.deleteEvent(props.event.id)
        emit('saved')
        emit('close')
      } catch {
        /* toast in store */
      } finally {
        saving.value = false
      }
    }

    function cancel() {
      if (saving.value) return
      emit('close')
    }

    /** AppModal v-model writes false when the user dismisses via backdrop /
     *  ESC / close button — route that to the same `close` event consumers
     *  already subscribe to. */
    function onModelUpdate(value) {
      if (!value) emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.event-sheet {
  &__form {
    @apply flex flex-col gap-3.5;
  }

  &__row {
    @apply flex flex-wrap items-end gap-3;
  }

  &__field {
    @apply flex flex-col gap-1.5;

    &--grow {
      @apply min-w-[140px] flex-1;
    }
  }

  &__label {
    @apply text-[12px] font-medium text-muted;
  }

  &__input {
    @apply w-full rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted focus:border-muted;
    color-scheme: light dark;
  }

  &__textarea {
    @apply min-h-[88px] rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted focus:border-muted;
  }

  &__toggle {
    @apply inline-flex shrink-0 items-center gap-2 rounded-pill border border-rule-soft bg-paper-2 px-3 py-2 text-[12px] font-medium text-ink transition-colors;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--on {
      @apply border-ink bg-ink text-paper;
    }

    &--off {
      @apply hover:bg-paper-3;
    }
  }

  &__toggle-dot {
    @apply h-1.5 w-1.5 rounded-full bg-current;
  }

  &__highlight {
    @apply mt-1 flex cursor-pointer items-start gap-3 rounded-md border border-rule-soft bg-paper-2 px-3 py-3;
  }

  &__highlight-text {
    @apply flex flex-col gap-0.5;
  }

  &__highlight-label {
    @apply text-[13px] font-medium text-ink;
  }

  &__highlight-hint {
    @apply text-[12px] text-muted;
  }

  &__footer-spacer {
    @apply flex-1;
  }
}
</style>
