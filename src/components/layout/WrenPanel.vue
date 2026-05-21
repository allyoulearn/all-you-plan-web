<script setup>
import Icon from '@/components/ui/Icon.vue'
</script>

<template>
  <aside class="flex h-screen flex-col overflow-hidden border-l border-rule-soft bg-paper">
    <div class="flex items-center gap-3 border-b border-rule-soft px-[22px] py-[18px]">
      <span class="grid h-9 w-9 place-items-center rounded-pill bg-accent font-serif text-[20px] italic text-accent-ink">
        W
      </span>
      <div>
        <p class="font-serif text-[22px] italic leading-none text-ink">Wren</p>
        <p class="mt-0.5 text-[12px] text-muted">Your coach</p>
      </div>
      <span class="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted">
        <span class="h-[7px] w-[7px] rounded-pill bg-ok" />
        live
      </span>
    </div>

    <div class="flex flex-1 items-center justify-center px-6 text-center">
      <p class="text-[13px] text-muted">Wren wakes up in sub-project 5.</p>
    </div>

    <div class="border-t border-rule-soft p-4">
      <div class="flex items-center gap-2 rounded-pill border border-rule-soft bg-paper-2 py-1.5 pl-4 pr-1.5">
        <input
          disabled
          placeholder="Tell Wren anything…"
          class="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
        />
        <span class="rounded-pill bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-paper">
          SEND
        </span>
      </div>
    </div>
  </aside>
</template>
