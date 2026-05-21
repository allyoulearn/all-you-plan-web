# All You Plan Web — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `all-you-plan-web` boot into the new warm editorial design system — tokens, 4-theme theming, shared primitives, the 3-column app shell, scaffolded routes — with the old Eisenhower UI removed.

**Architecture:** CSS-custom-property tokens are swapped by `[data-theme]` / `[data-mode]` attributes on `<html>` and surfaced through Tailwind utilities. A `useTheme` composable controls and persists the active theme/mode. A `src/components/ui/` primitive layer and a `src/components/layout/` shell are built against the tokens. Every route renders a themed placeholder pending its feature sub-project.

**Tech Stack:** Vue 3.5, Vite 6, Tailwind 3.4, Vue Router 4, Pinia 3, Vitest, Heroicons, @fontsource.

**Spec:** `docs/superpowers/specs/2026-05-21-foundation-design-system-design.md` (sub-project 1 of 7).

**Before you start:** Do this work in a dedicated git branch or worktree of `all-you-plan-web` (see superpowers:using-git-worktrees). Per the family `CLAUDE.md` "batch commits" rule, never commit a partial or broken state — each task below ends with a complete, verified, committable increment. If you prefer a single Foundation commit, execute all tasks on a branch and squash-merge.

**Notes on conventions:** The app is JavaScript, not TypeScript. The import alias `@/` maps to `src/`. Commit messages follow Conventional Commits (`feat:`, `chore:`, `refactor:`, `docs:`), matching the repo history.

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

- [ ] **Step 1: Install runtime dependencies**

Run from the `all-you-plan-web` directory:

```bash
npm install @heroicons/vue @fontsource/instrument-sans @fontsource/instrument-serif @fontsource/jetbrains-mono
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D vitest @vue/test-utils jsdom
```

- [ ] **Step 3: Verify**

