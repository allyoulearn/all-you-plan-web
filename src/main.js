/**
 * Application entry point.
 * Creates the Vue app, installs plugins (Pinia, i18n, router), attempts to
 * restore a previous auth session from the refresh cookie hint, initialises
 * the theme, then mounts the app.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useAuthStore } from './stores/auth.store.js'
import { initTheme } from './composables/useTheme.js'
import './assets/tokens.css'
import './assets/main.css'

// -- Setup --

const app = createApp(App)
app.use(createPinia())
app.use(i18n)

const authStore = useAuthStore()

// -- Bootstrap --

/**
 * Initialise auth state, theme, and mount the app.
 * Awaits session restore when the `ayp_refresh_hint` cookie is present so
 * that the router guards have an accurate auth state on first navigation.
 * @returns {Promise<void>}
 */
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
