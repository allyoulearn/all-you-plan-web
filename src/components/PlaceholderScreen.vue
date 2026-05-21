<script setup>
import ScreenHeading from '@/components/ui/ScreenHeading.vue'
import Card from '@/components/ui/Card.vue'

defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  emphasis: { type: String, default: '' },
  note: { type: String, default: '' },
})
</script>

<template>
  <div>
    <ScreenHeading :eyebrow="eyebrow" :title="title" :emphasis="emphasis" />
    <Card>
      <p class="text-[15px] text-ink-2">{{ note }}</p>
    </Card>
  </div>
</template>