Run: `npm ls @heroicons/vue vitest @vue/test-utils`
Expected: each resolves to an installed version with no `UNMET DEPENDENCY`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add design-system dependencies (heroicons, fontsource, vitest)"
```

---

### Task 2: Vitest configuration

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create the Vitest config**

Create `vitest.config.js`. It merges the existing Vite config so tests get the Vue plugin and the `@/` alias:

```js
import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      exclude: [...configDefaults.exclude, 'dist/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to the `"scripts"` object:

```json
"test:unit": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add a smoke test**

Create `src/__smoke.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Run it**

Run: `npm run test:unit`
Expected: PASS — 1 test passed.

- [ ] **Step 5: Delete the smoke test and commit**

```bash
rm src/__smoke.test.js
git add vitest.config.js package.json
git commit -m "chore: configure vitest"
```

---

### Task 3: Design tokens & Tailwind wiring

**Files:**
- Create: `src/assets/tokens.css`
- Modify: `src/assets/main.css`, `tailwind.config.mjs`, `index.html`, `src/main.js`
- Delete: `src/assets/scss/main.scss` (superseded — see Step 6)

- [ ] **Step 1: Create the token stylesheet**

Create `src/assets/tokens.css`. These values are ported verbatim from the design bundle's `styles.css`:

```css
:root {
  --paper: #f8f5ec;
  --paper-2: #efeadb;
  --paper-3: #efe9d8;
  --ink: #0e0e0e;
  --ink-2: #2a2825;
  --muted: #6b6862;
  --rule: #0e0e0e;
  --rule-soft: #cdc7b5;
  --accent: #ff5a1f;
  --accent-ink: #ffffff;
  --ok: #2f7a3f;
  --warn: #c3a200;
  --bad: #b7351a;
}

:root[data-theme="warm"] {
  --paper: #f7f3ea; --paper-2: #ffffff; --paper-3: #efe9d8;
  --ink: #1a1814; --ink-2: #38332a; --muted: #756f63;
  --rule: #1a1814; --rule-soft: #e6dfca; --accent: #ff5a1f;
}
:root[data-theme="ink"] {
  --paper: #f2efe6; --paper-2: #fbfaf4; --paper-3: #e6e0cd;
  --ink: #131311; --muted: #6e6a60;
  --rule: #131311; --rule-soft: #ddd5bf; --accent: #1c6a35;
}
:root[data-theme="blueprint"] {
  --paper: #eef2f8; --paper-2: #ffffff; --paper-3: #dde4ee;
  --ink: #0c1a2e; --muted: #5b6779;
  --rule: #0c1a2e; --rule-soft: #ccd5e2; --accent: #2563eb;
}
:root[data-theme="rose"] {
  --paper: #f6efe8; --paper-2: #fdf9f4; --paper-3: #ead9cb;
  --ink: #1a1010; --muted: #80695f;
  --rule: #1a1010; --rule-soft: #e7d3c4; --accent: #d63b65;
}

:root[data-mode="dark"][data-theme="warm"] {
  --paper: #15130e; --paper-2: #1f1c15; --paper-3: #2a2519;
  --ink: #f3efe3; --ink-2: #c9c4b5; --muted: #8a857a;
  --rule: #efe9d7; --rule-soft: #2e2a22; --accent: #ff6a2c;
}
:root[data-mode="dark"][data-theme="ink"] {
  --paper: #0f100e; --paper-2: #181a16; --paper-3: #232520;
  --ink: #ecebe3; --muted: #8a8a80;
  --rule: #ecebe3; --rule-soft: #262822; --accent: #5fbf75;
}
:root[data-mode="dark"][data-theme="blueprint"] {
  --paper: #0b1220; --paper-2: #131c2c; --paper-3: #1c2638;
  --ink: #e9edf5; --muted: #7e8aa0;
  --rule: #e9edf5; --rule-soft: #1f2840; --accent: #7da4ff;
}
:root[data-mode="dark"][data-theme="rose"] {
  --paper: #150f0f; --paper-2: #1e1614; --paper-3: #2a1f1c;
  --ink: #f1e8e4; --muted: #8c7c77;
  --rule: #f1e8e4; --rule-soft: #2c211e; --accent: #ff7a96;
}
```

- [ ] **Step 2: Replace the Tailwind config**

Replace the entire contents of `tailwind.config.mjs` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        'paper-3': 'var(--paper-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        muted: 'var(--muted)',
        rule: 'var(--rule)',
        'rule-soft': 'var(--rule-soft)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '20px',
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(20,18,12,0.04), 0 2px 8px rgba(20,18,12,0.04)',
        md: '0 1px 2px rgba(20,18,12,0.05), 0 8px 24px rgba(20,18,12,0.06)',
        'accent-glow': '0 6px 24px color-mix(in oklab, var(--accent) 30%, transparent)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Replace `main.css`**

Replace the entire contents of `src/assets/main.css` with the Tailwind layers plus a token-driven base:

```css
@import '@fontsource/instrument-sans/400.css';
@import '@fontsource/instrument-sans/500.css';
@import '@fontsource/instrument-sans/600.css';
@import '@fontsource/instrument-serif/400.css';
@import '@fontsource/instrument-serif/400-italic.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.35;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
}
```

- [ ] **Step 4: Set initial theme attributes in `index.html`**

In `index.html`, change the `<html>` tag to `<html lang="en" data-theme="warm" data-mode="light">` and remove any hardcoded `class="dark"` from the `<body>` tag (the body becomes a plain `<body>`).

- [ ] **Step 5: Import the token stylesheet in `main.js`**

Open `src/main.js`. It already imports the app stylesheet. Ensure `tokens.css` is imported immediately before `main.css` so the token variables are defined first:

```js
import './assets/tokens.css'
import './assets/main.css'
```

If `main.js` currently imports `./assets/scss/main.scss` or only `./assets/main.css`, replace those line(s) with the two above.

- [ ] **Step 6: Delete the superseded SCSS**

```bash
rm src/assets/scss/main.scss
rmdir src/assets/scss 2>/dev/null || true
```

- [ ] **Step 7: Verify**

Run: `npm run dev`
Expected: the dev server starts on port 3100 and compiles with no errors. The page background renders as warm cream `#f7f3ea`. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add src/assets/tokens.css src/assets/main.css tailwind.config.mjs index.html src/main.js
git commit -m "feat: warm design-system tokens and tailwind wiring"
```

---

### Task 4: Theme controller (`useTheme`)

**Files:**
- Create: `src/composables/useTheme.js`, `src/composables/useTheme.test.js`
- Delete: `src/composables/useDarkMode.js`

- [ ] **Step 1: Write the failing tests**

Create `src/composables/useTheme.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme, initTheme, THEMES } from './useTheme.js'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-mode')
    const t = useTheme()
    t.setTheme('warm')
    t.setMode('light')
  })

  it('setMode writes the data-mode attribute', () => {
    useTheme().setMode('dark')
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
  })

  it('toggleMode flips between light and dark', () => {
    const { toggleMode, mode } = useTheme()
    toggleMode()
    expect(mode.value).toBe('dark')
    toggleMode()
    expect(mode.value).toBe('light')
  })

  it('setTheme writes the data-theme attribute', () => {
    useTheme().setTheme('blueprint')
    expect(document.documentElement.getAttribute('data-theme')).toBe('blueprint')
  })

  it('setTheme rejects an unknown theme name', () => {
    const { setTheme, themeName } = useTheme()
    setTheme('rose')
    setTheme('not-a-theme')
    expect(themeName.value).toBe('rose')
  })

  it('persists the choice and initTheme restores it', () => {
    const { setTheme, setMode } = useTheme()
    setTheme('rose')
    setMode('dark')
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-mode')
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('rose')
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
  })

  it('exposes all four theme names', () => {
    expect(THEMES).toEqual(['warm', 'ink', 'blueprint', 'rose'])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- useTheme`
Expected: FAIL — `Failed to resolve import "./useTheme.js"`.

- [ ] **Step 3: Implement the composable**

Create `src/composables/useTheme.js`:

```js
import { ref } from 'vue'

export const THEMES = ['warm', 'ink', 'blueprint', 'rose']
export const MODES = ['light', 'dark']
const STORAGE_KEY = 'ayp-theme'

const themeName = ref('warm')
const mode = ref('light')

function apply() {
  const el = document.documentElement
  el.setAttribute('data-theme', themeName.value)
  el.setAttribute('data-mode', mode.value)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ themeName: themeName.value, mode: mode.value }),
  )
}

export function initTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && THEMES.includes(saved.themeName)) themeName.value = saved.themeName
    if (saved && MODES.includes(saved.mode)) mode.value = saved.mode
  } catch {
    // ignore malformed storage
  }
  apply()
}

