import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import AppTopBar from '@/components/layout/AppTopBar.vue'
import { useRoute } from 'vue-router'

// Mock vue-router. `useRoute` returns a fixture meta with crumbs so the
// breadcrumb tests can assert the rendered output; `RouterLink` is exported
// as a stub component because AppTopBar imports it for the crumb anchor
// (`src/components/layout/AppTopBar.vue:81`).
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ meta: { crumbs: ['Looking back', 'Calendar'] } })),
  RouterLink: { template: '<a><slot /></a>' }
}))

// Mock useTheme composable
const mockToggleMode = vi.fn()
let mockMode = 'light'

vi.mock('@/composables/useTheme.js', () => ({
  useTheme: () => ({ mode: mockMode, toggleMode: mockToggleMode })
}))

// Mock useLayout — only the two toggles are exercised by the topbar.
const mockToggleSidebar = vi.fn()
const mockToggleWren = vi.fn()

vi.mock('@/composables/useLayout.js', () => ({
  useLayout: () => ({
    toggleSidebar: mockToggleSidebar,
    toggleWren: mockToggleWren
  })
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalConfig = {
  stubs: { AppIconButton: true },
  plugins: [i18n]
}

describe('AppTopBar', () => {
  it('renders the breadcrumb crumbs joined by ·', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.text()).toContain('Looking back · Calendar')
  })

  it("renders today's date in the header", () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    // The date is dynamically computed — just check it contains the current year
    const currentYear = new Date().getFullYear().toString()
    expect(wrapper.text()).toContain(currentYear)
  })

  it('renders five icon buttons (menu, search, add, theme toggle, wren)', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons).toHaveLength(5)
  })

  it('renders empty crumbs (no brand fallback) when route has no crumbs (WEB-W3-12)', () => {
    vi.mocked(useRoute).mockReturnValueOnce({ meta: {} })
    const wrapper = mount(AppTopBar, { global: globalConfig })
    // The sidebar already shows the brand; the topbar no longer duplicates it.
    expect(wrapper.find('.app-top-bar__crumbs').text()).toBe('')
  })

  it('renders as a header element', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.element.tagName).toBe('HEADER')
  })

  it('renders the date in a span with the right class', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.find('.app-top-bar__date').exists()).toBe(true)
  })

  it('renders crumbs in a span with the right class', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.find('.app-top-bar__crumbs').exists()).toBe(true)
  })

  it('uses browser default locale — date string is non-empty', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const dateText = wrapper.find('.app-top-bar__date').text()
    // Using undefined locale — result should be non-empty and contain a digit
    expect(dateText).not.toBe('')
    expect(/\d/.test(dateText)).toBe(true)
  })

  it('renders a spacer between crumbs and date', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.find('.app-top-bar__spacer').exists()).toBe(true)
  })

  it('renders menu icon button with correct aria-label', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons[0].attributes('aria-label')).toBe('Open menu')
  })

  it('renders search icon button with correct aria-label', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons[1].attributes('aria-label')).toBe('Search')
  })

  it('renders add icon button with correct aria-label', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons[2].attributes('aria-label')).toBe('Add')
  })

  it('renders theme toggle with correct aria-label', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons[3].attributes('aria-label')).toBe('Toggle dark mode')
  })

  it('renders wren toggle with correct aria-label', () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons[4].attributes('aria-label')).toBe('Open Wren')
  })

  it('renders multiple crumbs joined by the separator', () => {
    vi.mocked(useRoute).mockReturnValueOnce({ meta: { crumbs: ['A', 'B', 'C'] } })
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.find('.app-top-bar__crumbs').text()).toBe('A · B · C')
  })

  it('renders single crumb without separator', () => {
    vi.mocked(useRoute).mockReturnValueOnce({ meta: { crumbs: ['Today'] } })
    const wrapper = mount(AppTopBar, { global: globalConfig })
    expect(wrapper.find('.app-top-bar__crumbs').text()).toBe('Today')
  })

  it('shows sun icon when mode is dark', () => {
    mockMode = 'dark'
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons[3].attributes('icon')).toBe('sun')
    mockMode = 'light'
  })

  it('shows moon icon when mode is light', () => {
    mockMode = 'light'
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    expect(buttons[3].attributes('icon')).toBe('moon')
  })

  it('calls toggleMode when the theme button is clicked', async () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    await buttons[3].trigger('click')
    expect(mockToggleMode).toHaveBeenCalled()
  })

  it('calls toggleSidebar when the menu button is clicked', async () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    await buttons[0].trigger('click')
    expect(mockToggleSidebar).toHaveBeenCalled()
  })

  it('calls toggleWren when the wren button is clicked', async () => {
    const wrapper = mount(AppTopBar, { global: globalConfig })
    const buttons = wrapper.findAll('app-icon-button-stub')
    await buttons[4].trigger('click')
    expect(mockToggleWren).toHaveBeenCalled()
  })
})
