import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useAuthStore } from './stores/auth.store'
import { initTheme } from './composables/useTheme.js'
import './assets/tokens.css'
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

  initTheme()
  app.use(router)
  app.mount('#app')
}

bootstrap()