export function useTheme() {
  function setTheme(name) {
    if (!THEMES.includes(name)) return
    themeName.value = name
    apply()
  }
  function setMode(next) {
    if (!MODES.includes(next)) return
    mode.value = next
    apply()
  }
  function toggleMode() {
    setMode(mode.value === 'light' ? 'dark' : 'light')
  }
  return { themeName, mode, THEMES, setTheme, setMode, toggleMode }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:unit -- useTheme`
Expected: PASS — 6 tests passed.

- [ ] **Step 5: Wire `initTheme` into app startup**

In `src/main.js`, import and call `initTheme` before `app.mount`:

```js
import { initTheme } from './composables/useTheme.js'
// ... after createApp / plugin registration, before mount:
initTheme()
```

- [ ] **Step 6: Delete the old dark-mode composable**

```bash
rm src/composables/useDarkMode.js
```

- [ ] **Step 7: Commit**

```bash
git add src/composables/useTheme.js src/composables/useTheme.test.js src/main.js
git commit -m "feat: theme controller for 4 themes and light/dark"
```

---

### Task 5: `Icon` primitive

**Files:**
- Create: `src/components/ui/iconMap.js`, `src/components/ui/Icon.vue`, `src/components/ui/Icon.test.js`

- [ ] **Step 1: Create the icon map**

Create `src/components/ui/iconMap.js`:

```js
import * as Outline from '@heroicons/vue/24/outline'
import * as Solid from '@heroicons/vue/24/solid'

const names = {
  today: 'HomeIcon',
  chores: 'ArrowPathIcon',
  projects: 'Squares2X2Icon',
  wren: 'SparklesIcon',
  more: 'EllipsisHorizontalIcon',
  calendar: 'CalendarIcon',
  stats: 'ChartBarIcon',
  journal: 'BookOpenIcon',
  inbox: 'InboxIcon',
  chat: 'ChatBubbleLeftRightIcon',
  review: 'ClipboardDocumentCheckIcon',
  settings: 'Cog6ToothIcon',
  search: 'MagnifyingGlassIcon',
  plus: 'PlusIcon',
  check: 'CheckIcon',
  'chevron-left': 'ChevronLeftIcon',
  'chevron-right': 'ChevronRightIcon',
  'chevron-down': 'ChevronDownIcon',
  moon: 'MoonIcon',
  sun: 'SunIcon',
  flag: 'FlagIcon',
  mic: 'MicrophoneIcon',
  bolt: 'BoltIcon',
  'arrow-right': 'ArrowRightIcon',
  filter: 'FunnelIcon',
}

export const outlineIcons = Object.fromEntries(
  Object.entries(names).map(([k, v]) => [k, Outline[v]]),
)
export const solidIcons = Object.fromEntries(
  Object.entries(names).map(([k, v]) => [k, Solid[v]]),
)
```

- [ ] **Step 2: Create the component**

Create `src/components/ui/Icon.vue`:

```vue
<script setup>
import { computed } from 'vue'
import { outlineIcons, solidIcons } from './iconMap.js'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
  solid: { type: Boolean, default: false },
})

const component = computed(
  () => (props.solid ? solidIcons : outlineIcons)[props.name] || null,
)
</script>

<template>
  <component
    :is="component"
    v-if="component"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>
