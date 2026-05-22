<template>
  <Toaster position="top-right" />

  <RouterView />
</template>

<script>
/** App — root application component that mounts the toast provider and the router outlet. */
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'

export default {
  name: 'App',
  components: { RouterView, Toaster }
}
</script>
