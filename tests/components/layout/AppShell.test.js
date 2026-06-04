import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import AppShell from '@/components/layout/AppShell.vue'
import en from '@/i18n/locales/en.json'

// useWrenSync touches several stores via Pinia; useCloseDrawersOnRouteChange
// reads from vue-router. Both are exercised by the dedicated composable
// tests — stub them out here so the shell smoke tests stay focused on layout.
vi.mock('@/composables/useWrenSync.js', () => ({ useWrenSync: () => {} }))

vi.mock('@/composables/useLayout.js', () => ({
  // Real refs (not plain {value} objects) so the template auto-unwraps them
  // when binding to child components — otherwise the raw Ref object is passed
  // and child prop type-checks fail ("Boolean got Object").
  useLayout: () => ({
    sidebarOpen: ref(false),
    wrenOpen: ref(false),
    wrenCollapsed: ref(false),
    closeAll: () => {}
  }),
  useCloseDrawersOnRouteChange: () => {}
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('AppShell', () => {
  function mountShell() {
    return mount(AppShell, {
      global: {
        plugins: [i18n],
        // `$route.meta.fullWidth` is read in the template (`AppShell.vue:10`)
        // to toggle a layout class. The shell doesn't otherwise touch the
        // router — RouterView is stubbed below — so a minimal $route mock
        // keeps these smoke tests focused on layout without pulling in
        // vue-router itself.
        mocks: {
          $route: { meta: {} }
        },
        stubs: {
          RouterView: true,
          AppSidebar: true,
          AppTopBar: true,
          // AppFooter holds a <RouterLink> to the legal pages; without a router
          // installed it throws at setup (router.resolve is undefined). It's
          // exercised by its own/route tests, so stub it here — mirroring how
          // AuthLayout.test.js stubs AppFooter — to keep these layout smoke
          // tests free of vue-router.
          AppFooter: true,
          WrenPanel: true,
          CaptureOverlay: true,
          SearchOverlay: true,
          // Renders when VITE_USE_MOCKS=true (it is, in this env). The toast
          // calls useRouter() at setup — stub it out so the shell tests don't
          // have to install vue-router just to satisfy that injection.
          WrenMockNotificationToast: true
        }
      }
    })
  }

  it('renders the main content region', () => {
    const wrapper = mountShell()
    expect(wrapper.find('main').exists()).toBe(true)
  })

  it('renders the root app-shell element', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.app-shell').exists()).toBe(true)
  })

  it('renders a stubbed AppSidebar', () => {
    const wrapper = mountShell()
    // @vue/test-utils stubs render as PascalCase-stub or kebab-stub depending on version
    // use the component by finding an aside or check the html
    expect(wrapper.html()).toContain('app-sidebar')
  })

  it('renders a stubbed AppTopBar inside main', () => {
    const wrapper = mountShell()
    expect(wrapper.html()).toContain('app-top-bar')
  })

  it('renders a stubbed WrenPanel', () => {
    const wrapper = mountShell()
    expect(wrapper.html()).toContain('wren-panel')
  })

  it('renders the content slot wrapper', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.app-shell__content').exists()).toBe(true)
  })

  it('renders RouterView inside the content area', () => {
    const wrapper = mountShell()
    const content = wrapper.find('.app-shell__content')
    expect(content.html()).toContain('router-view-stub')
  })

  it('has the app-shell__main class on the main element', () => {
    const wrapper = mountShell()
    expect(wrapper.find('main').classes()).toContain('app-shell__main')
  })
})