```

- [ ] **Step 3: Write the test**

Create `src/components/ui/Icon.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('renders an svg for a known name', () => {
    const wrapper = mount(Icon, { props: { name: 'search' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders nothing for an unknown name', () => {
    const wrapper = mount(Icon, { props: { name: 'nope' } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm run test:unit -- Icon`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/iconMap.js src/components/ui/Icon.vue src/components/ui/Icon.test.js
git commit -m "feat: Icon primitive over heroicons"
```

---

### Task 6: `Button` & `IconButton` primitives

**Files:**
- Create: `src/components/ui/Button.vue`, `src/components/ui/IconButton.vue`, `src/components/ui/Button.test.js`

- [ ] **Step 1: Create `Button.vue`**

```vue
<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'md' },
  icon: { type: String, default: '' },
  iconTrailing: { type: String, default: '' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})

const variants = {
  default: 'bg-paper-2 text-ink border border-rule-soft hover:bg-paper-3 hover:border-muted',
  primary: 'bg-ink text-paper border border-ink hover:brightness-90',
  accent: 'bg-accent text-accent-ink border border-accent hover:brightness-95',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-paper-3',
}
const sizes = { sm: 'text-[12px] px-3 py-1.5', md: 'text-[13px] px-4 py-2' }
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center gap-2 rounded-pill font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[variants[variant], sizes[size]]"
  >
    <Icon v-if="icon" :name="icon" :size="16" />
    <slot />
    <Icon v-if="iconTrailing" :name="iconTrailing" :size="16" />
  </button>
</template>
```

- [ ] **Step 2: Create `IconButton.vue`**

```vue
<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  icon: { type: String, required: true },
  size: { type: Number, default: 34 },
  variant: { type: String, default: 'default' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="grid place-items-center rounded-pill text-ink-2 transition-colors hover:text-ink disabled:opacity-50"
    :class="variant === 'ghost'
      ? 'bg-transparent hover:bg-paper-3'
      : 'bg-paper-2 border border-rule-soft hover:bg-paper-3'"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <Icon :name="icon" :size="Math.round(size * 0.47)" />
  </button>
</template>
```

- [ ] **Step 3: Write the test**

Create `src/components/ui/Button.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'
import IconButton from './IconButton.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Save' } })
    expect(wrapper.text()).toContain('Save')
  })

  it('applies the accent variant classes', () => {
    const wrapper = mount(Button, { props: { variant: 'accent' } })
    expect(wrapper.classes()).toContain('bg-accent')
  })
})

describe('IconButton', () => {
  it('renders an svg icon', () => {
    const wrapper = mount(IconButton, { props: { icon: 'plus' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm run test:unit -- Button`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.vue src/components/ui/IconButton.vue src/components/ui/Button.test.js
git commit -m "feat: Button and IconButton primitives"
```

---

### Task 7: `Card` & `Pill` primitives

**Files:**
- Create: `src/components/ui/Card.vue`, `src/components/ui/Pill.vue`, `src/components/ui/Card.test.js`

- [ ] **Step 1: Create `Card.vue`**

```vue
<script setup>
defineProps({
  variant: { type: String, default: 'default' },
  as: { type: String, default: 'div' },
})
</script>

<template>
  <component
    :is="as"
    class="flex flex-col gap-2.5 rounded-md p-[22px]"
    :class="variant === 'accent'
      ? 'bg-accent text-accent-ink shadow-accent-glow'
      : 'bg-paper-2 text-ink shadow-sm'"
  >
    <slot />
  </component>
</template>
```

- [ ] **Step 2: Create `Pill.vue`**

```vue
<script setup>
defineProps({
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-medium"
    :class="{
      'bg-paper-3 text-ink-2': variant === 'default' || variant === 'dot',
      'bg-accent text-accent-ink': variant === 'accent',
      'border border-rule-soft bg-transparent text-muted': variant === 'soft',
    }"
  >
    <span v-if="variant === 'dot'" class="h-1.5 w-1.5 rounded-pill bg-accent" />
    <slot />
  </span>
</template>
```

- [ ] **Step 3: Write the test**

Create `src/components/ui/Card.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from './Card.vue'
import Pill from './Pill.vue'

describe('Card', () => {
  it('renders slot content', () => {
    const wrapper = mount(Card, { slots: { default: 'Body' } })
    expect(wrapper.text()).toContain('Body')
  })

  it('uses the accent glow shadow for the accent variant', () => {
    const wrapper = mount(Card, { props: { variant: 'accent' } })
    expect(wrapper.classes()).toContain('shadow-accent-glow')
  })
})

describe('Pill', () => {
  it('renders a dot for the dot variant', () => {
    const wrapper = mount(Pill, { props: { variant: 'dot' }, slots: { default: 'x' } })
    expect(wrapper.find('span.bg-accent').exists()).toBe(true)
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm run test:unit -- Card`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Card.vue src/components/ui/Pill.vue src/components/ui/Card.test.js
git commit -m "feat: Card and Pill primitives"
```

---

### Task 8: `ProgressBar` & `Checkbox` primitives

**Files:**
- Create: `src/components/ui/ProgressBar.vue`, `src/components/ui/Checkbox.vue`, `src/components/ui/Checkbox.test.js`

- [ ] **Step 1: Create `ProgressBar.vue`**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  thin: { type: Boolean, default: false },
})

const pct = computed(() => `${Math.max(0, Math.min(1, props.value)) * 100}%`)
</script>

<template>
  <div
    class="overflow-hidden rounded-pill"
    :class="thin ? 'h-1 bg-rule-soft' : 'h-1.5 bg-paper-3'"
  >
    <div class="h-full rounded-pill bg-accent" :style="{ width: pct }" />
  </div>
</template>
```

- [ ] **Step 2: Create `Checkbox.vue`**

```vue
<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  size: { type: Number, default: 20 },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="grid place-items-center rounded-pill border transition-colors disabled:opacity-50"
    :class="modelValue
      ? 'border-accent bg-accent'
      : 'border-rule-soft bg-paper-2 hover:border-muted'"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @click="toggle"
  >
    <Icon v-if="modelValue" name="check" :size="Math.round(size * 0.6)" class="text-accent-ink" />
  </button>
</template>
```

- [ ] **Step 3: Write the test**

Create `src/components/ui/Checkbox.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from './Checkbox.vue'
import ProgressBar from './ProgressBar.vue'

describe('Checkbox', () => {
  it('emits the toggled value on click', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('ProgressBar', () => {
  it('clamps the fill width to 0-100%', () => {
    const wrapper = mount(ProgressBar, { props: { value: 1.5 } })
    expect(wrapper.find('div > div').attributes('style')).toContain('width: 100%')
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm run test:unit -- Checkbox`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ProgressBar.vue src/components/ui/Checkbox.vue src/components/ui/Checkbox.test.js
git commit -m "feat: ProgressBar and Checkbox primitives"
```

---

### Task 9: `TextField` primitive

**Files:**
- Create: `src/components/ui/TextField.vue`, `src/components/ui/TextField.test.js`

- [ ] **Step 1: Create `TextField.vue`**

```vue
<script setup>
import Icon from './Icon.vue'

defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="flex flex-col gap-1.5">
    <span v-if="label" class="text-[12px] font-medium text-muted">{{ label }}</span>
    <span
      class="flex items-center gap-2 rounded-md border bg-paper-2 px-3.5 py-2.5 transition-colors focus-within:border-muted"
      :class="invalid ? 'border-bad' : 'border-rule-soft'"
    >
      <Icon v-if="icon" :name="icon" :size="16" class="text-muted" />
      <input
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :value="modelValue"
        class="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted disabled:opacity-50"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </span>
  </label>
</template>
```

- [ ] **Step 2: Write the test**

Create `src/components/ui/TextField.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextField from './TextField.vue'

describe('TextField', () => {
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TextField)
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hello'])
  })

  it('shows the bad border when invalid', () => {
    const wrapper = mount(TextField, { props: { invalid: true } })
    expect(wrapper.find('span.border-bad').exists()).toBe(true)
  })
})
```

- [ ] **Step 3: Run the test**

Run: `npm run test:unit -- TextField`
Expected: PASS — 2 tests passed.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/TextField.vue src/components/ui/TextField.test.js
git commit -m "feat: TextField primitive"
```

---

### Task 10: `SegmentedControl` primitive

**Files:**
- Create: `src/components/ui/SegmentedControl.vue`, `src/components/ui/SegmentedControl.test.js`

- [ ] **Step 1: Create `SegmentedControl.vue`**

```vue
<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="inline-flex gap-0.5 rounded-md bg-paper-3 p-[3px]">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium transition-colors"
      :class="opt.value === modelValue
        ? 'bg-paper-2 text-ink shadow-sm'
        : 'text-muted hover:text-ink'"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
      <span v-if="opt.count != null" class="font-mono text-[11px] text-muted">{{ opt.count }}</span>
    </button>
  </div>
</template>
```

- [ ] **Step 2: Write the test**

Create `src/components/ui/SegmentedControl.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SegmentedControl from './SegmentedControl.vue'

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]

describe('SegmentedControl', () => {
  it('renders one button per option', () => {
    const wrapper = mount(SegmentedControl, { props: { modelValue: 'a', options } })
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('emits the option value on click', async () => {
    const wrapper = mount(SegmentedControl, { props: { modelValue: 'a', options } })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['b'])
  })
})
```

- [ ] **Step 3: Run the test**

Run: `npm run test:unit -- SegmentedControl`
Expected: PASS — 2 tests passed.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/SegmentedControl.vue src/components/ui/SegmentedControl.test.js
git commit -m "feat: SegmentedControl primitive"
```

---

### Task 11: `ScreenHeading` & `SectionHeader` primitives

**Files:**
- Create: `src/components/ui/ScreenHeading.vue`, `src/components/ui/SectionHeader.vue`, `src/components/ui/ScreenHeading.test.js`

- [ ] **Step 1: Create `ScreenHeading.vue`**

```vue
<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  emphasis: { type: String, default: '' },
})
</script>

<template>
  <header class="mb-7 flex items-end gap-[18px] pb-6">
    <div class="flex-1">
      <p
        v-if="eyebrow"
        class="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
      >
        {{ eyebrow }}
      </p>
      <h1
        class="font-serif text-[44px] font-normal leading-[0.95] tracking-[-0.02em] text-ink xl:text-[56px]"
      >
        {{ title }}<em v-if="emphasis" class="italic"> {{ emphasis }}</em>
      </h1>
    </div>
    <div v-if="$slots.meta" class="text-right text-[13px] leading-relaxed text-muted">
      <slot name="meta" />
    </div>
  </header>
</template>
```

- [ ] **Step 2: Create `SectionHeader.vue`**

```vue
<script setup>
defineProps({
  label: { type: String, required: true },
  count: { type: Number, default: null },
})
</script>

<template>
  <div class="mb-3 mt-8 flex items-baseline gap-3">
    <span class="text-[13px] font-medium text-ink">{{ label }}</span>
    <span v-if="count != null" class="font-mono text-[11px] text-muted">[{{ count }}]</span>
    <span class="flex-1 border-t border-rule-soft" />
    <slot name="action" />
  </div>
</template>
```

- [ ] **Step 3: Write the test**

Create `src/components/ui/ScreenHeading.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScreenHeading from './ScreenHeading.vue'
import SectionHeader from './SectionHeader.vue'

describe('ScreenHeading', () => {
  it('renders the title and emphasis', () => {
    const wrapper = mount(ScreenHeading, {
      props: { title: 'A quiet', emphasis: 'full day.' },
    })
    expect(wrapper.text()).toContain('A quiet')
    expect(wrapper.find('em').text()).toBe('full day.')
  })
})

describe('SectionHeader', () => {
  it('renders the label and bracketed count', () => {
    const wrapper = mount(SectionHeader, { props: { label: 'Morning', count: 4 } })
    expect(wrapper.text()).toContain('Morning')
    expect(wrapper.text()).toContain('[4]')
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm run test:unit -- ScreenHeading`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ScreenHeading.vue src/components/ui/SectionHeader.vue src/components/ui/ScreenHeading.test.js
git commit -m "feat: ScreenHeading and SectionHeader primitives"
```

---

### Task 12: `AppSidebar`

**Files:**
- Create: `src/components/layout/navConfig.js`, `src/components/layout/AppSidebar.vue`

- [ ] **Step 1: Create the nav config**

Create `src/components/layout/navConfig.js`:

```js
export const navGroups = [
  {
    label: 'Workspaces',
    items: [
      { to: '/', icon: 'today', label: 'Today', key: 'T' },
      { to: '/chores', icon: 'chores', label: 'Chores', key: 'C' },
      { to: '/projects', icon: 'projects', label: 'Projects', key: 'P' },
    ],
  },
  {
    label: 'Looking back',
    items: [
      { to: '/calendar', icon: 'calendar', label: 'Calendar', key: 'K' },
      { to: '/stats', icon: 'stats', label: 'Stats', key: 'S' },
      { to: '/journal', icon: 'journal', label: 'Journal', key: 'J' },
      { to: '/inbox', icon: 'inbox', label: 'Inbox', key: 'I' },
    ],
  },
  {
    label: 'With Wren',
    items: [
      { to: '/wren', icon: 'chat', label: 'Chat', key: 'W' },
      { to: '/review', icon: 'review', label: 'Daily review', key: 'R' },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/settings', icon: 'settings', label: 'Settings', key: ',' }],
  },
]
```

- [ ] **Step 2: Create `AppSidebar.vue`**

```vue
<script setup>
import { RouterLink } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import { navGroups } from './navConfig.js'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
</script>

<template>
  <aside class="flex h-screen flex-col overflow-hidden border-r border-rule-soft bg-paper">
    <div class="flex items-baseline gap-2 px-[22px] pb-[18px] pt-[22px]">
      <span class="font-serif text-[26px] italic leading-none tracking-[-0.01em] text-ink">
        all you <em>plan</em>
      </span>
    </div>

    <nav class="flex-1 overflow-y-auto py-2">
      <div v-for="group in navGroups" :key="group.label">
        <p class="px-5 pb-1.5 pt-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="mx-2.5 my-px flex items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] text-ink transition-colors hover:bg-paper-3"
          active-class="!bg-ink !text-paper font-medium"
        >
          <Icon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
          <span class="ml-auto font-mono text-[10px] text-muted">{{ item.key }}</span>
        </RouterLink>
      </div>
    </nav>

    <div class="flex items-center gap-2.5 border-t border-rule-soft px-[22px] py-3.5 text-[13px]">
      <span class="grid h-8 w-8 place-items-center rounded-pill bg-accent text-[13px] font-semibold text-accent-ink">
        {{ (auth.userName || 'U').charAt(0).toUpperCase() }}
      </span>
      <span class="text-ink">{{ auth.userName || 'You' }}</span>
    </div>
  </aside>
</template>
```

Note: `RouterLink` `active-class` only marks `/` active on an exact match because nested children are involved; if `/` highlights on every route during verification, change its `<RouterLink>` to add the `:exact-active-class` binding or set `exact` — confirm visually in Task 17.

- [ ] **Step 3: Verify**

Run: `npm run test:unit` — all existing tests still PASS (this task adds no test; the component is verified visually in Task 17).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/navConfig.js src/components/layout/AppSidebar.vue
git commit -m "feat: app sidebar with grouped nav"
```

---

### Task 13: `AppTopBar`

**Files:**
- Create: `src/components/layout/AppTopBar.vue`

- [ ] **Step 1: Create `AppTopBar.vue`**

```vue
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import IconButton from '@/components/ui/IconButton.vue'
import { useTheme } from '@/composables/useTheme.js'

const route = useRoute()
const { mode, toggleMode } = useTheme()

const crumbs = computed(() => (route.meta.crumbs || ['all you plan']).join(' · '))
const today = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
)
</script>

<template>
  <header class="sticky top-0 z-10 flex items-center gap-3.5 bg-paper px-8 py-4">
    <span class="text-[13px] text-muted">{{ crumbs }}</span>
    <span class="flex-1" />
    <span class="text-[13px] text-muted">{{ today }}</span>
    <IconButton icon="search" :size="34" />
    <IconButton icon="plus" :size="34" />
    <IconButton :icon="mode === 'dark' ? 'sun' : 'moon'" :size="34" @click="toggleMode" />
  </header>
</template>
```

- [ ] **Step 2: Verify**

Run: `npm run test:unit` — all existing tests still PASS (verified visually in Task 17).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppTopBar.vue
git commit -m "feat: app top bar with crumbs and mode toggle"
```

---

### Task 14: `WrenPanel`

**Files:**
- Create: `src/components/layout/WrenPanel.vue`

- [ ] **Step 1: Create `WrenPanel.vue`**

This builds the panel chrome only. The conversation is wired in sub-project 5.

```vue
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
```

- [ ] **Step 2: Verify**

Run: `npm run test:unit` — all existing tests still PASS (verified visually in Task 17).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/WrenPanel.vue
git commit -m "feat: Wren panel chrome"
```

---

### Task 15: `AppShell`

**Files:**
- Create: `src/components/layout/AppShell.vue`

- [ ] **Step 1: Create `AppShell.vue`**

```vue
<script setup>
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
import WrenPanel from './WrenPanel.vue'
</script>

<template>
  <div
    class="grid h-screen overflow-hidden bg-paper"
    style="grid-template-columns: 232px 1fr 360px"
  >
    <AppSidebar />
    <main class="flex flex-col overflow-y-auto bg-paper">
      <AppTopBar />
      <div class="mx-auto w-full max-w-[980px] px-7 pb-20 pt-7">
        <RouterView />
      </div>
    </main>
    <WrenPanel />
  </div>
</template>

<style scoped>
@media (max-width: 1280px) {
  div { grid-template-columns: 200px 1fr 320px !important; }
}
@media (max-width: 960px) {
  div { grid-template-columns: 64px 1fr 280px !important; }
}
</style>
```

- [ ] **Step 2: Write a render test**

Create `src/components/layout/AppShell.test.js`. The three child components are stubbed so the test covers `AppShell`'s own layout without needing a router or Pinia:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppShell from './AppShell.vue'

describe('AppShell', () => {
  it('renders the main content region', () => {
    const wrapper = mount(AppShell, {
      global: {
        stubs: { RouterView: true, AppSidebar: true, AppTopBar: true, WrenPanel: true },
      },
    })
    expect(wrapper.find('main').exists()).toBe(true)
  })
})
```

- [ ] **Step 3: Run the test**

Run: `npm run test:unit -- AppShell`
Expected: PASS — 1 test passed.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppShell.vue src/components/layout/AppShell.test.js
git commit -m "feat: 3-column app shell"
```

---

### Task 16: `PlaceholderScreen` & route placeholder views

**Files:**
- Create: `src/components/PlaceholderScreen.vue`
- Create: `src/views/TodayView.vue`, `ChoresView.vue`, `ProjectsView.vue`, `ProjectDetailView.vue`, `KanbanView.vue`, `CalendarView.vue`, `StatsView.vue`, `JournalView.vue`, `InboxView.vue`, `WrenView.vue`, `ReviewView.vue`
- Modify (overwrite): `src/views/SettingsView.vue`

- [ ] **Step 1: Create `PlaceholderScreen.vue`**

```vue
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
```

- [ ] **Step 2: Create the 12 placeholder views**

Create each file below. They differ only in props.

`src/views/TodayView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Workspaces · Today"
    title="A quiet"
    emphasis="full day."
    note="The Today timeline arrives in sub-project 2."
  />
</template>
```

`src/views/ChoresView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Workspaces · Chores"
    title="Small habits,"
    emphasis="kept."
    note="Chores arrive in sub-project 3."
  />
</template>
```

`src/views/ProjectsView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Workspaces · Projects"
    title="Six things you're"
    emphasis="becoming."
    note="Projects arrive in sub-project 4."
  />
</template>
```

`src/views/ProjectDetailView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Workspaces · Projects"
    title="Project"
    emphasis="detail."
    note="Project detail arrives in sub-project 4."
  />
</template>
```

`src/views/KanbanView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Workspaces · Projects"
    title="By"
    emphasis="status."
    note="The kanban board arrives in sub-project 4."
  />
</template>
```

`src/views/CalendarView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Looking back · Calendar"
    title="May"
    emphasis="2026."
    note="The calendar arrives in sub-project 6."
  />
</template>
```

`src/views/StatsView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Looking back · Stats"
    title="Six months of"
    emphasis="showing up."
    note="Stats arrive in sub-project 6."
  />
</template>
```

`src/views/JournalView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Looking back · Journal"
    title="Notes to"
    emphasis="yourself."
    note="The journal arrives in sub-project 6."
  />
</template>
```

`src/views/InboxView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="Looking back · Inbox"
    title="Triage,"
    emphasis="don't think."
    note="The inbox arrives in sub-project 6."
  />
</template>
```

`src/views/WrenView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="With Wren · Chat"
    title="A longer"
    emphasis="conversation."
    note="Chat with Wren arrives in sub-project 5."
  />
</template>
```

`src/views/ReviewView.vue`:

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="With Wren · Daily review"
    title="How did"
    emphasis="today feel?"
    note="The daily review arrives in sub-project 5."
  />
</template>
```

`src/views/SettingsView.vue` (overwrite the existing file):

```vue
<script setup>
import PlaceholderScreen from '@/components/PlaceholderScreen.vue'
</script>
<template>
  <PlaceholderScreen
    eyebrow="System · Settings"
    title="Tune the"
    emphasis="experience."
    note="Settings arrive in sub-project 7."
  />
</template>
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: build completes with no errors. (Routing is not wired yet — that is Task 17.)

- [ ] **Step 4: Commit**

```bash
git add src/components/PlaceholderScreen.vue src/views/TodayView.vue src/views/ChoresView.vue src/views/ProjectsView.vue src/views/ProjectDetailView.vue src/views/KanbanView.vue src/views/CalendarView.vue src/views/StatsView.vue src/views/JournalView.vue src/views/InboxView.vue src/views/WrenView.vue src/views/ReviewView.vue src/views/SettingsView.vue
git commit -m "feat: placeholder screens for all routes"
```

---

### Task 17: Router & app mount

**Files:**
- Modify (overwrite): `src/router/index.js`
- Modify: `src/App.vue`

- [ ] **Step 1: Replace `src/router/index.js`**

```js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppShell from '@/components/layout/AppShell.vue'

const routes = [
  {
    path: '/auth',
    component: () => import('@/views/auth/AuthLayout.vue'),
    children: [
      { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: 'Sign in', public: true } },
      { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { title: 'Create account', public: true } },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { title: 'Reset password', public: true } },
      { path: 'reset-password', name: 'reset-password', component: () => import('@/views/auth/ResetPasswordView.vue'), meta: { title: 'Reset password', public: true } },
    ],
  },
  {
    path: '/',
    component: AppShell,
    children: [
      { path: '', name: 'today', component: () => import('@/views/TodayView.vue'), meta: { title: 'Today', crumbs: ['Workspaces', 'Today'] } },
      { path: 'chores', name: 'chores', component: () => import('@/views/ChoresView.vue'), meta: { title: 'Chores', crumbs: ['Workspaces', 'Chores'] } },
      { path: 'projects', name: 'projects', component: () => import('@/views/ProjectsView.vue'), meta: { title: 'Projects', crumbs: ['Workspaces', 'Projects'] } },
      { path: 'projects/:id', name: 'project', component: () => import('@/views/ProjectDetailView.vue'), meta: { title: 'Project', crumbs: ['Workspaces', 'Projects'] } },
      { path: 'projects/:id/board', name: 'kanban', component: () => import('@/views/KanbanView.vue'), meta: { title: 'Board', crumbs: ['Workspaces', 'Projects', 'Board'] } },
      { path: 'calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue'), meta: { title: 'Calendar', crumbs: ['Looking back', 'Calendar'] } },
      { path: 'stats', name: 'stats', component: () => import('@/views/StatsView.vue'), meta: { title: 'Stats', crumbs: ['Looking back', 'Stats'] } },
      { path: 'journal', name: 'journal', component: () => import('@/views/JournalView.vue'), meta: { title: 'Journal', crumbs: ['Looking back', 'Journal'] } },
      { path: 'inbox', name: 'inbox', component: () => import('@/views/InboxView.vue'), meta: { title: 'Inbox', crumbs: ['Looking back', 'Inbox'] } },
      { path: 'wren', name: 'wren', component: () => import('@/views/WrenView.vue'), meta: { title: 'Wren', crumbs: ['With Wren', 'Chat'] } },
      { path: 'review', name: 'review', component: () => import('@/views/ReviewView.vue'), meta: { title: 'Daily review', crumbs: ['With Wren', 'Daily review'] } },
      { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: 'Settings', crumbs: ['System', 'Settings'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.public && auth.isAuthenticated) return { name: 'today' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — all you plan` : 'all you plan'
})

export default router
```

Note: if the existing `auth.store` exposes the authenticated flag under a different name than `isAuthenticated`, open `src/stores/auth.store.js`, confirm the getter name, and adjust the two references in `beforeEach` to match.

- [ ] **Step 2: Confirm `App.vue` renders only the router view**

Open `src/App.vue`. It should render `<RouterView />` and nothing layout-related (the layout now lives in `AppShell`). If it still imports or renders `AppLayout`, replace its template with:

```vue
<template>
  <RouterView />
</template>
```

Keep any global toast container (e.g. `vue-sonner`'s `<Toaster />`) if one is already present.

- [ ] **Step 3: Verify**

Run: `npm run dev`, open `http://localhost:3100`.
Expected: after signing in (use the demo login on the login screen), the app shows the 3-column shell. Click every sidebar item — each route loads its placeholder screen with the correct heading. The active nav item shows the dark `ink` fill. Confirm `/` ("Today") is highlighted only on the Today route, not on every route — if it highlights everywhere, add `class="..."` `exact-active-class` handling to the Today `RouterLink` in `AppSidebar.vue` (give the `/` link `:class` logic keyed to `$route.path === '/'`). Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/router/index.js src/App.vue src/components/layout/AppSidebar.vue
git commit -m "feat: route the new shell with placeholder screens"
```

---

### Task 18: Remove the old Eisenhower UI

**Files:**
- Delete: the old layout, views, and feature components listed below
- Create: `docs/superpowers/archive/` (move two superseded docs into it)

- [ ] **Step 1: Delete the old layout and views**

```bash
git rm src/components/layout/AppLayout.vue src/components/layout/AppHeader.vue
git rm src/views/DashboardView.vue src/views/SpaceView.vue src/views/BriefingView.vue
```

The current `AppSidebar.vue` in `src/components/layout/` was rewritten in Task 12 — it is the new sidebar, so do **not** delete it.

- [ ] **Step 2: Delete the old feature components**

```bash
git rm -r src/components/dashboard src/components/tasks src/components/spaces
git rm src/components/common/GlassCard.vue \
       src/components/common/ProgressRing.vue \
       src/components/common/QuadrantBadge.vue
git rm src/utils/quadrantColors.js
```

If `src/components/common/` is now empty, remove the empty directory.

- [ ] **Step 3: Archive the superseded design docs**

```bash
mkdir -p docs/superpowers/archive
git mv docs/superpowers/specs/2026-05-21-premium-redesign-ai-assistant-design.md docs/superpowers/archive/
git mv docs/superpowers/plans/2026-05-21-premium-visual-redesign.md docs/superpowers/archive/
```

- [ ] **Step 4: Verify nothing imports the deleted files**

Run: `npm run build`
Expected: build completes with no errors. If the build fails with an unresolved import, the importing file still references deleted code — open it and remove the dead import (the stores and `api/operations` are kept and may still be imported by the auth flow; that is expected and fine).

- [ ] **Step 5: Run the test suite**

Run: `npm run test:unit`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove the old eisenhower UI and archive superseded specs"
```

---

### Task 19: Auth retheme

**Files:**
- Modify: `src/views/auth/AuthLayout.vue`, `LoginView.vue`, `RegisterView.vue`, `ForgotPasswordView.vue`, `ResetPasswordView.vue`

- [ ] **Step 1: Retheme `AuthLayout.vue`**

Replace the template/styles so it renders a centered card on the warm background. Keep any `<slot />` and existing script logic:

```vue
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
```

- [ ] **Step 2: Retheme the four auth views**

For each of `LoginView.vue`, `RegisterView.vue`, `ForgotPasswordView.vue`, `ResetPasswordView.vue`:

1. Keep all `<script>` logic, form state, validation, store calls, the demo login, and Google OAuth handling exactly as-is.
2. Replace raw `<input>` elements with the `TextField` primitive (`import TextField from '@/components/ui/TextField.vue'`), binding `v-model` to the same refs.
3. Replace the primary submit button with `<Button variant="accent" type="submit">` (`import Button from '@/components/ui/Button.vue'`); replace secondary actions/links with `<Button variant="ghost">` or token-styled `<RouterLink>`s (`text-accent`, `text-muted`).
4. Replace any hardcoded colors with tokens (`text-ink`, `text-muted`, `bg-paper-2`, `border-rule-soft`).
5. Headings use `font-serif` with an italic emphasis word (e.g. Login: "Welcome <em>back.</em>").

- [ ] **Step 3: Verify**

Run: `npm run dev`, open `http://localhost:3100/auth/login` (sign out first if needed).
Expected: the login, register, forgot-password, and reset-password screens render on the warm background with the serif wordmark, themed inputs, and an orange primary button. The forms still submit and validate. Toggle to dark mode (the mode persists via `localStorage`) and confirm the auth screens recolor. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/views/auth
git commit -m "feat: retheme auth screens to the warm design system"
```

---

### Task 20: Final verification

**Files:** none — this is a verification pass.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:unit`
Expected: all tests PASS.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build completes with no errors or unresolved imports.

- [ ] **Step 3: Manual QA**

Run: `npm run dev` and open `http://localhost:3100`. Confirm:

1. The app boots into the 3-column shell after login; no console errors.
2. Every sidebar destination (Today, Chores, Projects, Calendar, Stats, Journal, Inbox, Chat, Daily review, Settings) loads its placeholder with the correct heading.
3. The TopBar mode toggle flips light/dark; the choice survives a page reload.
4. Open devtools and run `document.documentElement.setAttribute('data-theme','ink')`, then `'blueprint'`, then `'rose'` — every surface, text color, and border recolors with no hardcoded color leaking through. Repeat with `data-mode` set to `dark`.
5. The auth screens render correctly in all 4 themes × light/dark.
6. Navigating to a removed path (e.g. `/briefing`) redirects to `/`.

- [ ] **Step 4: Fix and re-verify**

If any check fails, fix the cause, re-run Steps 1–3, then commit the fix with a `fix:` message. If everything passes, the Foundation web sub-project is complete — no commit needed for this task.

---

## Spec Coverage

Each section of `docs/superpowers/specs/2026-05-21-foundation-design-system-design.md` maps to tasks here:

- **Token system** (§1) — Tasks 3–4.
- **Shared primitives** (§2) — Tasks 5–11 (all 11 primitives plus the icon map).
- **Web app shell** (§3) — Tasks 12–15.
- **Routing & placeholder screens** (§5) — Tasks 16–17.
- **Removing the old UI** (§6) — Task 18.
- **Auth retheme** (§7) — Task 19.
- **Verification** — Tasks 2, 4, 5–11, 15, 20.
