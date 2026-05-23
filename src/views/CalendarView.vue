<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Calendar"
      :title="monthLong(currentMonth)"
      :emphasis="`${currentYear}.`"
    />

    <div v-if="store.loading" class="calendar-view__status">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="store.error" class="calendar-view__status calendar-view__status--error">
      {{ store.error }}
    </div>

    <!-- Month navigation -->
    <div class="calendar-view__nav">
      <IconButton
        icon="chevron-left"
        :size="30"
        variant="ghost"
        :aria-label="t('calendar.prevMonth')"
        @click="prevMonth"
      />

      <span class="calendar-view__nav-title">
        {{ monthLong(currentMonth) }} {{ currentYear }}
      </span>

      <IconButton
        icon="chevron-right"
        :size="30"
        variant="ghost"
        :aria-label="t('calendar.nextMonth')"
        @click="nextMonth"
      />
    </div>

    <!-- Calendar grid — hidden while error is active -->
    <Card v-if="!store.error">
      <!-- Weekday headers -->
      <div class="calendar-view__weekday-row">
        <div
          v-for="h in dayHeaders"
          :key="h"
          class="calendar-view__weekday-header"
        >
          {{ h }}
        </div>
      </div>

      <!-- Day cells (6 rows x 7 cols) -->
      <div class="calendar-view__day-grid">
        <button
          v-for="(cell, idx) in calendarDays"
          :key="idx"
          class="calendar-view__day-cell"
          :class="{
            'calendar-view__day-cell--adjacent': cell.adjacent,
            'calendar-view__day-cell--today': isToday(cell) && !isSelected(cell),
            'calendar-view__day-cell--selected': isSelected(cell),
            'calendar-view__day-cell--default': !cell.adjacent && !isToday(cell) && !isSelected(cell),
          }"
          :disabled="cell.adjacent"
          :aria-label="cellAriaLabel(cell)"
          :aria-current="isToday(cell) ? 'date' : undefined"
          :aria-pressed="!cell.adjacent && isSelected(cell) ? 'true' : undefined"
          @click="selectDay(cell)"
        >
          <span>
            {{ cell.day }}
          </span>
          <!-- Event dots -->
          <div class="calendar-view__dots">
            <span
              v-for="ev in eventsForDay(cell.day, cell.adjacent)"
              :key="ev.id"
              class="calendar-view__dot"
              :class="ev.accent ? 'calendar-view__dot--accent' : 'calendar-view__dot--muted'"
            />
          </div>
        </button>
      </div>
    </Card>

    <!-- Agenda -->
    <template v-if="selectedDay">
      <div class="calendar-view__agenda-header">
        <span class="calendar-view__agenda-title">
          {{ agendaLabel }}
        </span>

        <span class="calendar-view__agenda-rule" />

        <span class="calendar-view__agenda-count">
          [{{ agendaEvents.length }}]
        </span>
      </div>

      <div v-if="agendaEvents.length === 0" class="calendar-view__status">
        {{ t('calendar.noEvents') }}
      </div>

      <div v-else class="calendar-view__agenda-list">
        <div
          v-for="ev in agendaEvents"
          :key="ev.id"
          class="calendar-view__agenda-item"
          :class="ev.accent ? 'calendar-view__agenda-item--accent' : 'calendar-view__agenda-item--default'"
        >
          <span
            class="calendar-view__event-dot"
            :class="ev.accent ? 'calendar-view__event-dot--accent' : 'calendar-view__event-dot--muted'"
          />

          <span class="calendar-view__event-title">
            {{ ev.title }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
/** CalendarView — monthly grid with event dots and a day-level agenda panel. */
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalendarStore } from '@/stores/calendar.store.js'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import IconButton from '@/components/ui/IconButton.vue'
import Card from '@/components/ui/Card.vue'

