<template>
  <div>
    <!-- Grid: 26 columns, each column is 7 cells tall -->
    <div class="flex gap-0.5">
      <div
        v-for="col in 26"
        :key="col"
        class="flex flex-col gap-0.5"
      >
        <div
          v-for="row in 7"
          :key="row"
          class="h-3 w-3 rounded-[2px]"
          :class="intensityClass(values[(col - 1) * 7 + (row - 1)] ?? 0)"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-2.5 flex items-center gap-1.5">
      <span class="font-mono text-[10px] text-muted">
        less
      </span>

      <div class="h-2.5 w-2.5 rounded-[2px] bg-paper-3" />

      <div class="h-2.5 w-2.5 rounded-[2px] bg-accent/[0.25]" />

      <div class="h-2.5 w-2.5 rounded-[2px] bg-accent/[0.55]" />

      <div class="h-2.5 w-2.5 rounded-[2px] bg-accent" />

      <span class="font-mono text-[10px] text-muted">
        more
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  values: { type: Array, required: true },
})

// 182 values arranged as 26 columns x 7 rows
// values[week * 7 + dayOfWeek]

function intensityClass(v) {
  if (v === 0) return 'bg-paper-3'
  if (v === 1) return 'bg-accent/[0.25]'
  if (v === 2) return 'bg-accent/[0.55]'
  return 'bg-accent'
}
</script>
