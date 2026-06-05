<template>
  <div class="tb">
    <!-- Drag-source rail -->
    <aside class="tb__rail">
      <h4 class="tb__rail-h">
        {{ $t('calendar.unscheduled') }}
      </h4>

      <template v-if="unscheduled.length > 0">
        <div
          v-for="task in unscheduled"
          :key="task.id"
          class="tb__task"
          draggable="true"
          @dragstart="onDragStart($event, task)"
        >
          <div class="tb__task-row">
            <div class="tb__task-t">
              {{ task.title }}
            </div>

            <!-- Keyboard alternative to dragging the task onto the grid: the
                 grid drop is pointer-only, so this schedules the task into the
                 next free slot today via the same store action the drop uses. -->
            <button
              type="button"
              class="tb__task-schedule"
              :aria-label="t('calendar.scheduleTaskAria', { title: task.title })"
              :title="t('calendar.scheduleTask')"
              @click="onScheduleTask(task)"
            >
              <CalendarDaysIcon class="tb__task-schedule-icon" aria-hidden="true" />
            </button>
          </div>

          <div class="tb__task-m">
            <span v-if="task.tag" class="tb__tag">
              {{ task.tag }}
            </span>

            <span v-if="task.effortMinutes">
              {{ `${task.effortMinutes}m` }}
            </span>
          </div>
        </div>
      </template>

      <p v-else class="tb__rail-empty">
        {{ $t('calendar.railEmpty') }}
      </p>

      <h4 class="tb__rail-h tb__rail-h--mt">
        {{ $t('calendar.recurringChores') }}
      </h4>

      <template v-if="recurringChores.length > 0">
        <div v-for="chore in recurringChores" :key="chore.title" class="tb__task">
          <div class="tb__task-t">
            {{ chore.title }}
          </div>

          <div class="tb__task-m">
            {{ chore.cadence }}
          </div>
        </div>
      </template>

      <p v-else class="tb__rail-empty">
        {{ $t('calendar.choresEmpty') }}
      </p>
    </aside>

    <!-- Week grid -->
    <div class="tb__grid">
      <!-- Day headers -->
      <div class="tb__grid-head">
        <div class="tb__grid-col" />

        <div
          v-for="(day, i) in days"
          :key="i"
          :class="['tb__grid-col', { 'tb__grid-col--today': i === todayCol }]"
        >
          <div class="tb__dow">
            {{ day.dow }}
          </div>

          <div class="tb__dnum">
            {{ day.dnum }}
          </div>
        </div>
      </div>

      <!-- Time-slot grid body — the ONLY scroll surface inside the calendar.
           The page itself stays fixed at the viewport. -->
      <div ref="bodyRef" class="tb__body-scroll">
        <div
          class="tb__body"
          :style="{ '--row-h': rowH + 'px' }"
        >
          <!--
            The role="grid" wraps ONLY the cell matrix (rows of rowheader +
            gridcells) — NOT the absolutely-positioned event blocks / now-line
            below, which are an overlay and would violate the grid's
            `aria-required-children` (only rows may be grid children). Both this
            wrapper and the per-row wrappers use `display: contents`, so they
            contribute the grid > row > gridcell ARIA nesting without producing
            boxes: the cells still flow into `.tb__body`'s single CSS grid, and
            the overlay still positions against `.tb__body`. The overlay sits as
            a DOM sibling of this grid wrapper, so it is no longer a grid child.
          -->
          <div
            class="tb__grid-matrix"
            role="grid"
            :aria-label="t('calendar.weekGridAriaLabel')"
          >
            <!--
              Each half-hour row is wrapped in a role="row" so the rowheader +
              gridcells have the ARIA parent the grid role requires (axe
              `aria-required-parent`).
            -->
            <div
              v-for="r in rowsCount"
              :key="r"
              class="tb__grid-row"
              role="row"
            >
              <div
                :class="['tb__row-lbl', { 'tb__row-lbl--half': (r - 1) % 2 === 1 }]"
                role="rowheader"
              >
                {{ (r - 1) % 2 === 0 ? formatHourLabel(START_HOUR + Math.floor((r - 1) / 2)) : '' }}
              </div>

              <div
                v-for="c in 7"
                :key="c"
                :class="[
                  'tb__cell',
                  { 'tb__cell--today': c - 1 === todayCol }
                ]"
                role="gridcell"
                :aria-label="cellAriaLabel(c - 1, r - 1)"
                @dragover.prevent
                @drop.prevent="onDrop($event, c - 1, r - 1)"
              />
            </div>
          </div>

          <!-- Now indicator (only rendered when current time falls within
               the visible day range and today is in the visible week). -->
          <div
            v-if="nowVisible"
            class="tb__now"
            :style="{ top: nowTop + 'px' }"
          />

          <!-- Scheduled blocks -->
          <button
            v-for="block in blocks"
            :key="block.id"
            type="button"
            :class="[
              'tb__block',
              `tb__block--${block.kind}`,
              { 'tb__block--conflict': block.conflict, 'tb__block--short': block.span <= 1 }
            ]"
            :style="blockStyle(block)"
            :title="block.title"
            @click="onBlockClick(block)"
          >
            <span class="tb__block-t">
              {{ block.title }}
            </span>

            <span v-if="block.meta && block.span > 1" class="tb__block-m">
              {{ block.meta }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * TimeBlockView — calendar Week tab (the time-blocking surface).
 *
 * Layout:
 *   - left rail: unscheduled tasks + recurring chores (drag sources)
 *   - 7-day timeline grid spanning 00:00–24:00, drag a task onto a slot
 *     to schedule it
 *
 * The grid uses absolute-positioned blocks layered on top of the cell grid so
 * an event can span multiple slots and overlap cleanly. The "now" indicator
 * is a thin accent rule pinned at the current minutes-from-midnight, only
 * rendered when today falls inside the visible week.
 *
 * Time-block writes go through `moveTaskToTimeSlot`, which atomically sets
 * scheduledDate + scheduledTime + effortMinutes (avoids a partial-state race
 * with two separate updateTask calls).
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { useTodayStore } from '@/stores/today.store.js'
import { useCalendarStore } from '@/stores/calendar.store.js'
import { toLocalISODate, formatTime } from '@/utils/date.js'
import { useWeekdayHeaders } from '@/composables/useWeekdayHeaders.js'

/** Visible window — full day so the "now" line works at any hour and the
 *  user can drop early-morning / late-night blocks without scrolling
 *  outside the grid. */
const START_HOUR = 0
const END_HOUR = 24

/** Anchor the week grid to Sunday of the current week. */
function startOfWeek(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** Convert "HH:MM" to a 30-min row offset from START_HOUR. */
function timeToRow(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  if (!Number.isFinite(h)) return null
  const minutes = h * 60 + (m || 0) - START_HOUR * 60
  if (minutes < 0) return null
  return Math.floor(minutes / 30)
}

/** Difference in minutes between two HH:MM strings; returns 30 when missing
 *  so blocks always have a visible height. */
function timeRangeMinutes(start, end) {
  if (!start || !end) return 30
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if (!Number.isFinite(sh) || !Number.isFinite(eh)) return 30
  return Math.max(30, eh * 60 + (em || 0) - (sh * 60 + (sm || 0)))
}

/** Format an integer hour as a 2-digit "HH:00" label. */
function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

export default {
  name: 'TimeBlockView',
  components: { CalendarDaysIcon },
  emits: ['edit-event', 'edit-task'],
  setup(_props, { emit }) {
    const { t } = useI18n()
    const todayStore = useTodayStore()
    const calendarStore = useCalendarStore()
    const { weekdayHeaders } = useWeekdayHeaders()
    const rowsCount = (END_HOUR - START_HOUR) * 2
    const rowH = 24

    const weekStart = ref(startOfWeek())
    /** Re-evaluated each minute so the now-indicator keeps sliding without
     *  the user having to scroll or interact. */
    const now = ref(new Date())
    let nowTimer = null
    const bodyRef = ref(null)

    const days = computed(() => {
      const out = []

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart.value)
        d.setDate(d.getDate() + i)
        out.push({ dow: weekdayHeaders.value[i], dnum: d.getDate(), iso: toLocalISODate(d) })
      }

      return out
    })

    /** Column index for today, or -1 if today falls outside the visible week. */
    const todayCol = computed(() => {
      const todayIso = toLocalISODate(now.value)
      return days.value.findIndex(d => d.iso === todayIso)
    })

    const nowVisible = computed(() => todayCol.value >= 0)

    /** Pixel offset of the "now" indicator. */
    const nowTop = computed(() => {
      const minutesSinceStart = (now.value.getHours() - START_HOUR) * 60 + now.value.getMinutes()
      if (minutesSinceStart < 0) return 0
      return Math.min(rowsCount * rowH, (minutesSinceStart / 30) * rowH)
    })

    onMounted(() => {
      todayStore.load()
      calendarStore.load()

      // Tick the clock once a minute so the now-line slides without a
      // reload. Cleared on unmount.
      nowTimer = setInterval(() => {
        now.value = new Date()
      }, 60_000)

      // Land the user near "now" (or the start of the workday when today is
      // not in the visible week) so they don't open the calendar to a wall
      // of empty pre-dawn rows.
      nextTick(scrollToVisibleHour)
    })

    onBeforeUnmount(() => {
      if (nowTimer) clearInterval(nowTimer)
    })

    watch(weekStart, () => {
      todayStore.load()
      calendarStore.load()
    })

    const unscheduled = computed(() => {
      const tasks = todayStore.view?.tasks ?? []
      return tasks
        .filter(t => !t.scheduledTime && !t.done)
        .map(t => ({
          id: t.id,
          title: t.title,
          tag: t.tag ?? null,
          effortMinutes: t.effortMinutes ?? 30
        }))
    })

    const recurringChores = []

    /** Derived blocks: scheduled tasks (today's tasks) + calendar events. */
    const blocks = computed(() => {
      const out = []
      const todayTasks = todayStore.view?.tasks ?? []

      for (const t of todayTasks) {
        const row = timeToRow(t.scheduledTime)
        if (row === null) continue
        const span = Math.max(1, Math.ceil((t.effortMinutes ?? 30) / 30))

        out.push({
          id: 'task-' + t.id,
          col: todayCol.value < 0 ? 0 : todayCol.value,
          start: row,
          span,
          kind: t.done ? 'event' : t.projectId ? 'proj' : 'chore',
          title: t.title,
          meta: `${t.scheduledTime}${t.effortMinutes ? ` · ${t.effortMinutes}m` : ''}`,
          eventRef: null,
          // Keep a live reference to the underlying today task so a click can
          // open the task edit modal with full context (note, effort, tag, etc.).
          taskRef: t
        })
      }

      const events = calendarStore.events ?? []

      for (const ev of events) {
        if (!ev.date) continue
        const evDate = String(ev.date).slice(0, 10)
        const colIdx = days.value.findIndex(d => d.iso === evDate)
        if (colIdx < 0) continue

        const isAllDay = ev.allDay !== false && !ev.startTime
        // All-day events sit in a thin band at the top of the day. Timed
        // events use their real start row and span the actual duration.
        const start = isAllDay ? 0 : (timeToRow(ev.startTime) ?? 0)

        const span = isAllDay
          ? 1
          : Math.max(1, Math.ceil(timeRangeMinutes(ev.startTime, ev.endTime) / 30))

        const meta = isAllDay
          ? t('calendar.allDay')
          : `${formatTime(ev.startTime) || ev.startTime}${ev.endTime ? ` – ${formatTime(ev.endTime) || ev.endTime}` : ''}`

        out.push({
          id: 'ev-' + ev.id,
          col: colIdx,
          start,
          span,
          kind: 'event',
          title: ev.title,
          meta,
          eventRef: ev
        })
      }

      return out
    })

    const optimisticBlocks = ref([])
    const mergedBlocks = computed(() => [...blocks.value, ...optimisticBlocks.value])

    return {
      t,
      START_HOUR,
      unscheduled,
      recurringChores,
      blocks: mergedBlocks,
      days,
      todayCol,
      rowsCount,
      rowH,
      nowTop,
      nowVisible,
      formatHourLabel,
      blockStyle,
      cellAriaLabel,
      onDragStart,
      onDrop,
      onScheduleTask,
      onBlockClick,
      bodyRef
    }

    // -- Function definitions --

    function blockStyle(b) {
      return {
        left: `calc(40px + ${b.col} * ((100% - 40px) / 7) + 2px)`,
        width: `calc((100% - 40px) / 7 - 4px)`,
        top: `${b.start * rowH + 1}px`,
        height: `${Math.max(rowH, b.span * rowH - 2)}px`
      }
    }

    /**
     * Scroll the hour grid so a sensible hour is the first thing the user
     * sees. Defaults to "an hour before now" when today is in the visible
     * week, falling back to 07:00 — which is roughly the start of the
     * workday for most users — so they don't open the calendar to a wall
     * of empty pre-dawn rows.
     */
    function scrollToVisibleHour() {
      const el = bodyRef.value
      if (!el) return
      const fallbackHour = 7

      const target = todayCol.value >= 0
        ? Math.max(0, now.value.getHours() - 1)
        : fallbackHour

      el.scrollTop = (target - START_HOUR) * 2 * rowH
    }

    function onDragStart(e, task) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('application/json', JSON.stringify(task))
    }

    /**
     * Accessible name for a time-grid cell: the weekday/date of the column and
     * the clock time of the row. Gives screen-reader users orientation inside
     * the otherwise-presentational grid.
     */
    function cellAriaLabel(col, row) {
      const day = days.value[col]
      const minutes = row * 30 + START_HOUR * 60
      const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
      const mm = String(minutes % 60).padStart(2, '0')
      const dayLabel = day ? `${day.dow} ${day.dnum}` : ''
      return t('calendar.weekCellAria', { day: dayLabel, time: `${hh}:${mm}` })
    }

    /**
     * Keyboard alternative to dragging a rail task onto the grid. Schedules the
     * task into the next half-hour slot today via the SAME store action the
     * drop uses (`moveTaskToTimeSlot`), then reloads today so the block shows.
     */
    async function onScheduleTask(task) {
      if (!task?.id) return

      // Target column: today when visible, else the first day of the week.
      const col = todayCol.value >= 0 ? todayCol.value : 0
      const scheduledDate = days.value[col]?.iso ?? toLocalISODate(new Date())

      // Round "now" up to the next half hour as a sensible default slot.
      const base = now.value
      let minutes = base.getHours() * 60 + base.getMinutes()
      minutes = Math.ceil(minutes / 30) * 30
      const hour = Math.min(23, Math.floor(minutes / 60))
      const minute = minutes % 60
      const scheduledTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

      try {
        await calendarStore.moveTaskToTimeSlot(
          task.id,
          scheduledDate,
          scheduledTime,
          task.effortMinutes ?? 30
        )

        await todayStore.load()
      } catch {
        /* server reject — toast surfaced by the store */
      }
    }

    function onBlockClick(block) {
      // Calendar events open the event sheet; today tasks open the task edit
      // modal. The parent (CalendarView) owns both surfaces.
      if (block.eventRef) emit('edit-event', block.eventRef)
      else if (block.taskRef) emit('edit-task', block.taskRef)
    }

    async function onDrop(e, col, row) {
      let task

      try {
        task = JSON.parse(e.dataTransfer.getData('application/json'))
      } catch {
        return
      }

      if (!task?.id) return
      const minutesSinceStart = row * 30 + START_HOUR * 60
      const hour = Math.floor(minutesSinceStart / 60)
      const minute = minutesSinceStart % 60
      const scheduledTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      const scheduledDate = days.value[col]?.iso ?? toLocalISODate(new Date())
      const span = Math.max(2, Math.ceil((task.effortMinutes ?? 30) / 30))
      const tempId = 'new-' + Date.now()

      optimisticBlocks.value.push({
        id: tempId,
        col,
        start: row,
        span,
        kind: 'proj',
        title: task.title,
        meta: `${scheduledTime} · ${task.effortMinutes ?? 30}m`,
        eventRef: null
      })

      try {
        await calendarStore.moveTaskToTimeSlot(
          task.id,
          scheduledDate,
          scheduledTime,
          task.effortMinutes ?? 30
        )

        await todayStore.load()
      } catch {
        /* server reject — drop the optimistic block */
      } finally {
        optimisticBlocks.value = optimisticBlocks.value.filter(b => b.id !== tempId)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tb {
  // Two-column layout (rail + grid) confined to the parent's height so the
  // hour grid can scroll internally. Each column owns its own scroll.
  @apply grid h-full min-h-0 gap-3;
  grid-template-columns: 220px 1fr;

  &__rail {
    @apply flex min-h-0 flex-col gap-1.5 overflow-y-auto rounded-[12px] p-3 shadow-sm;
    background: var(--paper-2);
  }

  &__rail-h {
    @apply mx-0.5 mb-1 mt-1 font-mono text-[10px] font-medium uppercase;
    color: var(--muted);
    letter-spacing: 0.14em;

    &--mt { @apply mt-3; }
  }

  &__rail-empty {
    @apply mx-0.5 mb-1 text-[12px] italic;
    color: var(--muted);
  }

  &__task {
    @apply flex cursor-grab flex-col gap-1 rounded-[10px] border border-rule-soft px-3 py-2;
    background: var(--paper);

    &:hover { border-color: var(--muted); }
  }

  &__task-row {
    @apply flex items-start justify-between gap-2;
  }

  &__task-t { @apply min-w-0 flex-1 text-[13px] font-medium; }

  &__task-schedule {
    @apply inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors;
    @apply hover:bg-paper-3 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__task-schedule-icon {
    @apply h-4 w-4;
  }

  &__task-m {
    @apply flex items-center gap-2 text-[11px];
    color: var(--muted);
  }

  &__tag {
    @apply rounded-full px-1.5 py-0.5 text-[10px];
    background: var(--paper-3);
  }

  &__grid {
    @apply flex min-h-0 flex-col overflow-hidden rounded-[12px] shadow-sm;
    background: var(--paper-2);
  }

  &__grid-head {
    @apply grid shrink-0 border-b border-rule-soft;
    grid-template-columns: 40px repeat(7, 1fr);
  }

  &__grid-col {
    @apply border-l border-rule-soft px-1.5 py-2 text-center text-xs;

    &:first-child { @apply border-l-0; }
    // Deepened accent (see the dow/dnum rule below) so any accent-colored text
    // in the today column clears the WCAG AA 4.5:1 floor on the white grid.
    &--today { color: color-mix(in oklab, var(--accent), #000 30%); }
  }

  &__dow {
    @apply font-mono uppercase;
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.12em;
  }

  &__dnum {
    @apply mt-0.5 font-serif leading-none;
    font-size: 18px;
  }

  // The "today" column's day-of-week + day-number read in the accent so today
  // stands out. Raw accent (warm: #ff5a1f) on the white grid surface is only
  // ~3.1:1, under the WCAG AA 4.5:1 floor the a11y gate enforces for this small
  // text. Deepen the accent toward black for the text so it clears 4.5:1 while
  // keeping the today column visibly accent-tinted (the column background tint
  // and the now-line still use the full-strength accent).
  .tb__grid-col--today &__dow,
  .tb__grid-col--today &__dnum {
    color: color-mix(in oklab, var(--accent), #000 30%);
  }

  // The hour grid scrolls internally so the heading/toolbar stay put. Only
  // this surface scrolls in the calendar view.
  &__body-scroll {
    @apply flex-1 overflow-y-auto;
    min-height: 0;
  }

  &__body {
    @apply relative grid;
    grid-template-columns: 40px repeat(7, 1fr);
    grid-auto-rows: var(--row-h, 24px);
  }

  // ARIA grid wrapper (role="grid") + per-row wrappers (role="row") that must
  // not affect layout: `display: contents` hoists their rowheader + gridcell
  // descendants straight into `.tb__body`'s CSS grid, so the visual single-grid
  // layout is unchanged while the accessibility tree gains the required
  // grid > row > gridcell nesting. The matrix wrapping the cells (not the
  // absolutely-positioned overlay) also keeps the event blocks / now-line out
  // of the grid's child list, satisfying `aria-required-children`.
  &__grid-matrix,
  &__grid-row {
    display: contents;
  }

  &__row-lbl {
    // Vertically center the hour text inside its 24px row. The cell still
    // owns the hour gridline (border-t) so the gridline draws continuously
    // across the whole row — the label sits cleanly within the cell instead
    // of overlapping the line.
    @apply flex items-center justify-center border-t border-rule-soft font-mono text-[10px] leading-none;
    color: var(--muted);
    letter-spacing: 0.04em;

    &--half {
      // Half-hour rows have no label text. Keeping the cell present (with a
      // top border) is what draws the half-hour gridline.
      color: transparent;
    }
  }

  &__cell {
    @apply border-l border-t border-rule-soft;

    &--today { background: color-mix(in oklab, var(--accent) 5%, var(--paper-2)); }
  }

  &__now {
    @apply absolute z-10 pointer-events-none;
    left: 40px;
    right: 0;
    height: 2px;
    background: var(--accent);

    &::before {
      content: '';
      position: absolute;
      left: -4px;
      top: -4px;
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--accent);
    }
  }

  &__block {
    @apply absolute z-20 flex cursor-pointer flex-col gap-0 overflow-hidden rounded-md px-2 py-1 text-left text-[12px];
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
    background: var(--accent);
    color: var(--accent-ink);
    box-shadow: 0 2px 6px color-mix(in oklab, var(--accent) 30%, transparent);

    &--proj { background: color-mix(in oklab, var(--accent) 75%, var(--ink)); }

    &--chore {
      background: var(--ink);
      color: var(--paper);
    }

    &--event {
      background: var(--paper-3);
      color: var(--ink);
      border: 1px solid var(--rule-soft);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    &--conflict { outline: 2px dashed var(--warn); outline-offset: -3px; }

    // Very short events (≤30 min, 24px tall) can't fit two lines comfortably.
    // Drop vertical padding, shrink type, and lay title + time on one row so
    // the block reads cleanly instead of clipping a 12px font behind 4px of
    // padding.
    &--short {
      @apply flex-row items-center gap-1.5 py-0 text-[11px];
    }
  }

  &__block-t {
    @apply block truncate font-medium leading-tight;
  }

  &__block--short &__block-t {
    @apply min-w-0 flex-1 text-[11px];
  }

  &__block-m {
    @apply block truncate font-mono text-[10px] opacity-80;
    letter-spacing: 0.04em;
  }
}
</style>
