import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useAuthStore } from './stores/auth.store'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)

const authStore = useAuthStore()

async function bootstrap() {
  const hasHint = document.cookie.includes('ayp_refresh_hint')
  if (hasHint) {
    await authStore.tryRestoreSession()
  }

  app.use(router)
  app.mount('#app')
}

bootstrap()
