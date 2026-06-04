<template>
  <div class="calendar-view">
    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="`${t('nav.lookingBack')} · ${t('nav.itemCalendar')}`"
      :title="headingTitle"
      :emphasis="headingEmphasis"
    />

    <!-- Toolbar: view switcher + prominent New event CTA -->
    <div class="calendar-view__toolbar">
      <AppSegmentedControl
        v-model="viewMode"
        :options="viewOptions"
        class="calendar-view__mode"
      />

      <AppButton
        variant="primary"
        icon="plus"
        class="calendar-view__new-event"
        @click="openCreateSheet()"
      >
        {{ t('calendar.newEventCta') }}
      </AppButton>
    </div>

    <!-- Week view -->
    <div v-if="viewMode === 'week'" class="calendar-view__week-pane">
      <TimeBlockView @edit-event="openEditSheet" @edit-task="openTaskDetail" />
    </div>

    <!-- Month view -->
    <div v-if="viewMode === 'month'" class="calendar-view__doc-pane">
      <!-- Loading / error states -->
      <AppSkeleton
        v-if="store.loading"
        :rows="3"
        :aria-label="t('common.loading')"
        class="calendar-view__skeleton"
      />

      <AppErrorState
        v-else-if="store.error"
        :message="store.error || t('common.loadError')"
        :retry-label="t('common.retry')"
        class="calendar-view__status--error"
        @retry="reloadMonth"
      />

      <!-- Period navigation -->
      <div class="calendar-view__nav">
        <AppIconButton
          icon="chevron-left"
          :size="30"
          variant="ghost"
          :aria-label="t('calendar.prevMonth')"
          @click="prevMonth"
        />

        <span class="calendar-view__nav-title">
          {{ monthLong(currentMonth) }} {{ currentYear }}
        </span>

        <AppIconButton
          icon="chevron-right"
          :size="30"
          variant="ghost"
          :aria-label="t('calendar.nextMonth')"
          @click="nextMonth"
        />

        <button
          v-if="!isCurrentMonth"
          type="button"
          class="calendar-view__today"
          @click="jumpToToday"
        >
          {{ t('calendar.today') }}
        </button>
      </div>

      <!-- Calendar grid -->
      <AppCard v-if="!store.error" class="calendar-view__grid-card">
        <div
          class="calendar-view__grid"
          role="grid"
          :aria-label="t('calendar.gridAriaLabel', { month: monthLong(currentMonth), year: currentYear })"
        >
          <!-- Weekday headers -->
          <div class="calendar-view__weekday-row" role="row">
            <div
              v-for="h in dayHeaders"
              :key="h"
              class="calendar-view__weekday-header"
              role="columnheader"
            >
              {{ h }}
            </div>
          </div>

          <!-- Day cells, chunked into week rows so the grid exposes row /
               gridcell structure. The flat document order across all rows is
               unchanged, so each of the 42 cells stays individually findable. -->
          <div
            v-for="(week, wIdx) in calendarWeeks"
            :key="wIdx"
            class="calendar-view__day-grid"
            role="row"
          >
            <button
              v-for="cell in week"
              :key="cell.idx"
              class="calendar-view__day-cell"
              role="gridcell"
              :class="{
                'calendar-view__day-cell--adjacent': cell.adjacent,
                'calendar-view__day-cell--today': isToday(cell) && !isSelected(cell),
                'calendar-view__day-cell--selected': isSelected(cell),
                'calendar-view__day-cell--default': !cell.adjacent && !isToday(cell) && !isSelected(cell),
                'calendar-view__day-cell--drop': dropTargetDate === cellDateStr(cell) && !cell.adjacent,
              }"
              :disabled="cell.adjacent"
              :tabindex="rovingTabindex(cell)"
              :data-cell-idx="cell.idx"
              :aria-label="cellAriaLabel(cell)"
              :aria-current="isToday(cell) ? 'date' : undefined"
              :aria-pressed="!cell.adjacent && isSelected(cell) ? 'true' : undefined"
              @click="selectDay(cell)"
              @keydown="onDayCellKeydown($event, cell)"
              @dragover.prevent="onDayDragOver($event, cell)"
              @dragleave="onDayDragLeave(cell)"
              @drop.prevent="onDayDrop($event, cell)"
            >
              <span class="calendar-view__day-num">
                {{ cell.day }}
              </span>

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
        </div>
      </AppCard>

      <!-- Assertive announcer for keyboard reschedule + move-mode prompts. -->
      <span class="sr-only" role="status" aria-live="assertive">
        {{ calendarAnnouncement }}
      </span>

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

        <!-- Empty state -->
        <div v-if="agendaEvents.length === 0" class="calendar-view__agenda-empty">
          {{ t('calendar.noEvents') }}
        </div>

        <!-- Event list -->
        <div v-else class="calendar-view__agenda-list">
          <button
            v-for="ev in agendaEvents"
            :key="ev.id"
            type="button"
            class="calendar-view__agenda-item"
            :class="[
              ev.accent ? 'calendar-view__agenda-item--accent' : 'calendar-view__agenda-item--default',
              {
                'calendar-view__agenda-item--dragging': draggingId === ev.id,
                'calendar-view__agenda-item--moving': movingEventId === ev.id
              }
            ]"
            draggable="true"
            :aria-keyshortcuts="'M'"
            :title="t('calendar.rescheduleHint')"
            @click="openEditSheet(ev)"
            @keydown="onAgendaItemKeydown($event, ev)"
            @dragstart="onAgendaDragStart($event, ev)"
            @dragend="onAgendaDragEnd"
          >
            <span
              class="calendar-view__event-dot"
              :class="ev.accent ? 'calendar-view__event-dot--accent' : 'calendar-view__event-dot--muted'"
            />

            <span class="calendar-view__event-meta">
              <span class="calendar-view__event-title">
                {{ ev.title }}
              </span>

              <span v-if="agendaTimeFor(ev) || ev.location" class="calendar-view__event-sub">
                <span v-if="agendaTimeFor(ev)">
                  {{ agendaTimeFor(ev) }}
                </span>

                <span v-if="agendaTimeFor(ev) && ev.location" class="calendar-view__event-sep">
                  ·
                </span>

                <span v-if="ev.location">
                  {{ ev.location }}
                </span>
              </span>
            </span>

            <WrenOriginBadge ref-type="calendar_event" :ref-id="ev.id" />
          </button>
        </div>
      </template>
    </div>

    <!-- Year view -->
    <div v-if="viewMode === 'year'" class="calendar-view__doc-pane">
      <div class="calendar-view__nav">
        <AppIconButton
          icon="chevron-left"
          :size="30"
          variant="ghost"
          :aria-label="t('calendar.prevYear')"
          @click="prevYear"
        />

        <span class="calendar-view__nav-title">
          {{ currentYear }}
        </span>

        <AppIconButton
          icon="chevron-right"
          :size="30"
          variant="ghost"
          :aria-label="t('calendar.nextYear')"
          @click="nextYear"
        />

        <button
          v-if="currentYear !== today.getFullYear()"
          type="button"
          class="calendar-view__today"
          @click="jumpToToday"
        >
          {{ t('calendar.thisYear') }}
        </button>
      </div>

      <div class="calendar-view__year-grid">
        <button
          v-for="m in 12"
          :key="m"
          type="button"
          class="calendar-view__year-month"
          :aria-label="yearMonthAria(m - 1)"
          @click="openMonthFromYear(m - 1)"
        >
          <header class="calendar-view__year-month-header" aria-hidden="true">
            <span class="calendar-view__year-month-title">
              {{ monthLong(m - 1) }}
            </span>

            <span v-if="yearMonthCount(m - 1) > 0" class="calendar-view__year-month-count">
              {{ yearMonthCount(m - 1) }}
            </span>
          </header>

          <div class="calendar-view__year-weekday-row" aria-hidden="true">
            <span
              v-for="(h, hi) in dayHeadersNarrow"
              :key="hi"
              class="calendar-view__year-weekday"
            >
              {{ h }}
            </span>
          </div>

          <div class="calendar-view__year-day-grid" aria-hidden="true">
            <span
              v-for="(cell, ci) in calendarDaysFor(currentYear, m - 1)"
              :key="ci"
              class="calendar-view__year-day"
              :class="{
                'calendar-view__year-day--adjacent': cell.adjacent,
                'calendar-view__year-day--today': isTodayCell(cell, m - 1, currentYear),
                'calendar-view__year-day--has-event': !cell.adjacent && yearHasEventOn(cell.day, m - 1, currentYear)
              }"
            >
              {{ cell.day }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Event create/edit modal -->
    <CalendarEventSheet
      :open="sheetOpen"
      :mode="sheetMode"
      :event="sheetEvent"
      :date="sheetDate"
      @close="closeSheet"
    />

    <!-- Task detail modal — opened from the week view when a today-task block
         is clicked. Routes saves/deletes through projects.store and reloads
         the today store so the calendar reflects edits. -->
    <TaskDetailModal
      v-model="taskDetailOpen"
      :task="activeTask"
      :columns="[]"
      :busy="projectsStore.saving"
      @save="onTaskSave"
      @delete-task="onTaskDelete"
      @add-subtask="onAddSubtask"
      @update-subtask="onUpdateSubtask"
      @delete-subtask="onDeleteSubtask"
    />
  </div>
</template>

<script>
/**
 * CalendarView — month grid, week time-blocks, and a year-at-a-glance view.
 * The agenda panel under the month grid lists events for the selected day and
 * lets the user click in to edit. The view-mode segmented control switches
 * between month / week / year. Year view uses the calendar store's `loadYear`
 * action which fans out 12 month fetches and merges the results.
 */
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalendarStore } from '@/stores/calendar.store.js'
import { useTodayStore } from '@/stores/today.store.js'
import { useProjectsStore } from '@/stores/projects.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppIconButton from '@/components/ui/AppIconButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSegmentedControl from '@/components/ui/AppSegmentedControl.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { captureException } from '@/utils/sentry.js'
import TimeBlockView from '@/components/calendar/TimeBlockView.vue'
import CalendarEventSheet from '@/components/calendar/CalendarEventSheet.vue'
import TaskDetailModal from '@/components/tasks/TaskDetailModal.vue'
import WrenOriginBadge from '@/components/wren/WrenOriginBadge.vue'
import { toLocalISODate, monthKey, formatTime } from '@/utils/date.js'
import { useWeekdayHeaders } from '@/composables/useWeekdayHeaders.js'

