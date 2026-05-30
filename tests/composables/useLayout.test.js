import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useLayout, useCloseDrawersOnRouteChange } from '@/composables/useLayout'

/* eslint-disable vue/one-component-per-file -- This test file declares two
 * tiny host components inline to exercise different route-change scenarios.
 * Each scenario is a self-contained describe block; splitting into separate
 * files would scatter the assertion surface for one composable. */

describe('useLayout', () => {
  beforeEach(() => {
    // Reset module-scoped state before each test
    const layout = useLayout()
    layout.closeAll()

    // jsdom defaults innerWidth to 1024 (== Tailwind's lg breakpoint), so
    // toggleWren would route to the docked-collapse path. The wrenOpen flag
    // only matters below lg — pin the width there so these tests exercise the
    // drawer branch they were written for.
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 800
    })
  })

  it('exposes sidebarOpen and wrenOpen as refs', () => {
    const layout = useLayout()
    expect(layout.sidebarOpen.value).toBe(false)
    expect(layout.wrenOpen.value).toBe(false)
  })

  it('toggleSidebar flips sidebarOpen', () => {
    const layout = useLayout()
    layout.toggleSidebar()
    expect(layout.sidebarOpen.value).toBe(true)
    layout.toggleSidebar()
    expect(layout.sidebarOpen.value).toBe(false)
  })

  it('toggleWren flips wrenOpen', () => {
    const layout = useLayout()
    layout.toggleWren()
    expect(layout.wrenOpen.value).toBe(true)
    layout.toggleWren()
    expect(layout.wrenOpen.value).toBe(false)
  })

  it('closeAll resets both flags', () => {
    const layout = useLayout()
    layout.toggleSidebar()
    layout.toggleWren()
    expect(layout.sidebarOpen.value).toBe(true)
    expect(layout.wrenOpen.value).toBe(true)
    layout.closeAll()
    expect(layout.sidebarOpen.value).toBe(false)
    expect(layout.wrenOpen.value).toBe(false)
  })

  it('state persists across useLayout calls (module-scoped)', () => {
    const layout1 = useLayout()
    layout1.toggleSidebar()
    const layout2 = useLayout()
    expect(layout2.sidebarOpen.value).toBe(true)
  })
})

describe('useCloseDrawersOnRouteChange', () => {
  it('closes both drawers when the route changes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/elsewhere', name: 'elsewhere', component: { template: '<div />' } }
      ]
    })

    const Host = defineComponent({
      setup() {
        useCloseDrawersOnRouteChange()
        return () => h('div')
      }
    })

    const layout = useLayout()
    await router.push('/')
    mount(Host, { global: { plugins: [router] } })
    // Open the drawers after mounting — opening before would race against
    // any initial watcher fire when the route resolves.
    layout.toggleSidebar()
    layout.toggleWren()
    // Flush so the toggles are visible to the next watcher tick.
    await new Promise(r => setTimeout(r, 0))
    layout.sidebarOpen.value = true
    layout.wrenOpen.value = true
    expect(layout.sidebarOpen.value).toBe(true)
    expect(layout.wrenOpen.value).toBe(true)

    await router.push('/elsewhere')
    await new Promise(r => setTimeout(r, 0))

    expect(layout.sidebarOpen.value).toBe(false)
    expect(layout.wrenOpen.value).toBe(false)
  })

  it('does not reset drawers before the route changes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: { template: '<div />' } }]
    })

    const Host = defineComponent({
      setup() {
        useCloseDrawersOnRouteChange()
        return () => h('div')
      }
    })

    const layout = useLayout()
    layout.toggleSidebar()
    expect(layout.sidebarOpen.value).toBe(true)

    mount(Host, { global: { plugins: [router] } })
    // No route change yet — watcher should not have fired
    expect(layout.sidebarOpen.value).toBe(true)
  })
})
