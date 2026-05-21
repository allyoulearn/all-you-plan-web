# Premium Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `all-you-plan-web` a premium, Linear/Superhuman-tier visual identity — layered surfaces, gradient depth, a dashboard stats row, and purposeful motion — without changing any API or routes.

**Architecture:** A bottom-up visual upgrade. Phase 1 establishes design tokens and shared CSS (the foundation every later phase depends on). Phases 2-5 apply that foundation to the shell, dashboard, task interactions, and remaining cards. Three small new presentational components are added (`ProgressRing`, `StatCard`, `StatsRow`); every other change modifies an existing file in place.

**Tech Stack:** Vue 3 (Options API, `setup()`), Vite, Tailwind CSS 3 (`darkMode: 'class'`), scoped SCSS with BEM naming, Pinia, vue-i18n, Heroicons.

**Scope boundary — this is Plan 1 of 2.** It implements spec sections 1 (Visual System), 2 (Dashboard), 5 (Shell & Navigation), and 6 (Task Interactions) from `docs/superpowers/specs/2026-05-21-premium-redesign-ai-assistant-design.md`. The AI assistant panel and inline AI suggestions (spec sections 3 and 4) are **Plan 2**, written separately because they form an independent subsystem that builds on this foundation. Where a spec item depends on the AI panel, this plan explicitly defers it and says so.

**Verification approach.** This app has no test runner (no `vitest`, no `test` script in `package.json`) and every change here is visual — markup, CSS, and motion. Unit tests cannot meaningfully assert "the sidebar has a gradient." Verification is therefore done in the browser using the preview tools: after each phase, start/refresh the dev server, screenshot the affected screens, and confirm `preview_console_logs` shows no errors. This is a deliberate, honest deviation from the skill's default TDD structure — there is no logic here to test-drive.

**Commit strategy.** The user's conventions (`CLAUDE.md`, memory) require **batch commits** — "complete the work, verify, then commit once," not incremental commits while iterating. This plan therefore commits **once per phase**: each phase is a complete, independently verified unit of work (not a partial fix mid-iteration). That is five commits total. If a single squashed commit is preferred, squash the five at the end. Every commit step lists exact file paths — never `git add -A` — because the repository has unrelated pre-existing uncommitted changes that must not be swept in.

**Spec deviation (recorded).** Spec section 2 specified a "completion rate" stat as a progress ring. Investigation of the API (`all-you-plan-api/src/domains/tasks/resolvers.ts`) showed `tasksDueToday` excludes completed tasks and no date-filtered "completed today" query exists, so a true daily completion rate cannot be computed client-side without fetching the user's entire task history. The third dashboard stat is therefore a **streak ring** (current streak vs. personal best), sourced from `briefing.streak` which the dashboard already loads. The `ProgressRing` component is still built and used. If a true completion-rate metric is wanted later, it needs a small API addition and is out of scope here.

---

## File Structure

### New files (3)

| File | Responsibility |
| --- | --- |
| `src/components/common/ProgressRing.vue` | Generic SVG circular-progress ring. Props: `value` (0-100), `size`, `stroke`, `color`. Center slot. No app logic. |
| `src/components/dashboard/StatCard.vue` | Generic stat card: a left "visual" slot, a large value, and a label. Pure presentation. |
| `src/components/dashboard/StatsRow.vue` | Composes three `StatCard`s (Overdue, Due today, Streak) from a `briefing` prop. Handles a null briefing. |

### Modified files (16)

| File | Change summary |
| --- | --- |
| `tailwind.config.mjs` | Add gradient `backgroundImage`, `floating`/`ambient-glow` shadows, `ripple`/`message-in`/`number-flip` animations + keyframes. |
| `src/assets/main.css` | Body gradient background, standardised focus ring, `.surface-floating`, `.surface-accent`, `.radial-glow`. |
| `src/App.vue` | Wrap `<router-view>` in a `page` transition. |
| `src/components/layout/AppLayout.vue` | Sidebar wrapper transparent (sidebar owns its gradient); mobile overlay gets backdrop blur. |
| `src/components/layout/AppSidebar.vue` | Gradient background, active-item accent bar, space-dot hover glow, avatar ring, logout-icon dim. |
| `src/components/layout/AppHeader.vue` | Gradient bottom-border line, bell wiggle on new nudge, page-title fade on navigation. |
| `src/views/DashboardView.vue` | Larger title, insert `StatsRow`. |
| `src/components/dashboard/BriefingBanner.vue` | Gradient background, radial glow, gradient AI avatar by the greeting. |
| `src/components/dashboard/QuadrantCard.vue` | Gradient accent bar, circular count badge (monospace). |
| `src/components/tasks/TaskRow.vue` | Completion: quadrant-colour fill + ripple + fade-out delay; subtask-count number flip. |
| `src/components/tasks/SubtaskList.vue` | Add-item slide-down (TransitionGroup), animated strikethrough reveal. |
| `src/components/tasks/QuickAddFab.vue` | Ambient glow layer; fix broken focus CSS variable. |
| `src/components/tasks/TaskSlideOver.vue` | Filled quadrant chips with check icon, "Saved" auto-save indicator, fix broken focus CSS variable. |
| `src/i18n/index.js` | Add `common.saved` key. |
| `src/components/common/GlassCard.vue` | Optional `accent` prop rendering a top accent bar. |
| `src/components/spaces/SpaceCard.vue` | Hover lift, space-colour dot glow. |
| `src/views/SpaceView.vue` | Larger title; polished empty state. |

`src/components/dashboard/EisenhowerMatrix.vue` is intentionally **not** modified in this plan — its only spec change (sparkle dots) belongs to Plan 2.

---

## Phase 0: Branch setup

### Task 0.1: Create the feature branch

**Files:** none (git only)

- [ ] **Step 1: Confirm the working directory and current branch**

Run: `cd "/Users/lucas/Documents/Development/All You Development/All You Plan/all-you-plan-web" && git branch --show-current && git status --short`
Expected: branch `main`. There may be pre-existing modified files (e.g. `src/api/operations/briefings.js`) — leave them alone; they are unrelated work.

- [ ] **Step 2: Create and switch to the feature branch**

Run: `git checkout -b feat/premium-visual-redesign`
Expected: `Switched to a new branch 'feat/premium-visual-redesign'`

Note: any pre-existing uncommitted changes travel onto this branch untouched. They are never staged by this plan — every commit step below names explicit files.

---

## Phase 1: Visual System Foundation

Establishes the design tokens and shared CSS. No screen looks dramatically different yet, but later phases depend entirely on what this phase adds.

### Task 1.1: Extend the Tailwind theme

**Files:**
- Modify: `tailwind.config.mjs`

- [ ] **Step 1: Replace the file with the extended theme**

Replace the entire contents of `tailwind.config.mjs` with:

```js
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#effcfc', 100: '#d6f5f5', 200: '#b0ebeb',
          300: '#7adcdc', 400: '#3ec4c4', 500: '#1b9e9e',
          600: '#0d7377', 700: '#0f5f62', 800: '#124d50',
          900: '#134043', 950: '#042628',
        },
        accent: {
          50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8',
          300: '#f9a8d4', 400: '#f472b6', 500: '#e84393',
          600: '#c2185b', 700: '#9d174d', 800: '#831843',
          900: '#500724', 950: '#2e0515',
        },
        secondary: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a', 950: '#020617',
        },
        'q-do': { DEFAULT: '#f05a28', light: '#ff7b4f', dark: '#c44218' },
        'q-schedule': { DEFAULT: '#74b9ff', light: '#a3d1ff', dark: '#4a9ae0' },
        'q-delegate': { DEFAULT: '#f9e54d', light: '#fbed7a', dark: '#d4c22f' },
        'q-drop': { DEFAULT: '#7f8fa6', light: '#a0aec0', dark: '#5a6a80' },
        success: { DEFAULT: '#55efc4', light: '#81f5d8', dark: '#2dd4a8' },
        danger: { DEFAULT: '#ff6b6b', light: '#ff9b9b', dark: '#e64545' },
        surface: {
          light: '#ffffff',
          dark: '#0d1a2d',
        },
        background: {
          light: '#f0f4f8',
          dark: '#0d1a2d',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        glass: '20px',
        btn: '14px',
        input: '10px',
      },
      backgroundImage: {
        'app-base': 'linear-gradient(180deg, #0c1424 0%, #0a1018 100%)',
        'app-sidebar': 'linear-gradient(180deg, #0d1526 0%, #091018 100%)',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0, 0, 0, 0.2)',
        'glass-hover': '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        glow: '0 0 20px rgba(27, 158, 158, 0.2)',
        'glow-accent': '0 0 20px rgba(232, 67, 147, 0.2)',
        modal: '0 20px 60px -12px rgba(0, 0, 0, 0.4)',
        floating: '0 16px 50px -12px rgba(0, 0, 0, 0.55), 0 0 28px rgba(27, 158, 158, 0.07)',
        'ambient-glow': '0 0 36px rgba(27, 158, 158, 0.10)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'check-bounce': 'checkBounce 0.4s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        ripple: 'ripple 0.5s ease-out',
        'message-in': 'messageIn 0.3s ease-out',
        'number-flip': 'numberFlip 0.3s ease-out',
      },
      keyframes: {
        checkBounce: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        messageIn: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        numberFlip: {
          '0%': { transform: 'translateY(-45%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

The only additions are `backgroundImage`, two `boxShadow` entries (`floating`, `ambient-glow`), three `animation` entries, and three `keyframes`. `message-in` is defined here even though it is consumed by Plan 2 — keyframes are cheap and the spec lists it as a foundation token.

### Task 1.2: Add the foundation CSS

**Files:**
- Modify: `src/assets/main.css`

- [ ] **Step 1: Replace the file with the extended stylesheet**

Replace the entire contents of `src/assets/main.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply text-secondary-100 font-sans antialiased;
    background: linear-gradient(180deg, #0c1424 0%, #0a1018 100%);
    background-attachment: fixed;
    min-height: 100vh;
  }

  body.light {
    @apply bg-background-light text-secondary-900;
    background-image: none;
  }

  /* Standardised focus ring for all form controls.
     Replaces ad-hoc per-component focus borders, including the previously
     broken `rgba(var(--color-primary-400-rgb), ...)` references. */
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: none;
    border-color: rgba(27, 158, 158, 0.5);
    box-shadow: 0 0 0 1px rgba(27, 158, 158, 0.3);
  }
}

@layer components {
  .glass {
    @apply bg-white/5 border-2 border-white/10 rounded-glass backdrop-blur-glass shadow-glass;
  }

  .glass:hover {
    @apply shadow-glass-hover;
  }

  .dark .glass {
    @apply bg-[rgba(27,158,158,0.07)] border-white/10;
  }

  .light .glass {
    @apply bg-[rgba(27,158,158,0.04)] border-black/10;
  }

  .glass-elevated {
    @apply bg-[rgba(27,158,158,0.12)] border-2 border-white/10 rounded-glass backdrop-blur-glass shadow-modal;
  }

  /* Floating tier: modals, slide-overs, the AI panel (Plan 2). */
  .surface-floating {
    @apply border border-white/10 rounded-glass shadow-floating;
    background: rgba(13, 26, 45, 0.94);
    backdrop-filter: blur(24px);
  }
}