export default {
  name: 'CalendarView',
  components: {
    AppScreenHeading,
    AppIconButton,
    AppCard,
    AppButton,
    AppSegmentedControl,
    AppSkeleton,
    AppErrorState,
    TimeBlockView,
    CalendarEventSheet,
    TaskDetailModal,
    WrenOriginBadge
  },
  setup() {
    // -- State --
    const store = useCalendarStore()
    const todayStore = useTodayStore()
    const projectsStore = useProjectsStore()
    const { t } = useI18n()
    const viewMode = ref('month')

    // Task edit modal (opened from the week view when a today-task block is
    // clicked). Local id+snapshot pattern mirrors KanbanView so the modal
    // contents survive a today.store refresh mid-edit.
    const taskDetailOpen = ref(false)
    const activeTaskId = ref(null)
    const activeTaskSnapshot = ref(null)

    const activeTask = computed(() => {
      if (!activeTaskId.value) return null
      const fresh = (todayStore.view?.tasks ?? []).find(t => t.id === activeTaskId.value)
      return fresh ?? activeTaskSnapshot.value
    })

    const viewOptions = computed(() => [
      { value: 'month', label: t('calendar.viewMonth') },
      { value: 'week', label: t('calendar.viewWeek') },
      { value: 'year', label: t('calendar.viewYear') }
    ])

    // Event modal — single instance for both create + edit.
    const sheetOpen = ref(false)
    const sheetMode = ref('create')
    const sheetEvent = ref(null)
    const sheetDate = ref(null)

    const today = new Date()
    const currentYear = ref(today.getFullYear())
    const currentMonth = ref(today.getMonth())
    const selectedDay = ref(today.getDate())
    const draggingId = ref(null)
    const dropTargetDate = ref(null)

    // Keyboard reschedule: id of the event armed for a "move to another day"
    // gesture (entered by pressing M on a focused agenda item). While armed,
    // Enter on a focused day cell reschedules the event to that day. Escape or
    // a successful move disarms.
    const movingEventId = ref(null)
    // Assertive screen-reader status for keyboard reschedule + move prompts.
    const calendarAnnouncement = ref('')

    // -- Computed --

    const { weekdayHeaders: dayHeaders } = useWeekdayHeaders()

    /** Single-letter weekday headers for the dense year view. */
    const dayHeadersNarrow = computed(() => dayHeaders.value.map(h => h.charAt(0)))

    /** True when the displayed month is the user's "real" current month. */
    const isCurrentMonth = computed(
      () => currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear()
    )

    /** Heading title varies by view: month name (month), 'This week' (week),
     *  the bare year (year). The emphasis suffix carries the period dot. */
    const headingTitle = computed(() => {
      if (viewMode.value === 'year') return String(currentYear.value)
      if (viewMode.value === 'week') return t('calendar.thisWeek')
      return monthLong(currentMonth.value)
    })

    const headingEmphasis = computed(() => {
      if (viewMode.value === 'year') return '.'
      if (viewMode.value === 'week') return ''
      return `${currentYear.value}.`
    })

    /** 6×7 cell grid for the displayed month — with leading/trailing
     *  adjacent-month days kept around so the grid is always full. */
    const calendarDays = computed(() => buildMonthCells(currentYear.value, currentMonth.value))

    /** `calendarDays` chunked into weeks of 7, each cell tagged with its flat
     *  index so the grid can render row/gridcell structure while keeping the
     *  cells in their original document order. */
    const calendarWeeks = computed(() => {
      const cells = calendarDays.value.map((cell, idx) => ({ ...cell, idx }))
      const weeks = []

      for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7))
      }

      return weeks
    })

    /** Pre-computed map of YYYY-MM-DD → Event[] for the current month's events. */
    const eventsByDay = computed(() => {
      const map = new Map()

      for (const ev of store.events) {
        // The event date can come back as either a YYYY-MM-DD string or a
        // full ISO timestamp (mocks vs Mongo). Normalise once here so every
        // day-cell lookup uses the same key shape.
        const key = String(ev.date).slice(0, 10)
        const list = map.get(key)

        if (list) {
          list.push(ev)
        } else {
          map.set(key, [ev])
        }
      }

      return map
    })

    /** Events for the currently selected day. */
    const agendaEvents = computed(() => {
      if (!selectedDay.value) return []
      const dayStr = toLocalISODate(new Date(currentYear.value, currentMonth.value, selectedDay.value))
      return (eventsByDay.value.get(dayStr) ?? []).slice().sort(compareEventsForAgenda)
    })

    const agendaLabel = computed(() => {
      if (!selectedDay.value) return ''
      const date = new Date(currentYear.value, currentMonth.value, selectedDay.value)
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    })

    // -- Lifecycle --
    onMounted(() => {
      store.load(monthKey(currentYear.value, currentMonth.value))
    })

    // Refetch when the view mode switches to year so the year grid sees every
    // month, not only the most-recently-viewed one. Month view stays on the
    // already-loaded month.
    watch(viewMode, mode => {
      if (mode === 'year') {
        store.loadYear(currentYear.value)
      } else if (mode === 'month') {
        store.load(monthKey(currentYear.value, currentMonth.value))
      }
    })

    return {
      t,
      today,
      dayHeaders,
      dayHeadersNarrow,
      monthLong,
      store,
      projectsStore,
      viewMode,
      viewOptions,
      sheetOpen,
      sheetMode,
      sheetEvent,
      sheetDate,
      openCreateSheet,
      openEditSheet,
      closeSheet,
      taskDetailOpen,
      activeTask,
      openTaskDetail,
      onTaskSave,
      onTaskDelete,
      onAddSubtask,
      onUpdateSubtask,
      onDeleteSubtask,
      currentYear,
      currentMonth,
      selectedDay,
      calendarDays,
      calendarWeeks,
      movingEventId,
      calendarAnnouncement,
      rovingTabindex,
      onDayCellKeydown,
      onAgendaItemKeydown,
      yearMonthAria,
      eventsByDay,
      agendaEvents,
      agendaLabel,
      agendaTimeFor,
      headingTitle,
      headingEmphasis,
      isCurrentMonth,
      reloadMonth,
      prevMonth,
      nextMonth,
      prevYear,
      nextYear,
      jumpToToday,
      isToday,
      isSelected,
      eventsForDay,
      selectDay,
      cellAriaLabel,
      cellDateStr,
      draggingId,
      dropTargetDate,
      onAgendaDragStart,
      onAgendaDragEnd,
      onDayDragOver,
      onDayDragLeave,
      onDayDrop,
      calendarDaysFor,
      isTodayCell,
      yearHasEventOn,
      yearMonthCount,
      openMonthFromYear
    }

    // -- Function definitions --

    function openCreateSheet(seedDate = null) {
      sheetMode.value = 'create'
      sheetEvent.value = null

      sheetDate.value =
        seedDate ?? formatDate(selectedDay.value, currentYear.value, currentMonth.value)

      sheetOpen.value = true
    }

    function openEditSheet(ev) {
      sheetMode.value = 'edit'
      sheetEvent.value = ev
      sheetDate.value = ev.date
      sheetOpen.value = true
    }

    function closeSheet() {
      sheetOpen.value = false
      sheetEvent.value = null
      sheetDate.value = null
    }

    /** Open the task-detail modal for a today-store task clicked in the week view. */
    function openTaskDetail(task) {
      if (!task) return
      activeTaskId.value = task.id
      // Snapshot the task in case today.store reloads and the row briefly
      // disappears — the modal continues to render against the snapshot.
      activeTaskSnapshot.value = { ...task }
      taskDetailOpen.value = true
    }

    /**
     * Persist task edits via projects.store.updateTask, then reload today so
     * the week view picks up the change. Closes the modal on success; leaves
     * it open on failure so the user can retry.
     */
    async function onTaskSave(updates) {
      if (!activeTaskId.value || Object.keys(updates).length === 0) {
        taskDetailOpen.value = false
        return
      }

      try {
        await projectsStore.updateTask(activeTaskId.value, updates)
        await todayStore.load(todayStore.view?.date)
        taskDetailOpen.value = false
      } catch {
        /* projects.store surfaces the toast */
      }
    }

    /** Delete the task via projects.store, then refresh today. */
    async function onTaskDelete() {
      if (!activeTaskId.value) return

      try {
        await projectsStore.deleteTask(activeTaskId.value)
        await todayStore.load(todayStore.view?.date)
        taskDetailOpen.value = false
      } catch {
        /* projects.store surfaces the toast */
      }
    }

    function onAddSubtask({ text }) {
      if (!activeTaskId.value) return
      // Toasted by the store; swallow the rejection cleanly and report.
      projectsStore.addSubtask(activeTaskId.value, text).catch(captureException)
    }

    function onUpdateSubtask({ subtaskId, ...patch }) {
      if (!activeTaskId.value) return
      // Toasted by the store; swallow the rejection cleanly and report.
      projectsStore.updateSubtask(activeTaskId.value, subtaskId, patch).catch(captureException)
    }

    function onDeleteSubtask({ subtaskId }) {
      if (!activeTaskId.value) return
      // Toasted by the store; swallow the rejection cleanly and report.
      projectsStore.deleteSubtask(activeTaskId.value, subtaskId).catch(captureException)
    }

    function formatDate(day, year, month) {
      if (!day) return toLocalISODate(new Date())
      return toLocalISODate(new Date(year, month, day))
    }

    function monthLong(month) {
      const date = new Date(2024, month, 1)
      return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date)
    }

    /** Re-issue the load for the currently displayed month (error-state retry). */
    function reloadMonth() {
      store.load(monthKey(currentYear.value, currentMonth.value))
    }

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

    function prevYear() {
      currentYear.value--
      store.loadYear(currentYear.value)
    }

    function nextYear() {
      currentYear.value++
      store.loadYear(currentYear.value)
    }

    function jumpToToday() {
      currentYear.value = today.getFullYear()
      currentMonth.value = today.getMonth()
      selectedDay.value = today.getDate()

      if (viewMode.value === 'year') {
        store.loadYear(currentYear.value)
      } else {
        store.load(monthKey(currentYear.value, currentMonth.value))
      }
    }

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

    function eventsForDay(day, adjacent) {
      if (adjacent) return []
      const dayStr = toLocalISODate(new Date(currentYear.value, currentMonth.value, day))
      return (eventsByDay.value.get(dayStr) ?? []).slice(0, 3)
    }

    function selectDay(cell) {
      if (cell.adjacent) return
      selectedDay.value = cell.day
    }

    function cellAriaLabel(cell) {
      const year = currentYear.value
      const month = cell.adjacent ? cell.month : currentMonth.value
      const date = new Date(year, month, cell.day)
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }

    function cellDateStr(cell) {
      if (cell.adjacent) return null
      return toLocalISODate(new Date(currentYear.value, currentMonth.value, cell.day))
    }

    // -- Keyboard grid navigation + reschedule --

    /**
     * Roving tabindex: exactly one day cell is in the tab order at a time so
     * Tab reaches the grid once and Arrow keys roam inside it. The selected
     * day wins; otherwise today; otherwise the first non-adjacent day.
     */
    function rovingTabindex(cell) {
      if (cell.adjacent) return -1
      const sel = selectedDay.value
      if (sel) return cell.day === sel ? 0 : -1
      if (isToday(cell)) return 0
      // No selection and not the today month → first day of the month is the
      // single tab stop.
      return cell.day === 1 ? 0 : -1
    }

    /** Focus the day cell with the given 1-based day number after a re-render. */
    function focusDayCell(day) {
      nextTick(() => {
        const cells = document.querySelectorAll('button.calendar-view__day-cell')

        for (const el of cells) {
          if (
            el instanceof HTMLElement &&
            !el.hasAttribute('disabled') &&
            el.querySelector('.calendar-view__day-num')?.textContent?.trim() === String(day)
          ) {
            el.focus()
            return
          }
        }
      })
    }

    /**
     * Grid keyboard model on the month day cells:
     *   - Arrow keys move by 1 day / 1 week and roam into adjacent months.
     *   - Home / End jump to the first / last day of the month.
     *   - PageUp / PageDown change month.
     *   - Enter / Space select — OR, when an event is armed for move (the user
     *     pressed M on an agenda item), reschedule the armed event to this day.
     *   - Escape cancels an armed move.
     */
    function onDayCellKeydown(e, cell) {
      // Resolve an armed reschedule first.
      if (movingEventId.value && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) {
        e.preventDefault()
        confirmKeyboardReschedule(cell)
        return
      }

      if (e.key === 'Escape' && movingEventId.value) {
        movingEventId.value = null
        calendarAnnouncement.value = ''
        return
      }

      const day = cell.day
      let nextDay = null

      switch (e.key) {
        case 'ArrowLeft':
          nextDay = day - 1
          break
        case 'ArrowRight':
          nextDay = day + 1
          break
        case 'ArrowUp':
          nextDay = day - 7
          break
        case 'ArrowDown':
          nextDay = day + 7
          break
        case 'Home':
          nextDay = 1
          break
        case 'End':
          nextDay = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
          break
        case 'PageUp':
          e.preventDefault()
          prevMonth()
          return
        case 'PageDown':
          e.preventDefault()
          nextMonth()
          return
        case 'Enter':
        case ' ':
        case 'Spacebar':
          // Plain selection (no armed move) — let the click handler logic run
          // by selecting here and preventing the default scroll on Space.
          e.preventDefault()
          if (!cell.adjacent) selectDay(cell)
          return
        default:
          return
      }

      e.preventDefault()
      const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

      // Roam across the month boundary when stepping past either edge.
      if (nextDay < 1) {
        prevMonth()

        nextTick(() => {
          const prevDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
          selectedDay.value = prevDays
          focusDayCell(prevDays)
        })

        return
      }

      if (nextDay > daysInMonth) {
        nextMonth()

        nextTick(() => {
          selectedDay.value = 1
          focusDayCell(1)
        })

        return
      }

      selectedDay.value = nextDay
      focusDayCell(nextDay)
    }

    /**
     * Agenda item keyboard handler: M arms the event for a keyboard move. The
     * user then arrows across the day grid and presses Enter on the target day
     * to reschedule. We focus the currently-selected day cell so the grid is
     * ready for arrow navigation.
     */
    function onAgendaItemKeydown(e, ev) {
      if (e.key !== 'm' && e.key !== 'M') return
      e.preventDefault()
      movingEventId.value = ev.id
      calendarAnnouncement.value = t('calendar.moveEventAria', { title: ev.title })
      focusDayCell(selectedDay.value ?? today.getDate())
    }

    /**
     * Commit an armed keyboard reschedule onto `cell`. Mirrors the drop path:
     * routes through the existing `store.rescheduleEvent` action, then selects
     * and announces the new day. No-op for adjacent cells or same-day targets.
     */
    async function confirmKeyboardReschedule(cell) {
      const id = movingEventId.value
      if (!id || cell.adjacent) return
      const dateStr = cellDateStr(cell)
      const existing = store.events.find(e => e.id === id)
      movingEventId.value = null
      if (!existing || existing.date === dateStr) return

      try {
        await store.rescheduleEvent(id, dateStr)
        selectedDay.value = cell.day

        calendarAnnouncement.value = t('calendar.rescheduledAnnouncement', {
          title: existing.title,
          date: cellAriaLabel(cell)
        })
      } catch {
        /* toast in store */
      }
    }

    /** Accessible name for a year-view mini-month button (month + event count). */
    function yearMonthAria(month) {
      return t('calendar.yearMonthAria', { month: monthLong(month), count: yearMonthCount(month) })
    }

    // -- Drag and drop --

    function onAgendaDragStart(e, ev) {
      draggingId.value = ev.id
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', ev.id)
    }

    function onAgendaDragEnd() {
      draggingId.value = null
      dropTargetDate.value = null
    }

    function onDayDragOver(e, cell) {
      if (cell.adjacent || !draggingId.value) return
      e.dataTransfer.dropEffect = 'move'
      dropTargetDate.value = cellDateStr(cell)
    }

    function onDayDragLeave(cell) {
      const target = cellDateStr(cell)
      if (dropTargetDate.value === target) dropTargetDate.value = null
    }

    async function onDayDrop(e, cell) {
      const id = e.dataTransfer.getData('text/plain')
      dropTargetDate.value = null
      draggingId.value = null
      if (!id || cell.adjacent) return
      const dateStr = cellDateStr(cell)
      const existing = store.events.find(ev => ev.id === id)
      if (!existing || existing.date === dateStr) return

      try {
        await store.rescheduleEvent(id, dateStr)
        selectedDay.value = cell.day
      } catch {
        /* toast in store */
      }
    }

    // -- Year view helpers --

    /** Build the same 6×7 cell shape as the month grid for an arbitrary
     *  year+month. Used by the year view's 12 mini-grids. */
    function buildMonthCells(year, month) {
      const firstDow = new Date(year, month, 1).getDay()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const daysInPrevMonth = new Date(year, month, 0).getDate()
      const cells = []

      for (let i = firstDow - 1; i >= 0; i--) {
        cells.push({
          day: daysInPrevMonth - i,
          adjacent: true,
          month: month - 1 < 0 ? 11 : month - 1
        })
      }

      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, adjacent: false, month })
      }

      const trailing = 42 - cells.length

      for (let d = 1; d <= trailing; d++) {
        cells.push({ day: d, adjacent: true, month: month + 1 > 11 ? 0 : month + 1 })
      }

      return cells
    }

    function calendarDaysFor(year, month) {
      return buildMonthCells(year, month)
    }

    function isTodayCell(cell, month, year) {
      if (cell.adjacent) return false
      return (
        cell.day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      )
    }

    function yearHasEventOn(day, month, year) {
      const key = toLocalISODate(new Date(year, month, day))
      return eventsByDay.value.has(key)
    }

    function yearMonthCount(month) {
      let count = 0

      for (const ev of store.events) {
        const d = new Date(String(ev.date))
        if (d.getFullYear() === currentYear.value && d.getMonth() === month) count++
      }

      return count
    }

    function openMonthFromYear(month) {
      currentMonth.value = month
      viewMode.value = 'month'
      // viewMode watcher reloads the month for us.
    }

    /** Format the time range to render under an agenda event title. */
    function agendaTimeFor(ev) {
      if (ev.allDay) return t('calendar.allDay')
      const start = formatTime(ev.startTime)
      const end = formatTime(ev.endTime)
      if (start && end) return `${start} – ${end}`
      return start || ''
    }

    /** Sort agenda items so all-day events render first, then by start
     *  time. */
    function compareEventsForAgenda(a, b) {
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      const aStart = a.startTime ?? ''
      const bStart = b.startTime ?? ''
      if (aStart < bStart) return -1
      if (aStart > bStart) return 1
      return 0
    }
  }
}
</script>

