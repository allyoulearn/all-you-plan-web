<template>
  <div class="grid min-h-screen place-items-center bg-paper px-4">
    <div class="w-full max-w-md">
      <p class="mb-6 text-center font-serif text-[28px] italic text-ink">
        all you <em>plan</em>
      </p>
      <div class="rounded-md border border-rule-soft bg-paper-2 p-8 shadow-sm">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'AuthLayout' }
</script>