@layer utilities {
  /* 2px gradient accent bar. Set --accent-color on the element. */
  .surface-accent {
    height: 2px;
    background: linear-gradient(90deg, var(--accent-color, #1b9e9e) 0%, transparent 85%);
  }

  /* Ambient radial glow. Set --glow-color; size with width/height; position via parent. */
  .radial-glow {
    position: absolute;
    pointer-events: none;
    border-radius: 9999px;
    background: radial-gradient(circle, var(--glow-color, rgba(27, 158, 158, 0.12)) 0%, transparent 70%);
  }
}
```

- [ ] **Step 2: Verify the foundation in the browser**

Use the preview tools: `preview_start` (or `preview_list` then `preview_start` if no server is running), then `preview_screenshot` of the dashboard route (`/`).
Expected: the app still renders; the page background is now a subtle top-to-bottom gradient (lighter `#0c1424` at top, darker `#0a1018` at bottom) instead of a flat fill. Run `preview_console_logs` — expected: no errors. Nothing else should look different yet.

### Task 1.3: Commit Phase 1

- [ ] **Step 1: Stage and commit the foundation**

```bash
git add tailwind.config.mjs src/assets/main.css
git commit -m "$(cat <<'EOF'
feat: add premium visual system tokens and foundation CSS

Gradient backgrounds, floating-surface and accent utilities, ambient
glow, and new motion keyframes. Foundation for the visual redesign.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Expected: one commit created. Run `git status --short` — expected: the two files no longer listed; any unrelated pre-existing changes still listed and untouched.

---

## Phase 2: Shell & Navigation

Applies the foundation to the app frame: route transitions, the sidebar, and the header.

### Task 2.1: Add page route transitions

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Replace `src/App.vue` with the transition-wrapped version**

```vue
<template>
  <Toaster position="top-right" :theme="isDark ? 'dark' : 'light'" />
  <router-view v-if="isAuthRoute" />
  <AppLayout v-else>
    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </AppLayout>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useDarkMode } from '@/composables/useDarkMode'
import AppLayout from '@/components/layout/AppLayout.vue'

export default {
  name: 'App',
  components: { Toaster, AppLayout },
  setup() {
    const route = useRoute()
    const { isDark } = useDarkMode()
    const isAuthRoute = computed(() => route.path.startsWith('/auth'))
    return { route, isDark, isAuthRoute }
  },
}
</script>

<style>
/* Unscoped: these classes are applied to route component roots, which are
   outside App.vue's scoped style scope. */
.page-enter-active,
.page-leave-active {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}
.page-enter-from {
  transform: translateY(8px);
  opacity: 0;
}
.page-leave-to {
  opacity: 0;
}
</style>
```

`route` is now returned from `setup()` so the template can key the transitioned component by `route.path`. The `<style>` block is intentionally unscoped.

### Task 2.2: Make the sidebar wrapper transparent and blur the mobile overlay

**Files:**
- Modify: `src/components/layout/AppLayout.vue`

- [ ] **Step 1: Update the `&__sidebar-wrapper` and `&__overlay` SCSS rules**

In `src/components/layout/AppLayout.vue`, in the `<style>` block, replace this rule:

```scss
  &__sidebar-wrapper {
    @apply hidden lg:flex lg:w-64 flex-col flex-shrink-0 border-r border-white/10;
    background: rgba(27, 158, 158, 0.04);
    backdrop-filter: blur(16px);
  }
```

with:

```scss
  &__sidebar-wrapper {
    @apply hidden lg:flex lg:w-64 flex-col flex-shrink-0;
  }
```

Then replace this rule:

```scss
  &__overlay {
    @apply fixed inset-0 z-30 bg-black/50 lg:hidden;
  }
```

with:

```scss
  &__overlay {
    @apply fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden;
  }
```

The sidebar background and border now live entirely on `AppSidebar` itself (Task 2.3), so the wrapper no longer paints anything. The mobile overlay gains a glass-consistent blur.

### Task 2.3: Upgrade the sidebar

**Files:**
- Modify: `src/components/layout/AppSidebar.vue`

- [ ] **Step 1: Add `color` to the space-dot inline style**

In the template, replace:

```vue
            <span
              class="app-sidebar__space-dot"
              :style="{ background: space.color || '#3ec4c4' }"
            />
```

with:

```vue
            <span
              class="app-sidebar__space-dot"
              :style="{ background: space.color || '#3ec4c4', color: space.color || '#3ec4c4' }"
            />
```

Setting `color` equal to the background lets the hover glow use `currentColor`.

- [ ] **Step 2: Replace the `.app-sidebar` background, active nav item, space-dot, avatar, and logout-icon rules**

In the `<style>` block, replace this rule:

```scss
.app-sidebar {
  @apply flex flex-col h-full overflow-y-auto;
  background: rgba(27, 158, 158, 0.04);
  backdrop-filter: blur(16px);
```

with:

```scss
.app-sidebar {
  @apply flex flex-col h-full overflow-y-auto border-r border-white/10;
  background: linear-gradient(180deg, #0d1526 0%, #091018 100%);
```

(Leave the rest of the `.app-sidebar` block — `&__brand` and everything after — in place; only the opening declaration above changes.)

Replace the `&__nav-item` rule:

```scss
  &__nav-item {
    @apply flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium
           text-secondary-300 no-underline transition-all duration-150;

    &:hover {
      @apply bg-white/5 text-white;
    }

    &--active {
      @apply text-primary-400;
      background: rgba(27, 158, 158, 0.15);
    }
  }
```

with:

```scss
  &__nav-item {
    @apply relative flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium
           text-secondary-300 no-underline transition-all duration-150;

    &:hover {
      @apply bg-white/5 text-white;
    }

    &--active {
      @apply text-primary-300;
      background: rgba(27, 158, 158, 0.12);

      &::before {
        content: '';
        @apply absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full;
        background: theme('colors.primary.400');
      }
    }
  }
```

Replace the `&__space-dot` rule:

```scss
  &__space-dot {
    @apply w-2.5 h-2.5 rounded-full flex-shrink-0;
  }
```

with:

```scss
  &__space-dot {
    @apply w-2.5 h-2.5 rounded-full flex-shrink-0 transition-shadow duration-150;
  }
```

In the `&__space-link` rule, the existing `&:hover` block is:

```scss
    &:hover {
      @apply bg-white/5 text-secondary-200;
    }
```

Replace it with:

```scss
    &:hover {
      @apply bg-white/5 text-secondary-200;

      .app-sidebar__space-dot {
        box-shadow: 0 0 8px currentColor;
      }
    }
```

Replace the `&__avatar` rule:

```scss
  &__avatar {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-primary-300 flex-shrink-0;
    background: rgba(27, 158, 158, 0.3);
    border: 1px solid rgba(27, 158, 158, 0.4);
  }
```

with:

```scss
  &__avatar {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-primary-300 flex-shrink-0;
    background: rgba(27, 158, 158, 0.3);
    border: 1px solid rgba(27, 158, 158, 0.4);
    box-shadow: 0 0 0 3px rgba(27, 158, 158, 0.12);
  }
```

Replace the `&__logout-icon` rule:

```scss
  &__logout-icon {
    @apply w-4 h-4 flex-shrink-0;
  }
```

with:

```scss
  &__logout-icon {
    @apply w-4 h-4 flex-shrink-0 opacity-60 transition-opacity duration-150;
  }

  &__logout:hover &__logout-icon {
    @apply opacity-100;
  }
```

### Task 2.4: Upgrade the header

**Files:**
- Modify: `src/components/layout/AppHeader.vue`

- [ ] **Step 1: Add the bell-wiggle state and key the title**

Replace the entire `<script>` block of `src/components/layout/AppHeader.vue` with:

```vue
<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { BellIcon, Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth.store'
import { useNudgesStore } from '@/stores/nudges.store'

export default {
  name: 'AppHeader',
  components: {
    BellIcon,
    Bars3Icon,
  },
  emits: ['toggle-sidebar'],
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const authStore = useAuthStore()
    const nudgesStore = useNudgesStore()

    /** Briefly true after the unread count rises, to trigger the bell wiggle. */
    const bellWiggle = ref(false)

    const pageTitle = computed(() => {
      const title = route.meta?.title
      return title ? t(`nav.${title.toLowerCase()}`, title) : 'All You Plan'
    })

    const userInitial = computed(() => {
      const name = authStore.userName
      return name ? name.charAt(0).toUpperCase() : '?'
    })

    /** Wiggle the bell once whenever the unread nudge count increases. */
    watch(
      () => nudgesStore.unreadCount,
      (next, prev) => {
        if (next > prev) {
          bellWiggle.value = true
          setTimeout(() => {
            bellWiggle.value = false
          }, 400)
        }
      }
    )

    function handleBellClick() {
      // Future: open nudges panel
    }

    onMounted(() => {
      nudgesStore.fetchNudges(true)
    })

    return {
      t,
      nudgesStore,
      pageTitle,
      userInitial,
      bellWiggle,
      handleBellClick,
    }
  },
}
</script>
```

- [ ] **Step 2: Update the template — key the title, bind the wiggle class**

Replace this line in the template:

```vue
    <h1 class="app-header__title">{{ pageTitle }}</h1>
```

with:

```vue
    <h1 :key="pageTitle" class="app-header__title">{{ pageTitle }}</h1>
```

Keying the `<h1>` by its text forces a re-render on navigation so the entrance animation replays.

Replace this line:

```vue
        <BellIcon class="app-header__bell-icon" />
```

with:

```vue
        <BellIcon
          class="app-header__bell-icon"
          :class="{ 'app-header__bell-icon--wiggle': bellWiggle }"
        />
```

- [ ] **Step 3: Update the header SCSS — gradient border, title animation, bell wiggle**

Replace the `.app-header` opening declaration:

```scss
.app-header {
  @apply flex items-center gap-3 px-4 py-3 border-b border-white/10;
  background: rgba(13, 26, 45, 0.8);
  backdrop-filter: blur(16px);
```

with:

```scss
.app-header {
  @apply relative flex items-center gap-3 px-4 py-3;
  background: rgba(13, 26, 45, 0.8);
  backdrop-filter: blur(16px);

  &::after {
    content: '';
    @apply absolute left-0 right-0 bottom-0 h-px;
    background: linear-gradient(90deg, rgba(27, 158, 158, 0.4) 0%, transparent 70%);
  }
```

Replace the `&__title` rule:

```scss
  &__title {
    @apply flex-1 text-base font-semibold text-white m-0;
  }
```

with:

```scss
  &__title {
    @apply flex-1 text-base font-semibold text-white m-0;
    animation: fadeIn 0.15s ease-out;
  }
```

Replace the `&__bell-icon` rule:

```scss
  &__bell-icon {
    @apply w-5 h-5;
  }
```

with:

```scss
  &__bell-icon {
    @apply w-5 h-5;

    &--wiggle {
      animation: bellWiggle 0.4s ease-in-out;
    }
  }
```

Then add these keyframes at the very end of the `<style>` block, after the closing brace of `.app-header`:

```scss
@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes bellWiggle {
  0%, 100% { transform: rotate(0); }
  20%      { transform: rotate(-12deg); }
  40%      { transform: rotate(10deg); }
  60%      { transform: rotate(-6deg); }
  80%      { transform: rotate(3deg); }
}
```

(The `fadeIn` keyframes are declared locally because scoped-SCSS `animation:` references resolve against the component's own stylesheet, not Tailwind's generated keyframes.)

- [ ] **Step 4: Verify the shell in the browser**

Refresh the preview (`preview_eval` with `window.location.reload()` if HMR did not pick up). Then:
- `preview_screenshot` the dashboard. Expected: sidebar shows a vertical gradient (lighter at top); the active nav item has a 3px teal bar on its left edge; the header has a faint teal-to-transparent line along its bottom.
- `preview_click` a different nav item (e.g. Settings). Expected: the page content slides up + fades in over ~200ms; the header title fades.
- Resize narrow with `preview_resize` (e.g. 600px wide), open the mobile sidebar via the menu button. Expected: the overlay behind the sidebar is blurred.
- `preview_console_logs`. Expected: no errors.

### Task 2.5: Commit Phase 2

- [ ] **Step 1: Stage and commit the shell**

```bash
git add src/App.vue src/components/layout/AppLayout.vue src/components/layout/AppSidebar.vue src/components/layout/AppHeader.vue
git commit -m "$(cat <<'EOF'
feat: premium shell and navigation polish

Page route transitions, gradient sidebar with active-item accent,
gradient header border, bell wiggle on new nudges, blurred mobile
overlay.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Expected: one commit. `git status --short` shows the four files gone from the list.

---

## Phase 3: Dashboard

Adds the stats row and enriches the briefing banner and quadrant cards.

### Task 3.1: Create the ProgressRing component

**Files:**
- Create: `src/components/common/ProgressRing.vue`

- [ ] **Step 1: Create the file**

```vue
<template>
  <div
    class="progress-ring"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg
      class="progress-ring__svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
    >
      <circle
        class="progress-ring__track"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="stroke"
        fill="none"
      />
      <circle
        class="progress-ring__value"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${center} ${center})`"
      />
    </svg>
    <div class="progress-ring__center">
      <slot />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ProgressRing',
  props: {
    /** Progress value, 0-100. Clamped. */
    value: { type: Number, default: 0 },
    /** Outer diameter in pixels. */
    size: { type: Number, default: 44 },
    /** Ring stroke width in pixels. */
    stroke: { type: Number, default: 4 },
    /** Stroke colour of the progress arc. */
    color: { type: String, default: '#1b9e9e' },
  },
  setup(props) {
    const center = computed(() => props.size / 2)
    const radius = computed(() => (props.size - props.stroke) / 2)
    const circumference = computed(() => 2 * Math.PI * radius.value)

    /** Dash offset that renders the clamped value as an arc length. */
    const dashOffset = computed(() => {
      const clamped = Math.min(100, Math.max(0, props.value))
      return circumference.value * (1 - clamped / 100)
    })

    return { center, radius, circumference, dashOffset }
  },
}
</script>

<style lang="scss" scoped>
.progress-ring {
  @apply relative flex-shrink-0;

  &__svg {
    @apply block;
  }

  &__track {
    stroke: rgba(255, 255, 255, 0.08);
  }

  &__value {
    transition: stroke-dashoffset 0.4s ease-out;
  }

  &__center {
    @apply absolute inset-0 flex items-center justify-center;
  }
}
</style>
```

### Task 3.2: Create the StatCard component

**Files:**
- Create: `src/components/dashboard/StatCard.vue`

- [ ] **Step 1: Create the file**

```vue
<template>
  <div class="stat-card" :class="`stat-card--${tone}`">
    <div class="stat-card__visual">
      <slot name="visual" />
    </div>
    <div class="stat-card__text">
      <p class="stat-card__value">
        <slot />
      </p>
      <p class="stat-card__label">{{ label }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    /** Short label shown under the value. */
    label: { type: String, required: true },
    /** Visual tone: 'default' or 'danger' (tints the border/background). */
    tone: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'danger'].includes(v),
    },
  },
}
</script>

<style lang="scss" scoped>
.stat-card {
  @apply flex items-center gap-3 px-4 py-3 rounded-glass border;
  @apply border-white/10 transition-all duration-150;
  background: rgba(255, 255, 255, 0.03);

  &--danger {
    border-color: rgba(255, 107, 107, 0.18);
    background: rgba(255, 107, 107, 0.04);
  }

  &__visual {
    @apply flex-shrink-0 flex items-center justify-center;
  }

  &__text {
    @apply flex flex-col min-w-0;
  }

  &__value {
    @apply text-xl font-bold text-white leading-none m-0 font-mono;
  }

  &__label {
    @apply text-xs text-secondary-400 m-0 mt-1 truncate;
  }
}
</style>
```

### Task 3.3: Create the StatsRow component

**Files:**
- Create: `src/components/dashboard/StatsRow.vue`

- [ ] **Step 1: Create the file**

```vue
<template>
  <div class="stats-row">
    <!-- Overdue -->
    <StatCard :label="t('tasks.overdue')" tone="danger">
      <template #visual>
        <span
          class="stats-row__dot"
          :class="{ 'stats-row__dot--pulsing': overdueCount > 0 }"
        />
      </template>
      {{ overdueCount }}
    </StatCard>

    <!-- Due today -->
    <StatCard :label="t('briefing.dueToday')">
      <template #visual>
        <CalendarIcon class="stats-row__icon" />
      </template>
      {{ dueTodayCount }}
    </StatCard>

    <!-- Streak -->
    <StatCard :label="t('briefing.streak')">
      <template #visual>
        <ProgressRing :value="streakPercent" :size="40" :stroke="4" color="#f9e54d">
          <FireIcon class="stats-row__fire" />
        </ProgressRing>
      </template>
      {{ streakCurrent }}
    </StatCard>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarIcon, FireIcon } from '@heroicons/vue/24/outline'
import StatCard from '@/components/dashboard/StatCard.vue'
import ProgressRing from '@/components/common/ProgressRing.vue'

export default {
  name: 'StatsRow',
  components: { StatCard, ProgressRing, CalendarIcon, FireIcon },
  props: {
    /** Today's briefing object, or null if not yet generated. */
    briefing: { type: Object, default: null },
  },
  setup(props) {
    const { t } = useI18n()

    const overdueCount = computed(() => props.briefing?.overdueTasks?.length ?? 0)
    const dueTodayCount = computed(() => props.briefing?.dueTodayTasks?.length ?? 0)
    const streakCurrent = computed(() => props.briefing?.streak?.current ?? 0)

    /**
     * Streak ring fill: progress of the current streak toward the personal
     * best. Falls back to a 7-day target when there is no best yet.
     */
    const streakPercent = computed(() => {
      const current = streakCurrent.value
      const best = props.briefing?.streak?.best ?? 0
      if (current <= 0) return 0
      const target = best > 0 ? best : 7
      return Math.min(100, (current / target) * 100)
    })

    return {
      t,
      overdueCount,
      dueTodayCount,
      streakCurrent,
      streakPercent,
    }
  },
}
</script>

<style lang="scss" scoped>
.stats-row {
  @apply grid gap-3;
  grid-template-columns: repeat(3, 1fr);

  @media (max-width: 639px) {
    grid-template-columns: 1fr;
  }

  &__dot {
    @apply w-3 h-3 rounded-full;
    background: theme('colors.danger.DEFAULT');

    &--pulsing {
      animation: pulse 1.8s ease-in-out infinite;
    }
  }

  &__icon {
    @apply w-6 h-6 text-primary-400;
  }

  &__fire {
    @apply w-4 h-4 text-q-delegate;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}
</style>
```

This component reuses the existing i18n keys `tasks.overdue`, `briefing.dueToday`, and `briefing.streak` (all already used by `BriefingBanner.vue`), so no i18n change is needed here.

### Task 3.4: Insert the stats row into the dashboard

**Files:**
- Modify: `src/views/DashboardView.vue`

- [ ] **Step 1: Update the template**

Replace this block:

```vue
    <!-- Page heading -->
    <h1 class="dashboard-view__title">{{ t('dashboard.title') }}</h1>

    <!-- Briefing banner -->
    <BriefingBanner
      class="dashboard-view__briefing"
      :briefing="briefingsStore.todayBriefing"
      @generate="handleGenerate"
    />
```

with:

```vue
    <!-- Page heading -->
    <h1 class="dashboard-view__title">{{ t('dashboard.title') }}</h1>

    <!-- Stats row -->
    <StatsRow :briefing="briefingsStore.todayBriefing" />

    <!-- Briefing banner -->
    <BriefingBanner
      class="dashboard-view__briefing"
      :briefing="briefingsStore.todayBriefing"
      @generate="handleGenerate"
    />
```

- [ ] **Step 2: Register the `StatsRow` import**

Replace:

```vue
import BriefingBanner from '@/components/dashboard/BriefingBanner.vue'
import EisenhowerMatrix from '@/components/dashboard/EisenhowerMatrix.vue'

export default {
  name: 'DashboardView',
  components: { BriefingBanner, EisenhowerMatrix },
```

with:

```vue
import BriefingBanner from '@/components/dashboard/BriefingBanner.vue'
import EisenhowerMatrix from '@/components/dashboard/EisenhowerMatrix.vue'
import StatsRow from '@/components/dashboard/StatsRow.vue'

export default {
  name: 'DashboardView',
  components: { BriefingBanner, EisenhowerMatrix, StatsRow },
```

- [ ] **Step 3: Enlarge the dashboard title**

In the `<style>` block, replace:

```scss
  &__title {
    @apply text-xl font-bold text-primary-400 m-0;
  }
```

with:

```scss
  &__title {
    @apply text-2xl font-semibold text-white m-0;
  }
```

### Task 3.5: Upgrade the briefing banner

**Files:**
- Modify: `src/components/dashboard/BriefingBanner.vue`

- [ ] **Step 1: Add the radial glow and AI avatar to the template**

Replace the opening of the template:

```vue
  <div class="briefing-banner">
    <!-- No briefing: CTA state -->
```

with:

```vue
  <div class="briefing-banner">
    <!-- Ambient corner glow -->
    <span class="briefing-banner__glow radial-glow" aria-hidden="true" />

    <!-- No briefing: CTA state -->
```

Then replace the header block:

```vue
      <div class="briefing-banner__header">
        <p class="briefing-banner__greeting">{{ briefing.greeting }}</p>
```

with:

```vue
      <div class="briefing-banner__header">
        <div class="briefing-banner__greeting-group">
          <span class="briefing-banner__ai-avatar" aria-hidden="true" />
          <p class="briefing-banner__greeting">{{ briefing.greeting }}</p>
        </div>
```

- [ ] **Step 2: Update the SCSS — gradient background, glow, avatar, positioning**

Replace the `.briefing-banner` opening declaration:

```scss
.briefing-banner {
  @apply rounded-glass border border-white/10 backdrop-blur-glass shadow-glass;
  @apply border-l-4 px-4 py-3;
  background: rgba(255, 255, 255, 0.03);
  border-left-color: theme('colors.primary.500');
```

with:

```scss
.briefing-banner {
  @apply relative overflow-hidden rounded-glass border border-white/10 backdrop-blur-glass shadow-glass;
  @apply border-l-4 px-4 py-3;
  background: linear-gradient(135deg, rgba(27, 158, 158, 0.07) 0%, rgba(232, 67, 147, 0.045) 100%);
  border-left-color: theme('colors.primary.500');
```

Immediately after that opening declaration (before the `// ── CTA state ──` comment), add:

```scss
  // ── Ambient corner glow ──
  &__glow {
    --glow-color: rgba(27, 158, 158, 0.10);
    width: 160px;
    height: 160px;
    top: -80px;
    right: -50px;
  }
```

Replace the `&__header` rule:

```scss
  &__header {
    @apply flex items-start justify-between gap-3;
  }
```

with:

```scss
  &__header {
    @apply relative flex items-start justify-between gap-3;
  }

  &__greeting-group {
    @apply flex items-center gap-2 min-w-0;
  }

  &__ai-avatar {
    @apply w-5 h-5 rounded-full flex-shrink-0;
    background: linear-gradient(135deg, #1b9e9e 0%, #e84393 100%);
    box-shadow: 0 0 10px rgba(27, 158, 158, 0.35);
  }
```

The `__body` content sits above the glow because the glow is the first child with no positioning context competing — but to be safe, also replace the `&__body` rule:

```scss
  &__body {
    @apply mt-2.5 flex flex-col gap-2;
  }
```

with:

```scss
  &__body {
    @apply relative mt-2.5 flex flex-col gap-2;
  }
```

### Task 3.6: Upgrade the quadrant cards

**Files:**
- Modify: `src/components/dashboard/QuadrantCard.vue`

- [ ] **Step 1: Convert the accent bar to a gradient and the count to a badge**

In the template, replace:

```vue
    <!-- Colored top accent border -->
    <div class="quadrant-card__accent" :style="{ background: config.color }" />
```

with:

```vue
    <!-- Gradient top accent bar -->
    <div
      class="quadrant-card__accent surface-accent"
      :style="{ '--accent-color': config.color }"
    />
```

Then replace:

```vue
      <span class="quadrant-card__count" :style="{ color: config.color }">
        {{ tasks.length }}
      </span>
```

with:

```vue
      <span
        class="quadrant-card__count"
        :style="{ color: config.color, backgroundColor: config.color + '22' }"
      >
        {{ tasks.length }}
      </span>
```

The `+ '22'` suffix turns the quadrant hex (e.g. `#f05a28`) into an 8-digit hex with ~13% alpha (`#f05a2822`) for the badge background.

- [ ] **Step 2: Update the accent and count SCSS**

Replace the `&__accent` rule:

```scss
  // ── Accent border ──
  &__accent {
    @apply w-full h-1 flex-shrink-0;
  }
```

with:

```scss
  // ── Accent bar (height + gradient supplied by .surface-accent) ──
  &__accent {
    @apply w-full flex-shrink-0;
  }
```

Replace the `&__count` rule:

```scss
  &__count {
    @apply text-lg font-bold leading-none flex-shrink-0;
  }
```

with:

```scss
  &__count {
    @apply flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full;
    @apply text-sm font-bold font-mono leading-none;
  }
```

- [ ] **Step 3: Verify the dashboard in the browser**

Refresh the preview and navigate to `/`.
- `preview_screenshot` the dashboard. Expected: a three-card stats row sits below the title (Overdue with a dot, Due today with a calendar icon, Streak with a yellow ring around a fire icon); the briefing banner has a teal-to-pink gradient wash with a soft glow in its top-right and a small gradient dot before the greeting; each quadrant card shows a thin gradient bar at its very top and a circular tinted count badge.
- If no briefing exists yet, the stats row should still render showing `0`/`0`/`0` without errors.
- `preview_console_logs`. Expected: no errors.

### Task 3.7: Commit Phase 3

- [ ] **Step 1: Stage and commit the dashboard**

```bash
git add src/components/common/ProgressRing.vue src/components/dashboard/StatCard.vue src/components/dashboard/StatsRow.vue src/views/DashboardView.vue src/components/dashboard/BriefingBanner.vue src/components/dashboard/QuadrantCard.vue
git commit -m "$(cat <<'EOF'
feat: premium dashboard with stats row and enriched cards

Adds a three-stat row (overdue, due today, streak ring), a gradient
glowing briefing banner, and gradient-accented quadrant cards with
circular count badges.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Expected: one commit; the six files leave `git status --short`.

---

## Phase 4: Task Interactions

Adds motion and polish to completing, editing, and adding tasks.

### Task 4.1: Upgrade task-row completion

**Files:**
- Modify: `src/components/tasks/TaskRow.vue`

- [ ] **Step 1: Replace the `<script>` block**

Replace the entire `<script>` block of `src/components/tasks/TaskRow.vue` with:

```vue
<script>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckIcon, ClockIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { QUADRANT_CONFIG } from '@/utils/quadrantColors'
import QuadrantBadge from '@/components/common/QuadrantBadge.vue'

export default {
  name: 'TaskRow',
  components: { CheckIcon, ClockIcon, ChevronRightIcon, QuadrantBadge },
  props: {
    /** Task object */
    task: {
      type: Object,
      required: true,
    },
  },
  emits: ['select', 'complete'],
  setup(props, { emit }) {
    const { t } = useI18n()

    /** Optimistic checked state, drives the fill + ripple animation. */
    const checked = ref(false)

    /** True while the row plays its fade-out before emitting complete. */
    const completing = ref(false)

    /** Quadrant colour used for the checkbox fill and ripple. */
    const quadrantColor = computed(
      () => QUADRANT_CONFIG[props.task.quadrant]?.color ?? '#1b9e9e'
    )

    const formattedDue = computed(() => {
      if (!props.task.dueDate) return ''
      const due = new Date(props.task.dueDate)
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
      const diffDays = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Tomorrow'
      if (diffDays === -1) return 'Yesterday'
      if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`
      if (diffDays <= 7) return `In ${diffDays}d`
      return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    })

    const dueDateClass = computed(() => {
      if (!props.task.dueDate) return ''
      const due = new Date(props.task.dueDate)
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
      const diffDays = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return 'task-row__due--overdue'
      if (diffDays === 0) return 'task-row__due--today'
      return ''
    })

    const subtaskProgress = computed(() => {
      const subtasks = props.task.subtasks
      if (!subtasks || subtasks.length === 0) return null
      const done = subtasks.filter((s) => s.completed).length
      return `${done}/${subtasks.length}`
    })

    /** Emit select with the full task object. */
    function handleSelect() {
      emit('select', props.task)
    }

    /**
     * Optimistically fill the checkbox, play the ripple, fade the row,
     * then emit complete after a 1s delay so the user can see the result.
     */
    function handleComplete() {
      if (checked.value) return
      checked.value = true
      completing.value = true
      setTimeout(() => {
        emit('complete', props.task.id)
      }, 1000)
    }

    return {
      t,
      checked,
      completing,
      quadrantColor,
      formattedDue,
      dueDateClass,
      subtaskProgress,
      handleSelect,
      handleComplete,
    }
  },
}
</script>
```

- [ ] **Step 2: Update the template**

Replace the root element and checkbox block:

```vue
  <li class="task-row" @click="handleSelect">
    <!-- Checkbox for quick completion -->
    <button
      class="task-row__checkbox"
      :aria-label="t('tasks.complete')"
      :class="{ 'task-row__checkbox--checked': checked }"
      @click.stop="handleComplete"
    >
      <CheckIcon v-if="checked" class="task-row__check-icon task-row__check-icon--bounce" />
      <CheckIcon v-else class="task-row__check-icon" />
    </button>
```

with:

```vue
  <li
    class="task-row"
    :class="{ 'task-row--completing': completing }"
    @click="handleSelect"
  >
    <!-- Checkbox for quick completion -->
    <button
      class="task-row__checkbox"
      :aria-label="t('tasks.complete')"
      :class="{ 'task-row__checkbox--checked': checked }"
      :style="checked ? { background: quadrantColor, borderColor: quadrantColor } : {}"
      @click.stop="handleComplete"
    >
      <span
        v-if="checked"
        class="task-row__ripple"
        :style="{ background: quadrantColor }"
      />
      <CheckIcon v-if="checked" class="task-row__check-icon task-row__check-icon--bounce" />
      <CheckIcon v-else class="task-row__check-icon" />
    </button>
```

Then, to give the subtask counter a number flip, replace:

```vue
        <span
          v-if="subtaskProgress !== null"
          class="task-row__subtasks"
        >
          {{ subtaskProgress }}
        </span>
```

with:

```vue
        <span
          v-if="subtaskProgress !== null"
          :key="subtaskProgress"
          class="task-row__subtasks"
        >
          {{ subtaskProgress }}
        </span>
```

- [ ] **Step 3: Update the SCSS**

Replace the `.task-row` opening declaration:

```scss
.task-row {
  @apply flex items-center gap-3 px-3 py-2.5 cursor-pointer;
  @apply border-b border-white/5 transition-colors duration-150;
  @apply list-none;
```

with:

```scss
.task-row {
  @apply flex items-center gap-3 px-3 py-2.5 cursor-pointer;
  @apply border-b border-white/5;
  @apply list-none;
  transition: background-color 0.15s ease, opacity 0.3s ease;

  &--completing {
    @apply opacity-50 pointer-events-none;
  }
```

Replace the `&__checkbox` rule:

```scss
  // ── Checkbox ──
  &__checkbox {
    @apply flex-shrink-0 w-5 h-5 rounded-full border border-white/20 bg-transparent cursor-pointer;
    @apply flex items-center justify-center transition-all duration-150;

    &:hover {
      @apply border-white/50 bg-white/10;
    }

    &--checked {
      @apply border-primary-400 bg-primary-500/20;
    }
  }
```

with:

```scss
  // ── Checkbox ──
  &__checkbox {
    @apply relative flex-shrink-0 w-5 h-5 rounded-full border border-white/20 bg-transparent cursor-pointer;
    @apply flex items-center justify-center transition-all duration-150 overflow-visible;

    &:hover {
      @apply border-white/50 bg-white/10;
    }
  }

  // ── Completion ripple ──
  &__ripple {
    @apply absolute inset-0 rounded-full pointer-events-none;
    animation: ripple 0.5s ease-out;
  }
```

(The `--checked` modifier rule is removed because the checked fill colour is now applied inline as the quadrant colour.)

Finally, add the `ripple` keyframes at the end of the `<style>` block, after the existing `@keyframes checkBounce` block:

```scss
@keyframes ripple {
  0%   { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(2.4); opacity: 0; }
}
```

The `&__subtasks` rule already sets `font-mono`; add the flip animation by replacing:

```scss
  // ── Subtask progress ──
  &__subtasks {
    @apply text-xs text-secondary-500 font-mono;
  }
```

with:

```scss
  // ── Subtask progress ──
  &__subtasks {
    @apply text-xs text-secondary-500 font-mono;
    animation: numberFlip 0.3s ease-out;
  }
```

and add these keyframes at the end of the `<style>` block:

```scss
@keyframes numberFlip {
  0%   { transform: translateY(-45%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

### Task 4.2: Animate the subtask list

**Files:**
- Modify: `src/components/tasks/SubtaskList.vue`

- [ ] **Step 1: Convert the items list to a TransitionGroup**

In the template, replace:

```vue
    <ul v-if="subtasks && subtasks.length > 0" class="subtask-list__items">
      <li
        v-for="subtask in subtasks"
        :key="subtask.id"
        class="subtask-list__item"
        :class="{ 'subtask-list__item--done': subtask.completed }"
      >
```

with:

```vue
    <TransitionGroup
      v-if="subtasks && subtasks.length > 0"
      tag="ul"
      name="subtask"
      class="subtask-list__items"
    >
      <li
        v-for="subtask in subtasks"
        :key="subtask.id"
        class="subtask-list__item"
        :class="{ 'subtask-list__item--done': subtask.completed }"
      >
```

Then replace the closing `</ul>` of that list:

```vue
      </li>
    </ul>
```

with:

```vue
      </li>
    </TransitionGroup>
```

- [ ] **Step 2: Replace the strikethrough with an animated reveal and add transition CSS**

In the `<style>` block, replace the `&--done` rule inside `&__item`:

```scss
    &--done {
      .subtask-list__title {
        @apply line-through text-secondary-600;
      }
    }
```

with:

```scss
    &--done {
      .subtask-list__title {
        @apply text-secondary-600;
        background-size: 100% 1px;
      }
    }
```

Replace the `&__title` rule:

```scss
  // ── Title ──
  &__title {
    @apply text-sm text-secondary-200 leading-snug flex-1 min-w-0;
  }
```

with:

```scss
  // ── Title ──
  &__title {
    @apply text-sm text-secondary-200 leading-snug flex-1 min-w-0;
    background-image: linear-gradient(currentColor, currentColor);
    background-repeat: no-repeat;
    background-position: 0 60%;
    background-size: 0% 1px;
    transition: background-size 0.2s ease, color 0.2s ease;
  }
```

Then add, at the very end of the `<style>` block (after the closing brace of `.subtask-list`):

```scss
// ── Add/remove transitions for subtask items ──
.subtask-enter-active,
.subtask-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.subtask-enter-from,
.subtask-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
```

### Task 4.3: Add the ambient glow to the quick-add FAB and fix its focus CSS

**Files:**
- Modify: `src/components/tasks/QuickAddFab.vue`

- [ ] **Step 1: Add the ambient glow layer to the template**

Replace:

```vue
  <div class="quick-add-fab">
    <!-- FAB button -->
    <button
      class="quick-add-fab__btn"
      :aria-label="t('tasks.quickAdd')"
      @click="openModal"
    >
      <PlusIcon class="quick-add-fab__icon" />
    </button>
```

with:

```vue
  <div class="quick-add-fab">
    <!-- Ambient glow behind the button -->
    <span class="quick-add-fab__glow" aria-hidden="true" />

    <!-- FAB button -->
    <button
      class="quick-add-fab__btn"
      :aria-label="t('tasks.quickAdd')"
      @click="openModal"
    >
      <PlusIcon class="quick-add-fab__icon" />
    </button>
```

- [ ] **Step 2: Add the glow style and fix the broken focus declaration**

In the `<style>` block, inside the `.quick-add-fab` block, after the `&__icon` rule, add:

```scss
  &__glow {
    @apply absolute rounded-full pointer-events-none;
    width: 56px;
    height: 56px;
    background: radial-gradient(circle, rgba(27, 158, 158, 0.45) 0%, transparent 70%);
    animation: glowPulse 2.4s ease-in-out infinite;
  }
```

The `.quick-add-fab` container is already `position: fixed`, so the absolutely-positioned glow anchors to it; both the glow and the `56px` button center on the same spot.

Add the `glowPulse` keyframes at the very end of the `<style>` block:

```scss
@keyframes glowPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.12); }
}
```

Now fix the broken focus rule. In the `&__input` block, replace:

```scss
    &:focus {
      @apply bg-white;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(var(--color-primary-400-rgb), 0.5);
    }
```

with:

```scss
    &:focus {
      background: rgba(255, 255, 255, 0.08);
    }
```

The border/ring on focus is now supplied by the standardised `:focus-visible` rule added to `main.css` in Phase 1. The removed `rgba(var(--color-primary-400-rgb), 0.5)` referenced an undefined CSS variable and never worked.

Note (deferred to Plan 2): the spec's "space-selector shows colour dots" and "new task flashes in its destination quadrant" are intentionally **not** done here. A native `<select>` cannot render colour dots in its options, and the post-create flash requires cross-component coordination with `QuadrantCard`; both are revisited in Plan 2 alongside the AI work.

### Task 4.4: Add the i18n key for the auto-save indicator

**Files:**
- Modify: `src/i18n/index.js`

- [ ] **Step 1: Add a `saved` key to the `common` namespace**

Open `src/i18n/index.js`. Locate the `common` object inside the message definitions (it already contains keys such as `save`, `cancel`, `loading`, `error`). Add a `saved` entry alongside them, for every locale present in the file, matching the existing formatting and indentation. The English value is `'Saved'`. For example, if the file has:

```js
common: {
  save: 'Save',
  cancel: 'Cancel',
  loading: 'Loading...',
  error: 'Something went wrong',
},
```

it becomes:

```js
common: {
  save: 'Save',
  cancel: 'Cancel',
  loading: 'Loading...',
  error: 'Something went wrong',
  saved: 'Saved',
},
```

If only one locale (English) is defined, add it once. If multiple locales exist, add a translated `saved` to each, or reuse `'Saved'` if no translation is available.

### Task 4.5: Upgrade the task slide-over

**Files:**
- Modify: `src/components/tasks/TaskSlideOver.vue`

- [ ] **Step 1: Add the `savedVisible` state to the `<script>` block**

In `setup()`, after the line `const titleRef = ref(null)`, add:

```js
    /** Briefly true after an auto-save completes, drives the "Saved" pill. */
    const savedVisible = ref(false)
```

In the `emitSave` function, replace:

```js
    /** Build diff and emit save with updated fields */
    function emitSave() {
      if (!props.task) return
      emit('save', { ...localTask.value })
    }
```

with:

```js
    /** Build diff and emit save with updated fields; flash the "Saved" pill. */
    function emitSave() {
      if (!props.task) return
      emit('save', { ...localTask.value })
      savedVisible.value = true
      setTimeout(() => {
        savedVisible.value = false
      }, 1500)
    }
```

Then add `savedVisible` to the object returned from `setup()` — locate the `return { ... }` and add `savedVisible,` to it (for example, right after `titleRef,`).

- [ ] **Step 2: Add the "Saved" pill and check icons to the template**

Directly after the close button:

```vue
        <button class="slide-over__close" :aria-label="t('common.cancel')" @click="handleClose">
          <XMarkIcon class="slide-over__close-icon" />
        </button>
```

add:

```vue
        <!-- Auto-save indicator -->
        <Transition name="fade">
          <span v-if="savedVisible" class="slide-over__saved">{{ t('common.saved') }}</span>
        </Transition>
```

Then replace the quadrant chip button:

```vue
                <button
                  v-for="(cfg, key) in QUADRANT_CONFIG"
                  :key="key"
                  class="slide-over__quadrant-chip"
                  :class="{ 'slide-over__quadrant-chip--active': localTask.quadrant === key }"
                  :style="localTask.quadrant === key ? { background: cfg.color, borderColor: cfg.color } : {}"
                  @click="selectQuadrant(key)"
                >
                  {{ cfg.label }}
                </button>
```

with:

```vue
                <button
                  v-for="(cfg, key) in QUADRANT_CONFIG"
                  :key="key"
                  class="slide-over__quadrant-chip"
                  :class="{ 'slide-over__quadrant-chip--active': localTask.quadrant === key }"
                  :style="localTask.quadrant === key ? { background: cfg.color, borderColor: cfg.color } : {}"
                  @click="selectQuadrant(key)"
                >
                  <CheckIcon
                    v-if="localTask.quadrant === key"
                    class="slide-over__quadrant-check"
                  />
                  {{ cfg.label }}
                </button>
```

- [ ] **Step 3: Register the `CheckIcon` import**

Replace:

```js
import { XMarkIcon, SparklesIcon } from '@heroicons/vue/24/outline'
```

with:

```js
import { XMarkIcon, SparklesIcon, CheckIcon } from '@heroicons/vue/24/outline'
```

and replace:

```js
  components: { XMarkIcon, SparklesIcon, SubtaskList },
```

with:

```js
  components: { XMarkIcon, SparklesIcon, CheckIcon, SubtaskList },
```

- [ ] **Step 4: Add the SCSS for the "Saved" pill and chip check, and fix the broken focus rule**

In the `<style>` block, inside the `.slide-over` block, after the `&__close-icon` rule, add:

```scss
  // ── Auto-save indicator ──
  &__saved {
    @apply absolute top-5 right-16 z-10 px-2 py-0.5 rounded-full;
    @apply text-xs font-medium text-primary-200;
    background: rgba(27, 158, 158, 0.18);
    border: 1px solid rgba(27, 158, 158, 0.3);
  }
```

Inside the `&__quadrant-chip` rule, change the layout so the check icon sits inline. Replace:

```scss
  &__quadrant-chip {
    @apply px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer;
    @apply border border-white/10 bg-white/5 text-secondary-400;
    @apply transition-all duration-150;
```

with:

```scss
  &__quadrant-chip {
    @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer;
    @apply border border-white/10 bg-white/5 text-secondary-400;
    @apply transition-all duration-150;
```

After the `&__quadrant-chip` rule (after its closing brace), add:

```scss
  &__quadrant-check {
    @apply w-3 h-3;
  }
```

Now fix the broken focus rule. In the `&__input` block, replace:

```scss
    &:focus {
      @apply bg-white;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(var(--color-primary-400-rgb), 0.5);
    }
```

with:

```scss
    &:focus {
      background: rgba(255, 255, 255, 0.08);
    }
```

(The focus border/ring is now the standardised `:focus-visible` rule from Phase 1.)

- [ ] **Step 5: Verify task interactions in the browser**

Refresh the preview. Open a space with tasks (`/spaces/:id`) or use the dashboard.
- Complete a task via its checkbox (`preview_click` the round checkbox). Expected: the checkbox fills with the task's quadrant colour, a ripple expands from it, and the row fades to ~50% opacity, then disappears about a second later.
- Open the slide-over (`preview_click` a task row). Expected: selecting a quadrant chip shows a check icon inside the filled chip; editing a field and pausing shows a small "Saved" pill near the top-right for ~1.5s.
- Open the slide-over's subtask list, add a subtask. Expected: the new row slides in.
- `preview_console_logs`. Expected: no errors.

### Task 4.6: Commit Phase 4

- [ ] **Step 1: Stage and commit the interactions**

```bash
git add src/components/tasks/TaskRow.vue src/components/tasks/SubtaskList.vue src/components/tasks/QuickAddFab.vue src/components/tasks/TaskSlideOver.vue src/i18n/index.js
git commit -m "$(cat <<'EOF'
feat: premium task interaction motion and polish

Quadrant-colour completion fill with ripple and fade-out, animated
subtask reveal and add, slide-over check chips and auto-save pill,
ambient FAB glow. Fixes broken focus CSS variables.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Expected: one commit; the five files leave `git status --short`.

---

## Phase 5: Card & Space Polish

Final consistency pass on shared cards and the space view.

### Task 5.1: Add accent-bar support to GlassCard

**Files:**
- Modify: `src/components/common/GlassCard.vue`

- [ ] **Step 1: Replace the file**

```vue
<template>
  <component :is="tag" :class="['glass-card', $attrs.class]">
    <!-- Optional gradient accent bar -->
    <div
      v-if="accent"
      class="glass-card__accent surface-accent"
      :style="{ '--accent-color': accent }"
    />
    <!-- Default slot for card content -->
    <slot />
  </component>
</template>

<script>
export default {
  name: 'GlassCard',
  inheritAttrs: false,
  props: {
    /** HTML tag to render as the root element */
    tag: { type: String, default: 'div' },
    /** Optional accent colour; when set, renders a gradient bar at the top edge */
    accent: { type: String, default: '' },
  },
  setup() {
    return {}
  },
}
</script>

<style lang="scss" scoped>
// ── Block ──
.glass-card {
  @apply border border-white/10 rounded-glass backdrop-blur-glass shadow-glass overflow-hidden;
  background: rgba(255, 255, 255, 0.03);

  &__accent {
    @apply w-full;
  }
}
</style>
```

`overflow-hidden` is added so the accent bar respects the 20px card radius. This is backward compatible: `QuadrantCard` passes no `accent` prop, so its rendering is unchanged.

### Task 5.2: Polish the space card

**Files:**
- Modify: `src/components/spaces/SpaceCard.vue`

- [ ] **Step 1: Add `color` to the dot inline style**

In the template, replace:

```vue
    <span
      class="space-card__dot"
      :style="{ background: space.color || '#3ec4c4' }"
    />
```

with:

```vue
    <span
      class="space-card__dot"
      :style="{ background: space.color || '#3ec4c4', color: space.color || '#3ec4c4' }"
    />
```

- [ ] **Step 2: Update the SCSS — hover lift and dot glow**

Replace the `.space-card` hover block and `&__dot` rule. The current `&:hover`:

```scss
  &:hover {
    @apply border-white/20;
    background: rgba(255, 255, 255, 0.06);

    .space-card__chevron {
      @apply opacity-100;
    }
  }
```

becomes:

```scss
  &:hover {
    @apply border-white/20;
    background: rgba(255, 255, 255, 0.06);
    transform: translateX(2px);

    .space-card__chevron {
      @apply opacity-100;
    }

    .space-card__dot {
      box-shadow: 0 0 8px currentColor;
    }
  }
```

And add `transition` coverage — the `.space-card` already has `@apply transition-all duration-150`, which covers `transform`, so no change is needed there.

Replace the `&__dot` rule:

```scss
  &__dot {
    @apply w-3 h-3 rounded-full flex-shrink-0;
  }
```

with:

```scss
  &__dot {
    @apply w-3 h-3 rounded-full flex-shrink-0 transition-shadow duration-150;
  }
```

### Task 5.3: Polish the space view

**Files:**
- Modify: `src/views/SpaceView.vue`

- [ ] **Step 1: Enlarge the title**

In the `<style>` block, replace:

```scss
  &__title {
    @apply text-xl font-bold text-secondary-50 m-0 flex-1 min-w-0 truncate;
  }
```

with:

```scss
  &__title {
    @apply text-2xl font-semibold text-white m-0 flex-1 min-w-0 truncate;
  }
```

- [ ] **Step 2: Polish the empty state**

Replace:

```scss
  // ── Empty state ──
  &__empty {
    @apply flex flex-col items-center justify-center gap-3 py-20 text-secondary-500;
  }

  &__empty-icon {
    @apply w-10 h-10 opacity-40;
  }

  &__empty-text {
    @apply text-sm m-0;
  }
```

with:

```scss
  // ── Empty state ──
  &__empty {
    @apply flex flex-col items-center justify-center gap-3 py-20 text-secondary-500;
    @apply border border-white/10 rounded-glass;
    background: rgba(255, 255, 255, 0.02);
  }

  &__empty-icon {
    @apply w-12 h-12 opacity-40 text-primary-400;
  }

  &__empty-text {
    @apply text-sm m-0;
  }
```

Note (deferred to Plan 2): the spec's AI-aware empty state (a "break down a goal" ghost button that opens the AI panel) and the space-header sparkle insight chip are part of Plan 2, since they require the AI panel.

- [ ] **Step 3: Verify the final pass in the browser**

Refresh the preview.
- `preview_screenshot` a space view (`/spaces/:id`). Expected: the title is larger; space cards in the sidebar lift slightly and their colour dot glows on hover; an empty space shows a bordered, subtly-filled empty-state panel.
- `preview_console_logs`. Expected: no errors.
- Optionally `preview_resize` to a narrow width and confirm the stats row stacks to one column and nothing overflows.

### Task 5.4: Commit Phase 5

- [ ] **Step 1: Stage and commit the polish pass**

```bash
git add src/components/common/GlassCard.vue src/components/spaces/SpaceCard.vue src/views/SpaceView.vue
git commit -m "$(cat <<'EOF'
feat: card and space-view polish pass

Optional accent bar on GlassCard, space-card hover lift with dot glow,
larger space title, refined empty state.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Expected: one commit; the three files leave `git status --short`.

---

## Final Verification

- [ ] **Step 1: Full walkthrough**

With the preview server running, visit each route and confirm no console errors via `preview_console_logs`:
- `/` (dashboard) — gradient background, stats row, glowing briefing banner, accented quadrant cards.
- `/spaces/:id` (space) — larger title, task rows, completion animation.
- `/briefing`, `/settings` — render normally; page transition plays on navigation.
- `/auth/login` (log out first if needed) — auth screens are unaffected (they bypass `AppLayout`).

- [ ] **Step 2: Production build sanity check**

Run: `npm run build`
Expected: the build completes with no errors. (Tailwind must successfully resolve the new tokens; a typo in `tailwind.config.mjs` surfaces here.)

- [ ] **Step 3: Confirm the branch state**

Run: `git log --oneline feat/premium-visual-redesign ^main` (or `git log --oneline -6`)
Expected: five new commits, one per phase. The pre-existing unrelated changes remain uncommitted and untouched.

---

## Self-Review

**Spec coverage (sections 1, 2, 5, 6):**
- Section 1 (Visual System): tokens and CSS — Phase 1. Surfaces, accent, glow, focus ring, motion keyframes, typography (`text-2xl`/`font-semibold` titles, `font-mono` numerics) — covered across Phases 1, 3, 5.
- Section 2 (Dashboard): stats row, briefing banner, quadrant cards — Phase 3. The "completion rate" stat is deliberately a streak ring; deviation recorded at the top of this plan.
- Section 5 (Shell & Navigation): sidebar, header, page transitions, mobile overlay, FAB glow — Phases 2 and 4.
- Section 6 (Task Interactions): completion motion, slide-over, subtasks, quick-add — Phase 4.
- **Deferred to Plan 2 (explicitly noted in-task):** quadrant sparkle dots, briefing-banner CTA pill, sidebar AI button, FAB panel-aware shift, "Discuss with AI" link, quick-add space-selector colour dots, post-create quadrant flash, AI-aware empty states, space-header insight chip. All depend on the AI panel.

**Placeholder scan:** No "TBD"/"TODO"/"implement later". The one file not reproduced verbatim is `src/i18n/index.js` (Task 4.4) because its contents were not read; the task gives a concrete, pattern-based instruction with a worked example rather than a placeholder.

**Type/name consistency:** `surface-accent` and the `--accent-color` custom property are defined in Phase 1 and consumed identically in Phases 3 and 5. `ProgressRing` props (`value`, `size`, `stroke`, `color`) match between definition (Task 3.1) and use (Task 3.3). `StatCard` (`label`, `tone`, `#visual` slot) matches between Task 3.2 and 3.3. The `ripple`, `numberFlip`, `glowPulse`, `fadeIn`, and `bellWiggle` keyframes are declared locally in each scoped component that references them by name, because scoped-SCSS `animation:` declarations resolve keyframes from the component's own stylesheet, not from Tailwind's generated global keyframes (Tailwind's `animation` utilities like `animate-fade-in` remain available as classes where used).
