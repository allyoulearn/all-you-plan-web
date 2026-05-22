<template>
  <div>
    <ScreenHeading
      eyebrow="Looking back · Calendar"
      :title="MONTH_NAMES[currentMonth]"
      :emphasis="`${currentYear}.`"
    />

    <div v-if="store.loading" class="text-[13px] text-muted">
      Loading…
    </div>

    <div v-else-if="store.error" class="text-[13px] text-bad">
      {{ store.error }}
    </div>

    <!-- Month navigation -->
    <div class="mb-5 flex items-center gap-3">
      <IconButton
        icon="chevron-left"
        :size="30"
        variant="ghost"
        aria-label="Previous month"
        @click="prevMonth"
      />

      <span class="flex-1 text-center font-serif text-[22px] italic text-ink">
        {{ MONTH_NAMES[currentMonth] }} {{ currentYear }}
      </span>

      <IconButton
        icon="chevron-right"
        :size="30"
        variant="ghost"
        aria-label="Next month"
        @click="nextMonth"
      />
    </div>

    <!-- Calendar grid -->
    <Card>
      <!-- Weekday headers -->
      <div class="grid grid-cols-7 gap-0.5 pb-2">
        <div
          v-for="h in DAY_HEADERS"
          :key="h"
          class="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted"
        >
          {{ h }}
        </div>
      </div>

      <!-- Day cells (6 rows x 7 cols) -->
      <div class="grid grid-cols-7 gap-0.5">
        <button
          v-for="(cell, idx) in calendarDays"
          :key="idx"
          class="relative flex min-h-[52px] flex-col items-center rounded-sm px-1 pt-1.5 pb-1 text-[13px] transition-colors"
          :class="{
            'opacity-30': cell.adjacent,
            'bg-accent text-accent-ink font-medium': isToday(cell) && !isSelected(cell),
            'bg-ink text-paper font-medium ring-2 ring-ink ring-offset-1': isSelected(cell),
            'hover:bg-paper-3': !cell.adjacent && !isToday(cell) && !isSelected(cell),
          }"
          :disabled="cell.adjacent"
          @click="selectDay(cell)"
        >
          <span>
            {{ cell.day }}
          </span>
          <!-- Event dots -->
          <div class="mt-1 flex gap-0.5">
            <span
              v-for="ev in eventsForDay(cell.day, cell.adjacent)"
              :key="ev.id"
              class="h-1.5 w-1.5 rounded-full"
              :class="ev.accent ? 'bg-accent' : 'bg-muted'"
            />
          </div>
        </button>
      </div>
    </Card>

    <!-- Agenda -->
    <template v-if="selectedDay">
      <div class="mb-3 mt-8 flex items-baseline gap-3">
        <span class="text-[13px] font-medium text-ink">
          {{ agendaLabel }}
        </span>

        <span class="flex-1 border-t border-rule-soft" />

        <span class="font-mono text-[11px] text-muted">
          [{{ agendaEvents.length }}]
        </span>
      </div>

      <div v-if="agendaEvents.length === 0" class="text-[13px] text-muted">
        No events for this day.
      </div>

      <div v-else class="rounded-md bg-paper-2 px-2.5 py-1 shadow-sm">
        <div
          v-for="ev in agendaEvents"
          :key="ev.id"
          class="flex items-center gap-3 border-b border-rule-soft py-3 last:border-0"
          :class="ev.accent ? 'text-accent' : 'text-ink'"
        >
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :class="ev.accent ? 'bg-accent' : 'bg-muted'"
          />

          <span class="font-mono text-[13px]">
            {{ ev.title }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useCalendarStore } from '@/stores/calendar.store'
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import IconButton from '@/components/ui/IconButton.vue'
import Card from '@/components/ui/Card.vue'

const store = useCalendarStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth()) // 0-indexed

const selectedDay = ref(today.getDate())

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

onMounted(() => {
  store.load(monthKey(currentYear.value, currentMonth.value))
})

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

// Build the 6-row calendar grid (always 42 cells)
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

function isToday(cell) {
  if (cell.adjacent) return false
  return (
    cell.day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

function isSelected(cell) {
  if (cell.adjacent) return false
  return cell.day === selectedDay.value
}

// Events keyed by day number (current month only)
function eventsForDay(day, adjacent) {
  if (adjacent) return []
  const dayStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return store.events.filter((e) => e.date === dayStr).slice(0, 3)
}

const agendaEvents = computed(() => {
  if (!selectedDay.value) return []
  const dayStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`
  return store.events.filter((e) => e.date === dayStr)
})

const agendaLabel = computed(() => {
  if (!selectedDay.value) return ''
  const date = new Date(currentYear.value, currentMonth.value, selectedDay.value)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

function selectDay(cell) {
  if (cell.adjacent) return
  selectedDay.value = cell.day
}
</script>