<style lang="scss" scoped>
.calendar-view {
  // Fill the route's flex column so the week view can confine its hour grid
  // to the viewport (only the hours scroll). Month/year keep their natural
  // document flow inside `__doc-pane`, which scrolls when content exceeds
  // the viewport so the heading + toolbar still stay put.
  @apply flex h-full min-h-0 flex-col;

  &__toolbar {
    @apply mb-5 flex shrink-0 flex-wrap items-center justify-between gap-3;
  }

  &__week-pane {
    @apply flex min-h-0 flex-1 flex-col;
  }

  &__doc-pane {
    @apply min-h-0 flex-1 overflow-y-auto;
  }

  &__mode {
    @apply shrink-0;
  }

  &__new-event {
    @apply shrink-0;
  }

  &__status {
    @apply mb-2 text-[13px] text-muted;

    &--error {
      @apply text-bad;
    }
  }

  &__nav {
    @apply mb-4 flex items-center gap-2;
  }

  &__nav-title {
    @apply flex-1 text-center font-serif text-[22px] italic text-ink;
  }

  &__today {
    @apply ml-1 inline-flex shrink-0 cursor-pointer items-center rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[12px] font-medium text-ink hover:bg-paper-3;
  }

  &__grid-card {
    @apply p-3;
  }

  &__grid {
    @apply flex flex-col;
  }

  &__weekday-row {
    @apply grid grid-cols-7 gap-0.5 pb-1.5;
  }

  &__weekday-header {
    @apply text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted;
  }

  &__day-grid {
    @apply grid grid-cols-7 gap-0.5;
  }

  &__day-cell {
    @apply relative flex min-h-[58px] flex-col items-center justify-between rounded-md px-1 py-1.5 text-[12.5px] transition-colors;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--adjacent {
      @apply text-muted opacity-50;
    }

    &--today {
      @apply bg-accent text-accent-ink font-medium;
    }

    &--selected {
      @apply bg-ink text-paper font-medium;
    }

    &--default {
      @apply text-ink hover:bg-paper-3;
    }

    &--drop {
      @apply ring-2 ring-accent ring-offset-1;
    }
  }

  &__day-num {
    @apply text-[12.5px] leading-none;
  }

  &__dots {
    @apply flex gap-0.5;
    min-height: 6px;
  }

  &__dot {
    @apply h-1.5 w-1.5 rounded-full;

    &--accent {
      @apply bg-current opacity-90;
    }

    &--muted {
      @apply bg-current opacity-40;
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

  &__agenda-empty {
    @apply rounded-md border border-dashed border-rule-soft bg-paper-2 px-4 py-5 text-center text-[13px] text-muted;
  }

  &__agenda-list {
    @apply flex flex-col gap-1.5;
  }

  &__agenda-item {
    @apply flex w-full cursor-grab items-start gap-3 rounded-md border border-rule-soft bg-paper-2 px-3.5 py-3 text-left transition-colors hover:bg-paper-3;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &:active {
      @apply cursor-grabbing;
    }

    &--accent {
      @apply border-l-2 border-l-accent;
    }

    &--dragging {
      @apply opacity-40;
    }

    // Armed for a keyboard "move to another day" gesture — a visible ring so
    // sighted keyboard users see which event is being moved.
    &--moving {
      @apply ring-2 ring-accent ring-offset-1;
    }
  }

  &__event-meta {
    @apply flex min-w-0 flex-1 flex-col gap-0.5;
  }

  &__event-dot {
    @apply mt-1.5 h-2 w-2 shrink-0 rounded-full;

    &--accent {
      @apply bg-accent;
    }

    &--muted {
      @apply bg-muted;
    }
  }

  &__event-title {
    @apply font-mono text-[13px] text-ink;
  }

  &__event-sub {
    @apply flex flex-wrap items-center gap-1.5 text-[12px] text-muted;
  }

  &__event-sep {
    @apply text-muted;
  }

  // -- Year view --

  &__year-grid {
    @apply grid grid-cols-1 gap-4;

    @media (min-width: 640px) {
      @apply grid-cols-2;
    }

    @media (min-width: 960px) {
      @apply grid-cols-3;
    }

    @media (min-width: 1280px) {
      @apply grid-cols-4;
    }
  }

  &__year-month {
    @apply flex w-full flex-col gap-2 rounded-md border border-rule-soft bg-paper-2 px-3 py-3 text-left transition-colors hover:bg-paper-3;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__year-month-header {
    @apply flex items-baseline justify-between;
  }

  &__year-month-title {
    @apply font-serif text-[15px] text-ink;
  }

  &__year-month-count {
    @apply font-mono text-[10px] uppercase tracking-[0.1em] text-muted;
  }

  &__year-weekday-row {
    @apply grid grid-cols-7;
  }

  &__year-weekday {
    @apply text-center font-mono text-[9px] uppercase tracking-[0.08em] text-muted;
  }

  &__year-day-grid {
    @apply grid grid-cols-7 gap-px;
  }

  &__year-day {
    @apply flex h-5 items-center justify-center rounded-sm text-[10px] text-ink;

    &--adjacent {
      @apply text-muted opacity-40;
    }

    &--has-event {
      @apply font-semibold text-accent;
    }

    &--today {
      @apply bg-accent text-accent-ink;
    }
  }
}
</style>
