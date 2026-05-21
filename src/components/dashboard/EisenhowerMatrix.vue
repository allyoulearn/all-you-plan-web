<template>
  <div class="eisenhower-matrix">
    <!-- Do quadrant (top-left) -->
    <QuadrantCard
      quadrant="do"
      :tasks="matrix.do || []"
      @select-task="(id) => $emit('select-task', id)"
      @complete-task="(id) => $emit('complete-task', id)"
    />

    <!-- Schedule quadrant (top-right) -->
    <QuadrantCard
      quadrant="schedule"
      :tasks="matrix.schedule || []"
      @select-task="(id) => $emit('select-task', id)"
      @complete-task="(id) => $emit('complete-task', id)"
    />

    <!-- Delegate quadrant (bottom-left) -->
    <QuadrantCard
      quadrant="delegate"
      :tasks="matrix.delegate || []"
      @select-task="(id) => $emit('select-task', id)"
      @complete-task="(id) => $emit('complete-task', id)"
    />

    <!-- Drop quadrant (bottom-right) -->
    <QuadrantCard
      quadrant="drop"
      :tasks="matrix.drop || []"
      @select-task="(id) => $emit('select-task', id)"
      @complete-task="(id) => $emit('complete-task', id)"
    />
  </div>
</template>

<script>
import QuadrantCard from '@/components/dashboard/QuadrantCard.vue'

export default {
  name: 'EisenhowerMatrix',
  components: { QuadrantCard },
  props: {
    /** Matrix object with do/schedule/delegate/drop task arrays */
    matrix: {
      type: Object,
      default: () => ({ do: [], schedule: [], delegate: [], drop: [] }),
    },
  },
  emits: ['select-task', 'complete-task'],
  setup() {
    return {}
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.eisenhower-matrix {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  // ── Responsive: single column on mobile ──
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}
</style>