export default {
  name: 'CalendarView',
  components: { ScreenHeading, IconButton, Card },
  setup() {
    // -- State --
    const store = useCalendarStore()
    const { t } = useI18n()

    const today = new Date()
    const currentYear = ref(today.getFullYear())
    const currentMonth = ref(today.getMonth()) // 0-indexed
    const selectedDay = ref(today.getDate())

    // -- Computed --

    /**
     * Localised weekday header row ("Sun, Mon, …") sourced from Intl so the
     * row honours the user's browser locale instead of hardcoded English
     * (WEB-W4-06).
     */
    const dayHeaders = computed(() => {
      const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
      const headers = []
      // Pick an arbitrary Sunday as the base and step through the week.
      const base = new Date(2024, 0, 7) // 2024-01-07 was a Sunday
      for (let i = 0; i < 7; i++) {
        const d = new Date(base)
        d.setDate(base.getDate() + i)
        headers.push(fmt.format(d))
      }
      return headers
    })

    /** Builds the 6-row calendar grid (always 42 cells). */
    const calendarDays = computed(() => {
      const year = currentYear.value
      const month = currentMonth.value
      const firstDow = new Date(year, month, 1).getDay() // 0=Sun
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const daysInPrevMonth = new Date(year, month, 0).getDate()

      const cells = []

      // Leading days from previous month
      for (let i = firstDow - 1; i >= 0; i--) {
        cells.push({ day: daysInPrevMonth - i, adjacent: true, month: month - 1 < 0 ? 11 : month - 1 })
      }

      // Current month days
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, adjacent: false, month })
      }

      // Trailing days from next month
      const trailing = 42 - cells.length
      for (let d = 1; d <= trailing; d++) {
        cells.push({ day: d, adjacent: true, month: month + 1 > 11 ? 0 : month + 1 })
      }

      return cells
    })

    /**
     * Pre-computed map of YYYY-MM-DD → Event[] for the current month's events.
     * Replaces the per-cell eventsForDay() call, reducing 42× O(n) to O(n) + 42× O(1).
     */
    const eventsByDay = computed(() => {
      const map = new Map()
      for (const ev of store.events) {
        const list = map.get(ev.date)
        if (list) {
          list.push(ev)
        } else {
          map.set(ev.date, [ev])
        }
      }
      return map
    })

    /** Events for the currently selected day. */
    const agendaEvents = computed(() => {
      if (!selectedDay.value) return []
      const dayStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`
      return store.events.filter((e) => e.date === dayStr)
    })

    /** Formatted label for the agenda header (browser-default locale, WEB-W4-06). */
    const agendaLabel = computed(() => {
      if (!selectedDay.value) return ''
      const date = new Date(currentYear.value, currentMonth.value, selectedDay.value)
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    })

    // -- Lifecycle --
    onMounted(() => {
      store.load(monthKey(currentYear.value, currentMonth.value))
    })

    // -- Function definitions --

    /**
     * Returns the localised long month name for a 0-indexed month.
     * @param {number} month - 0-indexed month (0=Jan).
     * @returns {string}
     */
    function monthLong(month) {
      const date = new Date(2024, month, 1)
      return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date)
    }

    /**
     * Returns the YYYY-MM key for a given year and 0-indexed month.
     * @param {number} year
     * @param {number} month - 0-indexed
     * @returns {string}
     */
    function monthKey(year, month) {
      return `${year}-${String(month + 1).padStart(2, '0')}`
    }

    /** Navigates to the previous month and reloads store data. */
    function prevMonth() {
      if (currentMonth.value === 0) {
        currentMonth.value = 11
        currentYear.value--
      } else {
        currentMonth.value--
      }
      selectedDay.value = null
      store.load(monthKey(currentYear.value, currentMonth.value))
    }

    /** Navigates to the next month and reloads store data. */
    function nextMonth() {
      if (currentMonth.value === 11) {
        currentMonth.value = 0
        currentYear.value++
      } else {
        currentMonth.value++
      }
      selectedDay.value = null
      store.load(monthKey(currentYear.value, currentMonth.value))
    }

    /**
     * Returns true if the given cell represents today's date.
     * @param {{ day: number, adjacent: boolean }} cell
     * @returns {boolean}
     */
    function isToday(cell) {
      if (cell.adjacent) return false
      return (
        cell.day === today.getDate() &&
        currentMonth.value === today.getMonth() &&
        currentYear.value === today.getFullYear()
      )
    }

    /**
     * Returns true if the given cell is the currently selected day.
     * @param {{ day: number, adjacent: boolean }} cell
     * @returns {boolean}
     */
    function isSelected(cell) {
      if (cell.adjacent) return false
      return cell.day === selectedDay.value
    }

    /**
     * Returns up to 3 events for a given day number (current month only).
     * Uses the pre-computed eventsByDay map for O(1) lookup per cell.
     * @param {number} day
     * @param {boolean} adjacent
     * @returns {Array}
     */
    function eventsForDay(day, adjacent) {
      if (adjacent) return []
      const dayStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return (eventsByDay.value.get(dayStr) ?? []).slice(0, 3)
    }

    /**
     * Selects a day cell; does nothing for adjacent-month cells.
     * @param {{ day: number, adjacent: boolean }} cell
     */
    function selectDay(cell) {
      if (cell.adjacent) return
      selectedDay.value = cell.day
    }

    /**
     * Returns a descriptive aria-label for a day cell button.
     * @param {{ day: number, adjacent: boolean, month: number }} cell
     * @returns {string}
     */
    function cellAriaLabel(cell) {
      const year = currentYear.value
      const month = cell.adjacent ? cell.month : currentMonth.value
      const date = new Date(year, month, cell.day)
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }

    return {
      t,
      dayHeaders,
      monthLong,
      store,
      currentYear,
      currentMonth,
      selectedDay,
      calendarDays,
      eventsByDay,
      agendaEvents,
      agendaLabel,
      prevMonth,
      nextMonth,
      isToday,
      isSelected,
      eventsForDay,
      selectDay,
      cellAriaLabel,
    }
  }
}
</script>

<style lang="scss" scoped>
.calendar-view {
  &__status {
    @apply text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__nav {
    @apply mb-5 flex items-center gap-3;
  }

  &__nav-title {
    @apply flex-1 text-center font-serif text-[22px] italic text-ink;
  }

  &__weekday-row {
    @apply grid grid-cols-7 gap-0.5 pb-2;
  }

  &__weekday-header {
    @apply text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted;
  }

  &__day-grid {
    @apply grid grid-cols-7 gap-0.5;
  }

  &__day-cell {
    @apply relative flex min-h-[52px] flex-col items-center rounded-sm px-1 pt-1.5 pb-1 text-[13px] transition-colors;

    &--adjacent {
      @apply opacity-30;
    }

    &--today {
      @apply bg-accent text-accent-ink font-medium;
    }

    &--selected {
      @apply bg-ink text-paper font-medium ring-2 ring-ink ring-offset-1;
    }

    &--default {
      @apply hover:bg-paper-3;
    }
  }

  &__dots {
    @apply mt-1 flex gap-0.5;
  }

  &__dot {
    @apply h-1.5 w-1.5 rounded-full;

    &--accent {
      @apply bg-accent;
    }

    &--muted {
      @apply bg-muted;
    }
  }

  &__agenda-header {
    @apply mb-3 mt-8 flex items-baseline gap-3;
  }

  &__agenda-title {
    @apply text-[13px] font-medium text-ink;
  }

  &__agenda-rule {
    @apply flex-1 border-t border-rule-soft;
  }

  &__agenda-count {
    @apply font-mono text-[11px] text-muted;
  }

  &__agenda-list {
    @apply rounded-md bg-paper-2 px-2.5 py-1 shadow-sm;
  }

  &__agenda-item {
    @apply flex items-center gap-3 border-b border-rule-soft py-3 last:border-0;

    &--accent {
      @apply text-accent;
    }

    &--default {
      @apply text-ink;
    }
  }

  &__event-dot {
    @apply h-2 w-2 shrink-0 rounded-full;

    &--accent {
      @apply bg-accent;
    }

    &--muted {
      @apply bg-muted;
    }
  }

  &__event-title {
    @apply font-mono text-[13px];
  }
}
</style>
