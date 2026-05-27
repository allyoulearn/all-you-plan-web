# Daily Review Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the passive four-card daily review with a Wren-led conversation that prompts for mood, wins, friction, leftover-task decisions, and tomorrow's intent — then closes with a dynamically composed send-off, dispatching reschedule/delete mutations on Finish.

**Architecture:** Eight new files under `src/components/review/` plus one pure composer module. A reusable `WrenTurn.vue` provides the prompt visual; each section component owns one concern and emits its state up to `ReviewView.vue`. The view holds canonical local state, hydrates from the store on mount, and orchestrates save + carry-forward mutations on Finish. No backend changes — uses existing `RESCHEDULE_TASK` (today.js) and `DELETE_TASK` (projects.js) mutations.

**Tech Stack:** Vue 3 (options API to match existing project style), Pinia, Apollo Client, vue-i18n, Tailwind via `@apply`, Vitest + @vue/test-utils + @pinia/testing.

**Spec:** [docs/superpowers/specs/2026-05-27-daily-review-redesign-design.md](../specs/2026-05-27-daily-review-redesign-design.md)

---

## File Map

New under `src/components/review/`:
- `sendoffComposer.js` — pure function `composeSendoff(input)` returning `{ headline, body }`
- `WrenTurn.vue` — reusable Wren prompt card with optional data callout
- `MoodPicker.vue` — 5-pill scale (heavy / low / steady / good / lit), `v-model` lowercase label
- `WinPicker.vue` — list of completed task rows with star toggles (cap 3) + free-text field
- `FrictionInput.vue` — auto-grow textarea + chip row
- `LeftoverRow.vue` — one row per pending task with action chips
- `TomorrowIntent.vue` — single-line input with soft counter
- `SendoffCard.vue` — Wren-turn that renders composed prose + Finish button

Edited:
- `src/views/ReviewView.vue` — full rewrite, becomes a thin composer
- `src/stores/review.store.js` — adds `previousLeftovers` ref + `leftoverDiff()` helper; `save()` signature unchanged (responses is now structured object, but graphql `JSON` scalar accepts either shape)
- `src/i18n/locales/en.json` — adds `review.wren.*`, `review.mood.*`, `review.win.*`, `review.friction.*`, `review.leftover.*`, `review.intent.*`, `review.sendoff.*`; removes unused `review.step*Label`, `review.sendoffQuote`, `review.noDoneTasks`, `review.noPendingTasks`
- `src/i18n/locales/{de,es,fr,pt-BR}.json` — remove the same unused keys; rely on en fallback for new keys
- `src/mocks/fixtures/review.js` — update mock `responses` to the new shape

New tests under `tests/components/review/`:
- `sendoffComposer.test.js`
- `WrenTurn.test.js`
- `MoodPicker.test.js`
- `WinPicker.test.js`
- `FrictionInput.test.js`
- `LeftoverRow.test.js`
- `TomorrowIntent.test.js`
- `SendoffCard.test.js`

Edited tests:
- `tests/views/ReviewView.test.js` — rewritten
- `tests/stores/review.store.test.js` — add cases for the leftover-diff helper

---

## Conventions to follow

- **Options API.** All existing components use the `export default { name, components, props, setup() { ... } }` pattern. New components follow the same shape.
- **Block-naming.** SCSS uses BEM-ish blocks scoped to each file (`.wren-turn__prompt`, `.mood-picker__pill`). One block per file.
- **Tailwind via `@apply`** inside the SCSS block — match existing files for tone/spacing primitives (`@apply rounded-pill px-3 py-1.5 …`).
- **No emoji.** No icons except via `AppIcon` (Heroicons). Wren mark uses the existing `wren` icon if present, otherwise a small `sparkles` glyph from Heroicons outline.
- **Dark mode.** Every color uses Tailwind tokens defined in `tailwind.config.js` that already have dark variants.
- **One concern per file.** Section components are dumb — they emit `update:modelValue` or named events and never reach into the store.
- **Tests live next to behavior.** Unit specs cover prop/event contracts. Composition tests live in `ReviewView.test.js`.

---

## Task 1: Pure send-off composer module

**Files:**
- Create: `src/components/review/sendoffComposer.js`
- Create: `tests/components/review/sendoffComposer.test.js`

- [ ] **Step 1.1: Write the failing tests**

Create `tests/components/review/sendoffComposer.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { composeSendoff } from '@/components/review/sendoffComposer.js'

describe('composeSendoff', () => {
  const base = {
    mood: 'steady',
    doneCount: 3,
    totalCount: 5,
    streak: 1,
    topWinTitle: '',
    tomorrowIntent: '',
    frictionTagCount: 0
  }

  it('returns a headline and body for every supported mood', () => {
    for (const mood of ['heavy', 'low', 'steady', 'good', 'lit']) {
      const out = composeSendoff({ ...base, mood })
      expect(typeof out.headline).toBe('string')
      expect(out.headline.length).toBeGreaterThan(0)
      expect(typeof out.body).toBe('string')
      expect(out.body.length).toBeGreaterThan(0)
    }
  })

  it('mentions the top win when one is provided and completion is partial', () => {
    const out = composeSendoff({
      ...base,
      mood: 'steady',
      doneCount: 3,
      totalCount: 5,
      topWinTitle: 'Mentor call prep'
    })
    expect(out.body).toContain('Mentor call prep')
  })

  it('mentions tomorrow intent when present', () => {
    const out = composeSendoff({
      ...base,
      tomorrowIntent: 'blog draft'
    })
    expect(out.body).toContain('blog draft')
  })

  it('does not mention an intent when the intent string is empty or whitespace', () => {
    const out = composeSendoff({ ...base, tomorrowIntent: '   ' })
    expect(out.body).not.toMatch(/tomorrow you said/i)
  })

  it('mentions streak only when streak is >= 3', () => {
    const low = composeSendoff({ ...base, streak: 2 })
    expect(low.body).not.toMatch(/days/i)

    const high = composeSendoff({ ...base, streak: 5 })
    expect(high.body).toMatch(/5 days/i)
  })

  it('uses an "all done" voice when doneCount equals totalCount and totalCount > 0', () => {
    const out = composeSendoff({
      ...base,
      mood: 'lit',
      doneCount: 4,
      totalCount: 4
    })
    expect(out.headline.toLowerCase()).not.toContain('some days')
    expect(out.body.toLowerCase()).toMatch(/everything|all of it|the whole list/)
  })

  it('uses a "nothing done" voice when doneCount is 0 and totalCount > 0', () => {
    const out = composeSendoff({
      ...base,
      mood: 'heavy',
      doneCount: 0,
      totalCount: 4
    })
    expect(out.body.toLowerCase()).toMatch(/some days|the day won|tomorrow is a clean page/)
  })

  it('handles an empty day (totalCount = 0) without crashing', () => {
    const out = composeSendoff({ ...base, doneCount: 0, totalCount: 0 })
    expect(typeof out.headline).toBe('string')
    expect(typeof out.body).toBe('string')
  })

  it('returns deterministic output for identical input', () => {
    const a = composeSendoff(base)
    const b = composeSendoff(base)
    expect(a).toEqual(b)
  })
})
```

- [ ] **Step 1.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/sendoffComposer.test.js`
Expected: FAIL — `Cannot find module '@/components/review/sendoffComposer'`

- [ ] **Step 1.3: Implement `composeSendoff`**

Create `src/components/review/sendoffComposer.js`:

```javascript
/**
 * Compose the daily-review send-off prose from today's data.
 *
 * Pure, deterministic, client-side. Branches on a small grid of
 * (mood × completion-bucket × intent presence) and surfaces streak/win/friction
 * details only when they exist.
 *
 * @param {object} input
 * @param {'heavy'|'low'|'steady'|'good'|'lit'} input.mood
 * @param {number} input.doneCount
 * @param {number} input.totalCount
 * @param {number} input.streak
 * @param {string} input.topWinTitle - optional, first starred completed task title
 * @param {string} input.tomorrowIntent - optional
 * @param {number} input.frictionTagCount - count of friction chips selected
 * @returns {{ headline: string, body: string }}
 */
export function composeSendoff(input) {
  const {
    mood,
    doneCount = 0,
    totalCount = 0,
    streak = 0,
    topWinTitle = '',
    tomorrowIntent = '',
    frictionTagCount = 0
  } = input || {}

  const completion = bucket(doneCount, totalCount)
  const intent = String(tomorrowIntent || '').trim()
  const win = String(topWinTitle || '').trim()
  const moodHeadline = HEADLINES[mood] ?? HEADLINES.steady

  const parts = []
  parts.push(pickOpener(mood, completion))

  if (completion === 'partial' && win) {
    parts.push(`${win} mattered.`)
  }

  if (intent) {
    parts.push(`Tomorrow you said: ${intent}. I'll put it at the top.`)
  }

  if (streak >= 3) {
    parts.push(`${streak} days running. Quietly building.`)
  }

  if (frictionTagCount >= 3 && mood !== 'lit') {
    parts.push("Noted the friction — we'll watch for the pattern.")
  }

  return {
    headline: moodHeadline,
    body: parts.join(' ')
  }
}

function bucket(done, total) {
  if (total <= 0) return 'empty'
  if (done <= 0) return 'none'
  if (done >= total) return 'all'
  return 'partial'
}

const HEADLINES = {
  heavy: 'Heavy day. You still showed up.',
  low: 'Quiet day.',
  steady: 'Solid showing.',
  good: 'Strong day.',
  lit: 'Lit up.'
}

const OPENERS = {
  heavy: {
    none: 'Some days the day wins. Tomorrow is a clean page.',
    partial: 'Heavy day, but you still moved a piece of it.',
    all: 'Heavy day and you cleared the list. That counts double.',
    empty: 'Heavy day. Rest counts.'
  },
  low: {
    none: 'Low energy and the list waited. That happens.',
    partial: 'Low energy but a few things moved.',
    all: 'Low energy and you cleared it anyway. Quiet win.',
    empty: 'Quiet day. That is allowed.'
  },
  steady: {
    none: "Steady day, even if the list didn't move.",
    partial: 'Steady progress.',
    all: 'Steady day, full list cleared.',
    empty: 'Steady. Nothing to clear.'
  },
  good: {
    none: 'Good day on the inside even if the list waited.',
    partial: 'Good day. Real progress.',
    all: 'Good day. Everything on the list.',
    empty: 'Good day.'
  },
  lit: {
    none: 'Energy was there even if the list waited.',
    partial: 'Lit up — a lot moved.',
    all: 'Everything on the list. All of it.',
    empty: 'Energy without the list. Useful in its own way.'
  }
}

function pickOpener(mood, completion) {
  return (OPENERS[mood] ?? OPENERS.steady)[completion] ?? OPENERS.steady.partial
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/sendoffComposer.test.js`
Expected: PASS, all 9 tests.

- [ ] **Step 1.5: Commit**

```bash
git add src/components/review/sendoffComposer.js tests/components/review/sendoffComposer.test.js
git commit -m "feat(review): pure send-off composer for daily review"
```

---

## Task 2: i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json` (add `review.*` keys, remove unused step keys)
- Modify: `src/i18n/locales/de.json` (remove unused step keys)
- Modify: `src/i18n/locales/es.json` (remove unused step keys)
- Modify: `src/i18n/locales/fr.json` (remove unused step keys)
- Modify: `src/i18n/locales/pt-BR.json` (remove unused step keys)

- [ ] **Step 2.1: Update en.json `review` block**

Open `src/i18n/locales/en.json`. Locate the existing `review` object. Replace its contents so the final block looks like:

```json
"review": {
  "headingPrefix": "How did",
  "headingEmphasis": "today feel?",
  "loading": "Loading…",
  "saving": "Saving…",
  "finishReview": "Finish review",
  "reviewSaved": "Review saved.",
  "edit": "Edit",
  "wren": {
    "open": "How did today feel?",
    "wins": "What mattered most?",
    "friction": "What got in the way?",
    "leftovers": "These didn't land — what do we do with them?",
    "intent": "If one thing happens tomorrow, what is it?"
  },
  "headline": "{done} of {total} done",
  "headlineStreak": " · {streak}-day streak",
  "mood": {
    "heavy": "heavy",
    "low": "low",
    "steady": "steady",
    "good": "good",
    "lit": "lit"
  },
  "win": {
    "freeTextLabel": "Anything off-list?",
    "freeTextPlaceholder": "A win that wasn't on today's list",
    "empty": "Some days nothing on the list moves. That's still a day.",
    "star": "Mark as a top win",
    "unstar": "Unmark top win"
  },
  "friction": {
    "placeholder": "What got in the way?",
    "tag": {
      "meetings": "meetings",
      "energy": "energy",
      "scope": "scope",
      "surprise": "surprise",
      "context-switch": "context-switch"
    }
  },
  "leftover": {
    "moveAll": "Move all to tomorrow",
    "action": {
      "tomorrow": "Tomorrow",
      "pick": "Pick day",
      "drop": "Drop",
      "keep": "Keep on today"
    },
    "empty": "Everything got done. Quiet flex.",
    "pickDayLabel": "Pick a date"
  },
  "intent": {
    "placeholder": "One thing for tomorrow",
    "counterRemaining": "{n} characters left"
  },
  "sendoff": {
    "saveError": "Review saved, but {n} task(s) couldn't be moved."
  }
}
```

If keys outside the `review` block already exist, do not touch them.

- [ ] **Step 2.2: Remove obsolete keys from other locales**

For each of `de.json`, `es.json`, `fr.json`, `pt-BR.json`, open the file and remove the following keys from the `review` block if present: `step1Label`, `step2Label`, `step3Label`, `step4Label`, `sendoffQuote`, `noDoneTasks`, `noPendingTasks`.

If a `review` block exists in those locales and they have translated values for `headingPrefix`, `headingEmphasis`, `loading`, `saving`, `finishReview`, `reviewSaved`, leave those alone — they still apply.

Do not add new keys to the non-en locales. Missing keys fall back to en (existing project pattern; verified by `tests/i18n/i18n.test.js`).

- [ ] **Step 2.3: Run the i18n test suite**

Run: `npx vitest run tests/i18n/i18n.test.js`
Expected: PASS (the test file checks fallback behavior; it should still pass).

- [ ] **Step 2.4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/de.json src/i18n/locales/es.json src/i18n/locales/fr.json src/i18n/locales/pt-BR.json
git commit -m "i18n(review): add keys for Wren-led review, remove unused step keys"
```

---

## Task 3: WrenTurn component

**Files:**
- Create: `src/components/review/WrenTurn.vue`
- Create: `tests/components/review/WrenTurn.test.js`

- [ ] **Step 3.1: Write the failing tests**

Create `tests/components/review/WrenTurn.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WrenTurn from '@/components/review/WrenTurn.vue'

const stubs = { AppIcon: { template: '<span class="icon" />' } }

describe('WrenTurn', () => {
  it('renders the prompt text', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'How did today feel?' },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('How did today feel?')
  })

  it('renders the optional data callout when provided', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p', callout: '5 of 8 · 3-day streak' },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('5 of 8 · 3-day streak')
  })

  it('does not render a callout element when callout prop is empty', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p' },
      global: { stubs }
    })
    expect(wrapper.find('.wren-turn__callout').exists()).toBe(false)
  })

  it('renders a Wren mark via AppIcon stub', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p' },
      global: { stubs }
    })
    expect(wrapper.find('.icon').exists()).toBe(true)
  })

  it('renders the default slot beneath the prompt', () => {
    const wrapper = mount(WrenTurn, {
      props: { prompt: 'p' },
      slots: { default: '<p class="custom-child">child</p>' },
      global: { stubs }
    })
    expect(wrapper.find('.custom-child').exists()).toBe(true)
  })
})
```

- [ ] **Step 3.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/WrenTurn.test.js`
Expected: FAIL — `Cannot find module '@/components/review/WrenTurn.vue'`

- [ ] **Step 3.3: Implement WrenTurn.vue**

Create `src/components/review/WrenTurn.vue`:

```vue
<template>
  <div class="wren-turn">
    <div class="wren-turn__header">
      <AppIcon name="sparkles" :size="16" class="wren-turn__mark" />
      <p class="wren-turn__prompt">{{ prompt }}</p>
    </div>

    <p v-if="callout" class="wren-turn__callout">{{ callout }}</p>

    <div v-if="$slots.default" class="wren-turn__body">
      <slot />
    </div>
  </div>
</template>

<script>
/** WrenTurn — reusable Wren-prompt visual used by every review section. */
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'WrenTurn',
  components: { AppIcon },
  props: {
    prompt: { type: String, required: true },
    callout: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.wren-turn {
  @apply mb-3 rounded-md bg-accent-soft p-4;

  &__header {
    @apply flex items-start gap-2;
  }

  &__mark {
    @apply mt-1 shrink-0 text-accent-ink opacity-80;
  }

  &__prompt {
    @apply font-serif text-[18px] italic leading-snug text-accent-ink;
  }

  &__callout {
    @apply mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink opacity-70;
  }

  &__body {
    @apply mt-3;
  }
}
</style>
```

If `AppIcon` does not recognize the `sparkles` name, fall back to `wren` (check `src/components/ui/iconMap.js` for the canonical name). If neither is available, use the first existing icon name in the map that resembles a Wren mark.

- [ ] **Step 3.4: Verify icon name**

Run: `grep -nE "'sparkles'|'wren'" src/components/ui/iconMap.js`
Expected: at least one match. If `sparkles` is missing but `wren` exists, change the `name="sparkles"` in WrenTurn.vue to `name="wren"`. If neither exists, change to any valid map entry. Re-run the test suite afterward.

- [ ] **Step 3.5: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/WrenTurn.test.js`
Expected: PASS, all 5 tests.

- [ ] **Step 3.6: Commit**

```bash
git add src/components/review/WrenTurn.vue tests/components/review/WrenTurn.test.js
git commit -m "feat(review): WrenTurn visual primitive"
```

---

## Task 4: MoodPicker component

**Files:**
- Create: `src/components/review/MoodPicker.vue`
- Create: `tests/components/review/MoodPicker.test.js`

- [ ] **Step 4.1: Write the failing tests**

Create `tests/components/review/MoodPicker.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import MoodPicker from '@/components/review/MoodPicker.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const stubs = {
  AppButton: {
    template: '<button :aria-checked="ariaChecked" @click="$emit(\'click\')"><slot /></button>',
    props: ['ariaChecked'],
    emits: ['click']
  }
}

function mountPicker(props = {}) {
  return mount(MoodPicker, {
    props: { modelValue: '', ...props },
    global: { plugins: [i18n], stubs }
  })
}

describe('MoodPicker', () => {
  it('renders five mood pills with the new labels', () => {
    const wrapper = mountPicker()
    for (const label of ['heavy', 'low', 'steady', 'good', 'lit']) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('emits update:modelValue with the lowercase label on click', async () => {
    const wrapper = mountPicker()
    const buttons = wrapper.findAll('button')
    await buttons[2].trigger('click') // steady
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['steady'])
  })

  it('marks the matching pill as checked when modelValue is set', () => {
    const wrapper = mountPicker({ modelValue: 'good' })
    const buttons = wrapper.findAll('button')
    const checked = buttons.filter(b => b.attributes('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0].text()).toContain('good')
  })

  it('accepts legacy mood values without crashing (no selection rendered)', () => {
    const wrapper = mountPicker({ modelValue: 'alight' })
    const checked = wrapper.findAll('button').filter(b => b.attributes('aria-checked') === 'true')
    expect(checked).toHaveLength(0)
  })

  it('uses radiogroup role with an aria-label', () => {
    const wrapper = mountPicker()
    const group = wrapper.find('[role="radiogroup"]')
    expect(group.exists()).toBe(true)
    expect(group.attributes('aria-label')).toBeTruthy()
  })
})
```

- [ ] **Step 4.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/MoodPicker.test.js`
Expected: FAIL — `Cannot find module '@/components/review/MoodPicker.vue'`

- [ ] **Step 4.3: Implement MoodPicker.vue**

Create `src/components/review/MoodPicker.vue`:

```vue
<template>
  <div class="mood-picker" role="radiogroup" :aria-label="t('review.wren.open')">
    <AppButton
      v-for="m in MOODS"
      :key="m"
      role="radio"
      :aria-checked="modelValue === m ? 'true' : 'false'"
      :variant="modelValue === m ? 'accent' : 'default'"
      size="sm"
      @click="$emit('update:modelValue', m)"
    >
      {{ t(`review.mood.${m}`) }}
    </AppButton>
  </div>
</template>

<script>
/** MoodPicker — 5-pill mood scale with single-select radiogroup semantics. */
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/ui/AppButton.vue'

const MOODS = ['heavy', 'low', 'steady', 'good', 'lit']

export default {
  name: 'MoodPicker',
  components: { AppButton },
  props: {
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup() {
    const { t } = useI18n()
    return { t, MOODS }
  }
}
</script>

<style lang="scss" scoped>
.mood-picker {
  @apply flex flex-wrap gap-2;
}
</style>
```

- [ ] **Step 4.4: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/MoodPicker.test.js`
Expected: PASS, all 5 tests.

- [ ] **Step 4.5: Commit**

```bash
git add src/components/review/MoodPicker.vue tests/components/review/MoodPicker.test.js
git commit -m "feat(review): MoodPicker with new 5-step scale"
```

---

## Task 5: WinPicker component

**Files:**
- Create: `src/components/review/WinPicker.vue`
- Create: `tests/components/review/WinPicker.test.js`

- [ ] **Step 5.1: Write the failing tests**

Create `tests/components/review/WinPicker.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import WinPicker from '@/components/review/WinPicker.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const stubs = { AppIcon: { template: '<span />' } }

const tasks = [
  { id: 't1', title: 'Mentor call prep', done: true },
  { id: 't2', title: 'Morning walk', done: true },
  { id: 't3', title: 'Weekly update', done: true },
  { id: 't4', title: 'Inbox zero', done: true }
]

function mountPicker(props = {}) {
  return mount(WinPicker, {
    props: { tasks, modelValue: { starred: [], freeText: '' }, ...props },
    global: { plugins: [i18n], stubs }
  })
}

describe('WinPicker', () => {
  it('renders one row per completed task', () => {
    const wrapper = mountPicker()
    expect(wrapper.findAll('.win-picker__row')).toHaveLength(4)
  })

  it('renders the empty state when tasks list is empty', () => {
    const wrapper = mountPicker({ tasks: [] })
    expect(wrapper.text()).toContain("Some days nothing on the list moves")
  })

  it('toggles a star on row click', async () => {
    const wrapper = mountPicker()
    await wrapper.findAll('.win-picker__row')[0].trigger('click')
    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events.at(-1)[0].starred).toEqual(['t1'])
  })

  it('un-stars when the same row is clicked twice', async () => {
    const wrapper = mountPicker({
      modelValue: { starred: ['t1'], freeText: '' }
    })
    await wrapper.findAll('.win-picker__row')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue').at(-1)[0].starred).toEqual([])
  })

  it('caps starred to 3 by unstarring the oldest when a 4th is added', async () => {
    const wrapper = mountPicker({
      modelValue: { starred: ['t1', 't2', 't3'], freeText: '' }
    })
    await wrapper.findAll('.win-picker__row')[3].trigger('click')
    const out = wrapper.emitted('update:modelValue').at(-1)[0].starred
    expect(out).toHaveLength(3)
    expect(out).not.toContain('t1')
    expect(out).toContain('t4')
  })

  it('emits free-text changes', async () => {
    const wrapper = mountPicker()
    const input = wrapper.find('input, textarea')
    await input.setValue('a win that was not on the list')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.freeText).toBe('a win that was not on the list')
  })
})
```

- [ ] **Step 5.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/WinPicker.test.js`
Expected: FAIL.

- [ ] **Step 5.3: Implement WinPicker.vue**

Create `src/components/review/WinPicker.vue`:

```vue
<template>
  <div class="win-picker">
    <p v-if="!tasks.length" class="win-picker__empty">
      {{ t('review.win.empty') }}
    </p>

    <ul v-else class="win-picker__list">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="win-picker__row"
        :class="{ 'win-picker__row--starred': isStarred(task.id) }"
        :aria-pressed="isStarred(task.id) ? 'true' : 'false'"
        role="button"
        tabindex="0"
        @click="toggle(task.id)"
        @keydown.enter.prevent="toggle(task.id)"
        @keydown.space.prevent="toggle(task.id)"
      >
        <AppIcon
          :name="isStarred(task.id) ? 'star-solid' : 'star'"
          :size="16"
          class="win-picker__icon"
          :aria-label="t(isStarred(task.id) ? 'review.win.unstar' : 'review.win.star')"
        />
        <span class="win-picker__title">{{ task.title }}</span>
      </li>
    </ul>

    <label class="win-picker__free-label">
      {{ t('review.win.freeTextLabel') }}
      <input
        type="text"
        class="win-picker__free-input"
        maxlength="280"
        :placeholder="t('review.win.freeTextPlaceholder')"
        :value="modelValue.freeText"
        @input="onFreeTextInput"
      />
    </label>
  </div>
</template>

<script>
/** WinPicker — star-toggle list of completed tasks plus a free-text field. */
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'WinPicker',
  components: { AppIcon },
  props: {
    tasks: { type: Array, required: true },
    modelValue: {
      type: Object,
      required: true,
      validator: v => v && Array.isArray(v.starred) && typeof v.freeText === 'string'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return { t, isStarred, toggle, onFreeTextInput }

    function isStarred(id) {
      return props.modelValue.starred.includes(id)
    }

    function toggle(id) {
      const starred = [...props.modelValue.starred]
      const idx = starred.indexOf(id)

      if (idx >= 0) {
        starred.splice(idx, 1)
      } else {
        starred.push(id)
        if (starred.length > 3) starred.shift()
      }

      emit('update:modelValue', { ...props.modelValue, starred })
    }

    function onFreeTextInput(e) {
      emit('update:modelValue', { ...props.modelValue, freeText: e.target.value })
    }
  }
}
</script>

<style lang="scss" scoped>
.win-picker {
  &__empty {
    @apply mb-3 text-[13px] text-muted;
  }

  &__list {
    @apply mb-3 flex flex-col gap-1;
  }

  &__row {
    @apply flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[14px] text-ink;
    @apply hover:bg-paper-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--starred {
      @apply bg-accent-soft text-accent-ink;
    }
  }

  &__icon {
    @apply shrink-0 opacity-80;
  }

  &__title {
    @apply flex-1;
  }

  &__free-label {
    @apply mt-2 block text-[12px] uppercase tracking-[0.12em] text-muted;
  }

  &__free-input {
    @apply mt-1 w-full rounded-md border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink;
    @apply focus:border-accent focus:outline-none;
  }
}
</style>
```

- [ ] **Step 5.4: Verify icon names**

Run: `grep -nE "'star'|'star-solid'" src/components/ui/iconMap.js`
If `star-solid` is missing, change `star-solid` to whatever the filled-star name is in the map (likely `starSolid` or `star-filled`). If `star` is missing, use the closest available outline icon. Update the component string accordingly.

- [ ] **Step 5.5: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/WinPicker.test.js`
Expected: PASS, all 6 tests.

- [ ] **Step 5.6: Commit**

```bash
git add src/components/review/WinPicker.vue tests/components/review/WinPicker.test.js
git commit -m "feat(review): WinPicker with star toggle and free-text field"
```

---

## Task 6: FrictionInput component

**Files:**
- Create: `src/components/review/FrictionInput.vue`
- Create: `tests/components/review/FrictionInput.test.js`

- [ ] **Step 6.1: Write the failing tests**

Create `tests/components/review/FrictionInput.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import FrictionInput from '@/components/review/FrictionInput.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function mountInput(props = {}) {
  return mount(FrictionInput, {
    props: { modelValue: { text: '', tags: [] }, ...props },
    global: { plugins: [i18n] }
  })
}

describe('FrictionInput', () => {
  it('renders the textarea and chip row', () => {
    const wrapper = mountInput()
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.findAll('.friction-input__chip')).toHaveLength(5)
  })

  it('emits update:modelValue with new text', async () => {
    const wrapper = mountInput()
    await wrapper.find('textarea').setValue('meetings ate the afternoon')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.text).toBe('meetings ate the afternoon')
    expect(ev.tags).toEqual([])
  })

  it('toggles a chip into tags', async () => {
    const wrapper = mountInput()
    await wrapper.findAll('.friction-input__chip')[0].trigger('click')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.tags).toContain('meetings')
  })

  it('removes a chip when toggled off', async () => {
    const wrapper = mountInput({ modelValue: { text: '', tags: ['meetings'] } })
    await wrapper.findAll('.friction-input__chip')[0].trigger('click')
    const ev = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(ev.tags).not.toContain('meetings')
  })

  it('marks active chips with a pressed state', () => {
    const wrapper = mountInput({ modelValue: { text: '', tags: ['energy'] } })
    const chips = wrapper.findAll('.friction-input__chip')
    const energyChip = chips.find(c => c.text().toLowerCase().includes('energy'))
    expect(energyChip.attributes('aria-pressed')).toBe('true')
  })

  it('shows the counter when text length is at least 800 chars', async () => {
    const wrapper = mountInput({ modelValue: { text: 'x'.repeat(801), tags: [] } })
    expect(wrapper.find('.friction-input__counter').exists()).toBe(true)
  })

  it('hides the counter for short text', () => {
    const wrapper = mountInput({ modelValue: { text: 'short', tags: [] } })
    expect(wrapper.find('.friction-input__counter').exists()).toBe(false)
  })
})
```

- [ ] **Step 6.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/FrictionInput.test.js`
Expected: FAIL.

- [ ] **Step 6.3: Implement FrictionInput.vue**

Create `src/components/review/FrictionInput.vue`:

```vue
<template>
  <div class="friction-input">
    <textarea
      class="friction-input__textarea"
      rows="3"
      maxlength="1000"
      :placeholder="t('review.friction.placeholder')"
      :value="modelValue.text"
      @input="onTextInput"
    />

    <p v-if="showCounter" class="friction-input__counter">
      {{ remaining }}
    </p>

    <div class="friction-input__chips">
      <button
        v-for="tag in TAGS"
        :key="tag"
        type="button"
        class="friction-input__chip"
        :class="{ 'friction-input__chip--active': isActive(tag) }"
        :aria-pressed="isActive(tag) ? 'true' : 'false'"
        @click="toggleTag(tag)"
      >
        {{ t(`review.friction.tag.${tag}`) }}
      </button>
    </div>
  </div>
</template>

<script>
/** FrictionInput — auto-grow textarea + chip row for end-of-day friction. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const TAGS = ['meetings', 'energy', 'scope', 'surprise', 'context-switch']
const MAX = 1000

export default {
  name: 'FrictionInput',
  props: {
    modelValue: {
      type: Object,
      required: true,
      validator: v => v && typeof v.text === 'string' && Array.isArray(v.tags)
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const showCounter = computed(() => props.modelValue.text.length >= 800)
    const remaining = computed(() => `${MAX - props.modelValue.text.length} characters left`)

    return { t, TAGS, showCounter, remaining, isActive, toggleTag, onTextInput }

    function isActive(tag) {
      return props.modelValue.tags.includes(tag)
    }

    function toggleTag(tag) {
      const tags = [...props.modelValue.tags]
      const idx = tags.indexOf(tag)
      if (idx >= 0) tags.splice(idx, 1)
      else tags.push(tag)
      emit('update:modelValue', { ...props.modelValue, tags })
    }

    function onTextInput(e) {
      emit('update:modelValue', { ...props.modelValue, text: e.target.value })
    }
  }
}
</script>

<style lang="scss" scoped>
.friction-input {
  &__textarea {
    @apply w-full resize-y rounded-md border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink;
    @apply min-h-[5rem] max-h-[18rem];
    @apply focus:border-accent focus:outline-none;
  }

  &__counter {
    @apply mt-1 text-right font-mono text-[11px] text-muted;
  }

  &__chips {
    @apply mt-3 flex flex-wrap gap-2;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[12px] text-ink;
    @apply hover:border-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply border-accent bg-accent text-accent-ink;
    }
  }
}
</style>
```

- [ ] **Step 6.4: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/FrictionInput.test.js`
Expected: PASS, all 7 tests.

- [ ] **Step 6.5: Commit**

```bash
git add src/components/review/FrictionInput.vue tests/components/review/FrictionInput.test.js
git commit -m "feat(review): FrictionInput textarea + tag chips"
```

---

## Task 7: LeftoverRow component

**Files:**
- Create: `src/components/review/LeftoverRow.vue`
- Create: `tests/components/review/LeftoverRow.test.js`

- [ ] **Step 7.1: Write the failing tests**

Create `tests/components/review/LeftoverRow.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LeftoverRow from '@/components/review/LeftoverRow.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function mountRow(props = {}) {
  return mount(LeftoverRow, {
    props: {
      task: { id: 't1', title: 'Code review' },
      action: { kind: 'tomorrow' },
      ...props
    },
    global: { plugins: [i18n] }
  })
}

describe('LeftoverRow', () => {
  it('renders the task title', () => {
    const wrapper = mountRow()
    expect(wrapper.text()).toContain('Code review')
  })

  it('renders four action chips', () => {
    const wrapper = mountRow()
    expect(wrapper.findAll('.leftover-row__chip')).toHaveLength(4)
  })

  it('marks the matching chip as pressed', () => {
    const wrapper = mountRow({ action: { kind: 'drop' } })
    const pressed = wrapper.findAll('.leftover-row__chip').filter(c => c.attributes('aria-pressed') === 'true')
    expect(pressed).toHaveLength(1)
    expect(pressed[0].text().toLowerCase()).toContain('drop')
  })

  it('emits update:action with kind tomorrow on the Tomorrow chip click', async () => {
    const wrapper = mountRow({ action: { kind: 'keep' } })
    const chips = wrapper.findAll('.leftover-row__chip')
    const tomorrow = chips.find(c => c.text().toLowerCase().includes('tomorrow'))
    await tomorrow.trigger('click')
    expect(wrapper.emitted('update:action').at(-1)[0]).toEqual({ kind: 'tomorrow' })
  })

  it('emits update:action with kind drop on the Drop chip click', async () => {
    const wrapper = mountRow()
    const drop = wrapper.findAll('.leftover-row__chip').find(c => c.text().toLowerCase().includes('drop'))
    await drop.trigger('click')
    expect(wrapper.emitted('update:action').at(-1)[0]).toEqual({ kind: 'drop' })
  })

  it('shows a date input when action kind is pick', () => {
    const wrapper = mountRow({ action: { kind: 'pick', date: '2026-06-01' } })
    const input = wrapper.find('input[type="date"]')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('2026-06-01')
  })

  it('emits update:action with kind pick + chosen date on date input change', async () => {
    const wrapper = mountRow({ action: { kind: 'pick', date: '' } })
    const input = wrapper.find('input[type="date"]')
    await input.setValue('2026-06-05')
    expect(wrapper.emitted('update:action').at(-1)[0]).toEqual({ kind: 'pick', date: '2026-06-05' })
  })
})
```

- [ ] **Step 7.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/LeftoverRow.test.js`
Expected: FAIL.

- [ ] **Step 7.3: Implement LeftoverRow.vue**

Create `src/components/review/LeftoverRow.vue`:

```vue
<template>
  <div class="leftover-row">
    <span class="leftover-row__title">{{ task.title }}</span>

    <div class="leftover-row__chips">
      <button
        v-for="kind in KINDS"
        :key="kind"
        type="button"
        class="leftover-row__chip"
        :class="{ 'leftover-row__chip--active': action.kind === kind }"
        :aria-pressed="action.kind === kind ? 'true' : 'false'"
        @click="setKind(kind)"
      >
        {{ t(`review.leftover.action.${kind}`) }}
      </button>
    </div>

    <input
      v-if="action.kind === 'pick'"
      type="date"
      class="leftover-row__date"
      :aria-label="t('review.leftover.pickDayLabel')"
      :value="action.date || ''"
      @input="onDate"
    />
  </div>
</template>

<script>
/**
 * LeftoverRow — one pending-task row with action chips and an inline
 * date picker when the user chose "Pick day".
 */
import { useI18n } from 'vue-i18n'

const KINDS = ['tomorrow', 'pick', 'drop', 'keep']

export default {
  name: 'LeftoverRow',
  props: {
    task: { type: Object, required: true },
    action: {
      type: Object,
      required: true,
      validator: v => v && typeof v.kind === 'string'
    }
  },
  emits: ['update:action'],
  setup(_, { emit }) {
    const { t } = useI18n()
    return { t, KINDS, setKind, onDate }

    function setKind(kind) {
      if (kind === 'pick') emit('update:action', { kind: 'pick', date: '' })
      else emit('update:action', { kind })
    }

    function onDate(e) {
      emit('update:action', { kind: 'pick', date: e.target.value })
    }
  }
}
</script>

<style lang="scss" scoped>
.leftover-row {
  @apply flex flex-wrap items-center gap-2 py-2;

  &__title {
    @apply flex-1 min-w-[10rem] text-[14px] text-ink;
  }

  &__chips {
    @apply flex flex-wrap gap-1.5;
  }

  &__chip {
    @apply rounded-pill border border-rule-soft bg-paper-2 px-3 py-1 text-[12px] text-ink;
    @apply hover:border-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;

    &--active {
      @apply border-accent bg-accent text-accent-ink;
    }
  }

  &__date {
    @apply rounded-md border border-rule-soft bg-paper px-2 py-1 text-[13px] text-ink;
  }
}
</style>
```

- [ ] **Step 7.4: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/LeftoverRow.test.js`
Expected: PASS, all 7 tests.

- [ ] **Step 7.5: Commit**

```bash
git add src/components/review/LeftoverRow.vue tests/components/review/LeftoverRow.test.js
git commit -m "feat(review): LeftoverRow with carry-forward action chips"
```

---

## Task 8: TomorrowIntent component

**Files:**
- Create: `src/components/review/TomorrowIntent.vue`
- Create: `tests/components/review/TomorrowIntent.test.js`

- [ ] **Step 8.1: Write the failing tests**

Create `tests/components/review/TomorrowIntent.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TomorrowIntent from '@/components/review/TomorrowIntent.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function mountIntent(props = {}) {
  return mount(TomorrowIntent, {
    props: { modelValue: '', ...props },
    global: { plugins: [i18n] }
  })
}

describe('TomorrowIntent', () => {
  it('renders an input with the current value', () => {
    const wrapper = mountIntent({ modelValue: 'finish the blog draft' })
    expect(wrapper.find('input').element.value).toBe('finish the blog draft')
  })

  it('emits raw update:modelValue on input (no trimming during typing)', async () => {
    const wrapper = mountIntent()
    await wrapper.find('input').setValue('  ship the demo  ')
    // Trailing/leading whitespace is preserved during typing so the input
    // does not snap back as the user types; ReviewView trims before save.
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('  ship the demo  ')
  })

  it('hides the counter when value is short', () => {
    const wrapper = mountIntent({ modelValue: 'short' })
    expect(wrapper.find('.tomorrow-intent__counter').exists()).toBe(false)
  })

  it('shows the counter when value length is >= 60', () => {
    const wrapper = mountIntent({ modelValue: 'x'.repeat(61) })
    expect(wrapper.find('.tomorrow-intent__counter').exists()).toBe(true)
  })
})
```

- [ ] **Step 8.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/TomorrowIntent.test.js`
Expected: FAIL.

- [ ] **Step 8.3: Implement TomorrowIntent.vue**

Create `src/components/review/TomorrowIntent.vue`:

```vue
<template>
  <div class="tomorrow-intent">
    <input
      type="text"
      class="tomorrow-intent__input"
      maxlength="80"
      :placeholder="t('review.intent.placeholder')"
      :value="modelValue"
      @input="onInput"
    />

    <p v-if="showCounter" class="tomorrow-intent__counter">
      {{ t('review.intent.counterRemaining', { n: remaining }) }}
    </p>
  </div>
</template>

<script>
/** TomorrowIntent — single-line input for tomorrow's one-thing. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const MAX = 80

export default {
  name: 'TomorrowIntent',
  props: {
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const showCounter = computed(() => props.modelValue.length >= 60)
    const remaining = computed(() => MAX - props.modelValue.length)
    return { t, showCounter, remaining, onInput }

    function onInput(e) {
      emit('update:modelValue', e.target.value)
    }
  }
}
</script>

<style lang="scss" scoped>
.tomorrow-intent {
  &__input {
    @apply w-full rounded-md border border-rule-soft bg-paper px-3 py-2 text-[14px] text-ink;
    @apply focus:border-accent focus:outline-none;
  }

  &__counter {
    @apply mt-1 text-right font-mono text-[11px] text-muted;
  }
}
</style>
```

- [ ] **Step 8.4: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/TomorrowIntent.test.js`
Expected: PASS, all 4 tests.

- [ ] **Step 8.5: Commit**

```bash
git add src/components/review/TomorrowIntent.vue tests/components/review/TomorrowIntent.test.js
git commit -m "feat(review): TomorrowIntent single-line input"
```

---

## Task 9: SendoffCard component

**Files:**
- Create: `src/components/review/SendoffCard.vue`
- Create: `tests/components/review/SendoffCard.test.js`

- [ ] **Step 9.1: Write the failing tests**

Create `tests/components/review/SendoffCard.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SendoffCard from '@/components/review/SendoffCard.vue'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const stubs = {
  WrenTurn: {
    template: '<div class="wren-turn"><p class="prompt">{{ prompt }}</p><slot /></div>',
    props: ['prompt', 'callout']
  },
  AppButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled'],
    emits: ['click']
  }
}

function mountCard(props = {}) {
  return mount(SendoffCard, {
    props: {
      input: {
        mood: 'steady',
        doneCount: 3,
        totalCount: 5,
        streak: 1,
        topWinTitle: '',
        tomorrowIntent: '',
        frictionTagCount: 0
      },
      saving: false,
      disabled: false,
      saved: false,
      ...props
    },
    global: { plugins: [i18n], stubs }
  })
}

describe('SendoffCard', () => {
  it('renders the composed headline and body', () => {
    const wrapper = mountCard()
    expect(wrapper.find('.prompt').text().toLowerCase()).toContain('solid')
  })

  it('renders Finish button when not saved', () => {
    const wrapper = mountCard()
    expect(wrapper.find('button').text().toLowerCase()).toContain('finish')
  })

  it('shows Saving label when saving', () => {
    const wrapper = mountCard({ saving: true })
    expect(wrapper.text()).toContain('Saving')
  })

  it('disables Finish when disabled prop is true', () => {
    const wrapper = mountCard({ disabled: true })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('emits finish when clicked', async () => {
    const wrapper = mountCard()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('shows the saved state with an Edit button when saved is true', () => {
    const wrapper = mountCard({ saved: true })
    expect(wrapper.text()).toContain('Review saved')
    expect(wrapper.text()).toContain('Edit')
  })

  it('emits edit when the Edit button is clicked in saved state', async () => {
    const wrapper = mountCard({ saved: true })
    const editBtn = wrapper.findAll('button').find(b => b.text().includes('Edit'))
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
  })
})
```

- [ ] **Step 9.2: Run tests to verify they fail**

Run: `npx vitest run tests/components/review/SendoffCard.test.js`
Expected: FAIL.

- [ ] **Step 9.3: Implement SendoffCard.vue**

Create `src/components/review/SendoffCard.vue`:

```vue
<template>
  <div class="sendoff-card">
    <WrenTurn :prompt="prose.headline">
      <p class="sendoff-card__body">{{ prose.body }}</p>

      <div class="sendoff-card__action">
        <AppButton
          v-if="!saved"
          variant="primary"
          :disabled="disabled || saving"
          @click="$emit('finish')"
        >
          {{ saving ? t('review.saving') : t('review.finishReview') }}
        </AppButton>

        <template v-else>
          <p class="sendoff-card__saved">{{ t('review.reviewSaved') }}</p>
          <AppButton variant="ghost" size="sm" @click="$emit('edit')">
            {{ t('review.edit') }}
          </AppButton>
        </template>
      </div>
    </WrenTurn>
  </div>
</template>

<script>
/** SendoffCard — Wren-turn that renders the dynamically composed send-off. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WrenTurn from '@/components/review/WrenTurn.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { composeSendoff } from '@/components/review/sendoffComposer.js'

export default {
  name: 'SendoffCard',
  components: { WrenTurn, AppButton },
  props: {
    input: { type: Object, required: true },
    saving: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    saved: { type: Boolean, default: false }
  },
  emits: ['finish', 'edit'],
  setup(props) {
    const { t } = useI18n()
    const prose = computed(() => composeSendoff(props.input))
    return { t, prose }
  }
}
</script>

<style lang="scss" scoped>
.sendoff-card {
  &__body {
    @apply mt-3 text-[14px] leading-relaxed text-accent-ink;
  }

  &__action {
    @apply mt-4 flex items-center gap-3;
  }

  &__saved {
    @apply font-mono text-[11px] text-accent-ink opacity-70;
  }
}
</style>
```

- [ ] **Step 9.4: Run tests to verify they pass**

Run: `npx vitest run tests/components/review/SendoffCard.test.js`
Expected: PASS, all 7 tests.

- [ ] **Step 9.5: Commit**

```bash
git add src/components/review/SendoffCard.vue tests/components/review/SendoffCard.test.js
git commit -m "feat(review): SendoffCard wraps composer in a WrenTurn"
```

---

## Task 10: Extend review store with leftover-diff helper

**Files:**
- Modify: `src/stores/review.store.js`
- Modify: `tests/stores/review.store.test.js`

- [ ] **Step 10.1: Add failing test for `diffLeftovers`**

Add to the bottom of `tests/stores/review.store.test.js` (inside the existing `describe('review.store', ...)` block, before the closing brace):

```javascript
  describe('diffLeftovers()', () => {
    it('returns an empty diff when previous and next are identical', () => {
      const store = useReviewStore()
      const prev = { tomorrow: ['a'], picked: [], dropped: ['b'], kept: [] }
      const next = { tomorrow: ['a'], picked: [], dropped: ['b'], kept: [] }
      expect(store.diffLeftovers(prev, next)).toEqual({
        tomorrow: [],
        picked: [],
        dropped: []
      })
    })

    it('returns only newly-added ids for each kind', () => {
      const store = useReviewStore()
      const prev = { tomorrow: ['a'], picked: [], dropped: [], kept: [] }
      const next = {
        tomorrow: ['a', 'b'],
        picked: [{ id: 'c', date: '2026-06-01' }],
        dropped: ['d'],
        kept: []
      }
      expect(store.diffLeftovers(prev, next)).toEqual({
        tomorrow: ['b'],
        picked: [{ id: 'c', date: '2026-06-01' }],
        dropped: ['d']
      })
    })

    it('treats a missing previous payload as an empty baseline', () => {
      const store = useReviewStore()
      const next = { tomorrow: ['a'], picked: [], dropped: [], kept: [] }
      expect(store.diffLeftovers(null, next).tomorrow).toEqual(['a'])
    })

    it('does not return tasks that were already in the previous tomorrow set', () => {
      const store = useReviewStore()
      const prev = { tomorrow: ['a', 'b'], picked: [], dropped: [], kept: [] }
      const next = { tomorrow: ['a', 'b', 'c'], picked: [], dropped: [], kept: [] }
      expect(store.diffLeftovers(prev, next).tomorrow).toEqual(['c'])
    })
  })
```

- [ ] **Step 10.2: Run test to verify it fails**

Run: `npx vitest run tests/stores/review.store.test.js`
Expected: FAIL — `store.diffLeftovers is not a function`.

- [ ] **Step 10.3: Add `diffLeftovers` to the store**

Open `src/stores/review.store.js`. In the `defineStore(...)` setup function, between the existing `save` function and the `return` statement, add:

```javascript
  /**
   * Diff a new leftovers payload against the previously-saved one. Returns
   * only the *new* additions per kind, so consumers can fire reschedule /
   * delete mutations exactly once per decision.
   *
   * @param {object|null} prev - previously saved `responses.leftovers` or null
   * @param {object} next - the about-to-save `responses.leftovers`
   * @returns {{ tomorrow: string[], picked: {id:string,date:string}[], dropped: string[] }}
   */
  function diffLeftovers(prev, next) {
    const prevTomorrow = new Set(prev?.tomorrow ?? [])
    const prevDropped = new Set(prev?.dropped ?? [])
    const prevPickedKey = new Set(
      (prev?.picked ?? []).map(p => `${p.id}|${p.date}`)
    )

    return {
      tomorrow: (next.tomorrow ?? []).filter(id => !prevTomorrow.has(id)),
      dropped: (next.dropped ?? []).filter(id => !prevDropped.has(id)),
      picked: (next.picked ?? []).filter(p => !prevPickedKey.has(`${p.id}|${p.date}`))
    }
  }
```

And add `diffLeftovers` to the returned object: change the existing return line from

```javascript
  return { review, loading, saving, error, load, save }
```

to

```javascript
  return { review, loading, saving, error, load, save, diffLeftovers }
```

- [ ] **Step 10.4: Run tests to verify pass**

Run: `npx vitest run tests/stores/review.store.test.js`
Expected: PASS, including the new `diffLeftovers` block. All previous tests still pass.

- [ ] **Step 10.5: Commit**

```bash
git add src/stores/review.store.js tests/stores/review.store.test.js
git commit -m "feat(review.store): add diffLeftovers helper for carry-forward dedupe"
```

---

## Task 11: Update mock fixture

**Files:**
- Modify: `src/mocks/fixtures/review.js`

- [ ] **Step 11.1: Replace the mock responses with the new structured shape**

Open `src/mocks/fixtures/review.js`. Replace the entire file contents with:

```javascript
/** Mock fixtures for the Daily Review screen. */

const mockResponses = {
  wins: {
    starred: ['t1'],
    freeText: 'Got a 30-minute walk in the morning that I had not planned for.'
  },
  friction: {
    text: 'A few unplanned messages in the afternoon pulled me off deep work earlier than expected.',
    tags: ['surprise', 'context-switch']
  },
  leftovers: {
    tomorrow: ['t2'],
    picked: [],
    dropped: [],
    kept: []
  },
  tomorrowIntent: 'Finish the blog draft.'
}

export const registry = {
  dailyReview: variables => ({
    dailyReview: {
      id: 'dr1',
      date: variables.date ?? '2026-05-22',
      mood: 'good',
      responses: mockResponses
    }
  }),
  saveDailyReview: variables => ({
    saveDailyReview: {
      id: 'dr1',
      date: variables.date ?? '2026-05-22',
      mood: variables.mood ?? 'good',
      responses: variables.responses ?? mockResponses
    }
  })
}
```

- [ ] **Step 11.2: Sanity check — run the existing mock fixture tests**

Run: `npx vitest run tests/mocks/`
Expected: PASS (these tests check fixture registration, not shape).

- [ ] **Step 11.3: Commit**

```bash
git add src/mocks/fixtures/review.js
git commit -m "test(review): update mock fixture to new responses shape"
```

---

## Task 12: Rewrite ReviewView

**Files:**
- Modify: `src/views/ReviewView.vue` (full rewrite)
- Modify: `tests/views/ReviewView.test.js` (full rewrite)

This task replaces the existing ReviewView and its test file entirely.

- [ ] **Step 12.1: Write the failing view tests**

Replace the entire contents of `tests/views/ReviewView.test.js` with:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import ReviewView from '@/views/ReviewView.vue'
import { useTodayStore } from '@/stores/today.store'
import { useReviewStore } from '@/stores/review.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: true,
  AppCard: { template: '<div><slot /></div>' },
  WrenCrossAppUpsell: { template: '<div class="wren-upsell" />' },
  WrenTurn: { template: '<div class="wren-turn"><slot /></div>', props: ['prompt', 'callout'] },
  MoodPicker: {
    template: '<div class="mood-picker" @click="$emit(\'update:modelValue\', \'steady\')" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  WinPicker: {
    template: '<div class="win-picker" />',
    props: ['tasks', 'modelValue'],
    emits: ['update:modelValue']
  },
  FrictionInput: {
    template: '<div class="friction-input" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  LeftoverRow: {
    template: '<div class="leftover-row" />',
    props: ['task', 'action'],
    emits: ['update:action']
  },
  TomorrowIntent: {
    template: '<div class="tomorrow-intent" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  SendoffCard: {
    template: '<div class="sendoff-card"><button @click="$emit(\'finish\')">Finish</button></div>',
    props: ['input', 'saving', 'disabled', 'saved'],
    emits: ['finish', 'edit']
  }
}

function buildView(tasks = []) {
  return {
    date: '2026-05-22',
    kpis: { streak: 3, todayDone: 1, todayTotal: 3, activeProjects: 2, focusMinutes: 60 },
    tasks
  }
}

function mountReview(todayState = {}, reviewState = {}, todayOverrides = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      today: { view: null, loading: false, error: '', ...todayState },
      review: { review: null, loading: false, saving: false, error: '', ...reviewState }
    }
  })

  const wrapper = mount(ReviewView, {
    global: { stubs: globalStubs, plugins: [pinia, i18n] }
  })

  // Inject overrides on the store mock (rescheduleTask, etc.)
  const todayStore = useTodayStore()
  Object.assign(todayStore, todayOverrides)
  return { wrapper, todayStore, reviewStore: useReviewStore() }
}

describe('ReviewView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
  })

  // -- Mount / data load --

  it('calls todayStore.load and reviewStore.load on mount with the same date', () => {
    const { todayStore, reviewStore } = mountReview()
    expect(todayStore.load).toHaveBeenCalledTimes(1)
    expect(reviewStore.load).toHaveBeenCalledTimes(1)
    expect(todayStore.load.mock.calls[0][0]).toBe(reviewStore.load.mock.calls[0][0])
  })

  // -- Hydration from saved review --

  it('hydrates mood from the saved review', async () => {
    const { wrapper } = mountReview({}, {
      review: {
        id: 'r1',
        mood: 'good',
        responses: {
          wins: { starred: [], freeText: '' },
          friction: { text: '', tags: [] },
          leftovers: { tomorrow: [], picked: [], dropped: [], kept: [] },
          tomorrowIntent: ''
        }
      }
    })
    await flushPromises()
    expect(wrapper.vm.mood).toBe('good')
  })

  // -- Section rendering --

  it('renders all six Wren-led sections plus a sendoff card', () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true },
      { id: 't2', title: 'Pending', done: false }
    ]
    const { wrapper } = mountReview({ view: buildView(tasks) })

    expect(wrapper.find('.mood-picker').exists()).toBe(true)
    expect(wrapper.find('.win-picker').exists()).toBe(true)
    expect(wrapper.find('.friction-input').exists()).toBe(true)
    expect(wrapper.findAll('.leftover-row')).toHaveLength(1) // one pending task
    expect(wrapper.find('.tomorrow-intent').exists()).toBe(true)
    expect(wrapper.find('.sendoff-card').exists()).toBe(true)
  })

  it('shows leftovers empty state when no pending tasks', () => {
    const tasks = [{ id: 't1', title: 'Done', done: true }]
    const { wrapper } = mountReview({ view: buildView(tasks) })
    expect(wrapper.findAll('.leftover-row')).toHaveLength(0)
    expect(wrapper.text()).toContain('Everything got done')
  })

  // -- Finish review wires save and reschedule mutations --

  it('calls reviewStore.save with structured responses on finish', async () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true },
      { id: 't2', title: 'Pending', done: false }
    ]

    const { wrapper, reviewStore, todayStore } = mountReview(
      { view: buildView(tasks) },
      {},
      { rescheduleTask: vi.fn().mockResolvedValue(undefined) }
    )

    wrapper.vm.mood = 'steady'
    await wrapper.vm.$nextTick()
    await wrapper.vm.finishReview()
    await flushPromises()

    expect(reviewStore.save).toHaveBeenCalledTimes(1)
    const [date, mood, responses] = reviewStore.save.mock.calls[0]
    expect(typeof date).toBe('string')
    expect(mood).toBe('steady')
    expect(responses).toMatchObject({
      wins: { starred: expect.any(Array), freeText: expect.any(String) },
      friction: { text: expect.any(String), tags: expect.any(Array) },
      leftovers: { tomorrow: ['t2'], picked: [], dropped: [], kept: [] },
      tomorrowIntent: expect.any(String)
    })

    // Reschedule was called for the leftover pending task
    expect(todayStore.rescheduleTask).toHaveBeenCalledTimes(1)
    const [taskId, opts] = todayStore.rescheduleTask.mock.calls[0]
    expect(taskId).toBe('t2')
    expect(opts.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not re-fire reschedule mutations when finish is called with the same leftover decisions as the saved review', async () => {
    const tasks = [
      { id: 't1', title: 'Done', done: true },
      { id: 't2', title: 'Pending', done: false }
    ]

    const savedResponses = {
      wins: { starred: [], freeText: '' },
      friction: { text: '', tags: [] },
      leftovers: { tomorrow: ['t2'], picked: [], dropped: [], kept: [] },
      tomorrowIntent: ''
    }

    const { wrapper, todayStore } = mountReview(
      { view: buildView(tasks) },
      { review: { id: 'r1', mood: 'steady', responses: savedResponses } },
      { rescheduleTask: vi.fn().mockResolvedValue(undefined) }
    )
    await flushPromises()

    await wrapper.vm.finishReview()
    await flushPromises()

    expect(todayStore.rescheduleTask).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 12.2: Run test to verify it fails**

Run: `npx vitest run tests/views/ReviewView.test.js`
Expected: FAIL — most assertions fail because the current ReviewView does not render the new components.

- [ ] **Step 12.3: Rewrite ReviewView.vue**

Replace the entire contents of `src/views/ReviewView.vue` with:

```vue
<template>
  <div class="review-view">
    <AppScreenHeading
      :eyebrow="`${t('nav.withWren')} · ${t('nav.itemDailyReview')}`"
      :title="t('review.headingPrefix')"
      :emphasis="t('review.headingEmphasis')"
    />

    <!-- 1. Open + mood -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.open')" :callout="headlineCallout">
        <MoodPicker v-model="mood" />
      </WrenTurn>
    </section>

    <!-- 2. Wins -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.wins')">
        <WinPicker v-model="wins" :tasks="doneTasks" />
      </WrenTurn>
    </section>

    <!-- 3. Friction -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.friction')">
        <FrictionInput v-model="friction" />
      </WrenTurn>
    </section>

    <!-- 4. Leftovers -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.leftovers')">
        <template v-if="pendingTasks.length">
          <button
            type="button"
            class="review-view__bulk"
            @click="moveAllToTomorrow"
          >
            {{ t('review.leftover.moveAll') }}
          </button>

          <LeftoverRow
            v-for="task in pendingTasks"
            :key="task.id"
            :task="task"
            :action="leftoverAction(task.id)"
            @update:action="kind => setLeftover(task.id, kind)"
          />
        </template>

        <p v-else class="review-view__empty">
          {{ t('review.leftover.empty') }}
        </p>
      </WrenTurn>
    </section>

    <!-- 5. Tomorrow intent -->
    <section class="review-view__section">
      <WrenTurn :prompt="t('review.wren.intent')">
        <TomorrowIntent v-model="tomorrowIntent" />
      </WrenTurn>
    </section>

    <!-- 6. Send-off -->
    <section class="review-view__section">
      <SendoffCard
        :input="sendoffInput"
        :saving="reviewStore.saving"
        :disabled="!mood"
        :saved="saved && !editing"
        @finish="finishReview"
        @edit="editing = true"
      />

      <p v-if="reviewStore.error" class="review-view__error">
        {{ reviewStore.error }}
      </p>
    </section>

    <!-- Wren cross-app upsell. Lives below the send-off so the close is the
         emotional closer; the upsell is an offer beneath. -->
    <WrenCrossAppUpsell
      v-if="showWrenUpsell"
      class="review-view__upsell"
      plan="managed_multi_monthly"
      @dismiss="onDismissWrenUpsell"
    />
  </div>
</template>

<script>
/**
 * ReviewView — Wren-led daily review. Composes section components and owns
 * the canonical local state for the in-progress review. Hydrates from the
 * review store on mount, and on Finish saves the structured payload + fires
 * carry-forward mutations only for newly-changed leftover decisions.
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import WrenTurn from '@/components/review/WrenTurn.vue'
import MoodPicker from '@/components/review/MoodPicker.vue'
import WinPicker from '@/components/review/WinPicker.vue'
import FrictionInput from '@/components/review/FrictionInput.vue'
import LeftoverRow from '@/components/review/LeftoverRow.vue'
import TomorrowIntent from '@/components/review/TomorrowIntent.vue'
import SendoffCard from '@/components/review/SendoffCard.vue'
import WrenCrossAppUpsell from '@/components/wren/WrenCrossAppUpsell.vue'

import { useTodayStore } from '@/stores/today.store.js'
import { useReviewStore } from '@/stores/review.store.js'
import { useErrorToast } from '@/composables/useErrorToast.js'
import { localISOToday, toLocalISODate } from '@/utils/date.js'

const WREN_UPSELL_DISMISSED_KEY = 'wren-cross-app-upsell-dismissed'

function localISOTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toLocalISODate(d)
}

function emptyResponses() {
  return {
    wins: { starred: [], freeText: '' },
    friction: { text: '', tags: [] },
    leftovers: { tomorrow: [], picked: [], dropped: [], kept: [] },
    tomorrowIntent: ''
  }
}

export default {
  name: 'ReviewView',
  components: {
    AppScreenHeading,
    WrenTurn,
    MoodPicker,
    WinPicker,
    FrictionInput,
    LeftoverRow,
    TomorrowIntent,
    SendoffCard,
    WrenCrossAppUpsell
  },
  setup() {
    const { t } = useI18n()
    const { toastSuccess, toastError } = useErrorToast()
    const todayStore = useTodayStore()
    const reviewStore = useReviewStore()

    // -- Local state (canonical for the in-progress review) --
    const mood = ref('')
    const wins = ref({ starred: [], freeText: '' })
    const friction = ref({ text: '', tags: [] })
    const leftoverActions = ref({}) // taskId -> { kind, date? }
    const tomorrowIntent = ref('')
    const editing = ref(false)

    const todayDate = localISOToday()
    const tomorrow = localISOTomorrow()

    const showWrenUpsell = ref(
      typeof window === 'undefined'
        ? true
        : window.localStorage.getItem(WREN_UPSELL_DISMISSED_KEY) !== 'true'
    )

    // -- Computed --

    const doneTasks = computed(() => (todayStore.view?.tasks ?? []).filter(t => t.done))
    const pendingTasks = computed(() => (todayStore.view?.tasks ?? []).filter(t => !t.done))

    const headlineCallout = computed(() => {
      const total = todayStore.view?.kpis?.todayTotal ?? 0
      const streak = todayStore.view?.kpis?.streak ?? 0
      // Spec: hide the callout entirely when streak is 0 or total is 0 — keeps
      // the opening from feeling sterile on a freshly-started habit.
      if (total === 0 || streak === 0) return ''
      const done = todayStore.view?.kpis?.todayDone ?? 0
      return t('review.headline', { done, total }) + t('review.headlineStreak', { streak })
    })

    const saved = computed(() => Boolean(reviewStore.review?.id))

    const sendoffInput = computed(() => {
      const topId = wins.value.starred[0]
      const topWin = doneTasks.value.find(t => t.id === topId)
      return {
        mood: mood.value || 'steady',
        doneCount: todayStore.view?.kpis?.todayDone ?? 0,
        totalCount: todayStore.view?.kpis?.todayTotal ?? 0,
        streak: todayStore.view?.kpis?.streak ?? 0,
        topWinTitle: topWin?.title ?? '',
        tomorrowIntent: tomorrowIntent.value,
        frictionTagCount: friction.value.tags.length
      }
    })

    // -- Lifecycle --

    onMounted(async () => {
      await Promise.all([todayStore.load(todayDate), reviewStore.load(todayDate)])
      hydrateFromStore()
    })

    return {
      t,
      todayStore,
      reviewStore,
      mood,
      wins,
      friction,
      leftoverActions,
      tomorrowIntent,
      editing,
      saved,
      doneTasks,
      pendingTasks,
      headlineCallout,
      sendoffInput,
      showWrenUpsell,
      leftoverAction,
      setLeftover,
      moveAllToTomorrow,
      finishReview,
      onDismissWrenUpsell,
      // Exposed for tests
      todayDate
    }

    // -- Functions --

    function hydrateFromStore() {
      const r = reviewStore.review
      if (!r) {
        // Default: every pending task gets "tomorrow"
        for (const task of pendingTasks.value) {
          leftoverActions.value[task.id] = { kind: 'tomorrow' }
        }
        return
      }

      if (r.mood) mood.value = r.mood
      const resp = r.responses || emptyResponses()

      if (resp.wins) wins.value = { starred: resp.wins.starred ?? [], freeText: resp.wins.freeText ?? '' }
      if (resp.friction) friction.value = { text: resp.friction.text ?? '', tags: resp.friction.tags ?? [] }
      if (resp.tomorrowIntent) tomorrowIntent.value = resp.tomorrowIntent

      const lo = resp.leftovers || emptyResponses().leftovers
      for (const id of lo.tomorrow ?? []) leftoverActions.value[id] = { kind: 'tomorrow' }
      for (const p of lo.picked ?? []) leftoverActions.value[p.id] = { kind: 'pick', date: p.date }
      for (const id of lo.dropped ?? []) leftoverActions.value[id] = { kind: 'drop' }
      for (const id of lo.kept ?? []) leftoverActions.value[id] = { kind: 'keep' }

      // Tasks not represented in the saved payload (e.g. created after the
      // review was saved) default to "tomorrow".
      for (const task of pendingTasks.value) {
        if (!leftoverActions.value[task.id]) {
          leftoverActions.value[task.id] = { kind: 'tomorrow' }
        }
      }
    }

    function leftoverAction(id) {
      return leftoverActions.value[id] ?? { kind: 'tomorrow' }
    }

    function setLeftover(id, action) {
      leftoverActions.value = { ...leftoverActions.value, [id]: action }
    }

    function moveAllToTomorrow() {
      const next = { ...leftoverActions.value }
      for (const task of pendingTasks.value) {
        next[task.id] = { kind: 'tomorrow' }
      }
      leftoverActions.value = next
    }

    function composeResponses() {
      const tomorrowIds = []
      const picked = []
      const dropped = []
      const kept = []

      for (const task of pendingTasks.value) {
        const a = leftoverActions.value[task.id] ?? { kind: 'tomorrow' }
        if (a.kind === 'tomorrow') tomorrowIds.push(task.id)
        else if (a.kind === 'pick' && a.date) picked.push({ id: task.id, date: a.date })
        else if (a.kind === 'drop') dropped.push(task.id)
        else if (a.kind === 'keep') kept.push(task.id)
      }

      return {
        wins: { ...wins.value, freeText: wins.value.freeText.trim() },
        friction: { ...friction.value, text: friction.value.text.trim() },
        leftovers: { tomorrow: tomorrowIds, picked, dropped, kept },
        tomorrowIntent: tomorrowIntent.value.trim()
      }
    }

    async function finishReview() {
      if (!mood.value) return

      const responses = composeResponses()
      const prevLeftovers = reviewStore.review?.responses?.leftovers ?? null
      const diff = reviewStore.diffLeftovers(prevLeftovers, responses.leftovers)

      try {
        await reviewStore.save(todayDate, mood.value, responses)
      } catch {
        // Store already toasts; do not fire any carry-forward.
        return
      }

      const failures = await dispatchCarryForward(diff)
      editing.value = false

      if (failures > 0) {
        toastError(new Error('partial'), t('review.sendoff.saveError', { n: failures }))
      } else {
        toastSuccess(t('review.reviewSaved'))
      }
    }

    async function dispatchCarryForward(diff) {
      let failures = 0

      for (const id of diff.tomorrow) {
        try {
          await todayStore.rescheduleTask(id, { scheduledDate: tomorrow })
        } catch {
          failures += 1
        }
      }

      for (const p of diff.picked) {
        try {
          await todayStore.rescheduleTask(p.id, { scheduledDate: p.date })
        } catch {
          failures += 1
        }
      }

      for (const id of diff.dropped) {
        try {
          await deleteTaskById(id)
        } catch {
          failures += 1
        }
      }

      return failures
    }

    async function deleteTaskById(id) {
      // Inline mutation rather than adding a new store action; the review
      // is the only caller and the today store reload after a deletion is
      // unnecessary on this screen (the user is closing out the day).
      const { apolloClient } = await import('@/api/apollo.js')
      const { DELETE_TASK } = await import('@/api/operations/index.js')
      await apolloClient.mutate({ mutation: DELETE_TASK, variables: { id } })
    }

    function onDismissWrenUpsell() {
      showWrenUpsell.value = false
      try {
        window.localStorage.setItem(WREN_UPSELL_DISMISSED_KEY, 'true')
      } catch {
        // localStorage can be blocked; the local ref already hides the card.
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.review-view {
  &__section {
    @apply mb-5;
  }

  &__bulk {
    @apply mb-2 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink underline opacity-80;
    @apply hover:opacity-100;
  }

  &__empty {
    @apply text-[13px] text-muted;
  }

  &__error {
    @apply mt-2 text-[12px] text-bad;
  }

  &__upsell {
    @apply mb-5;
  }
}
</style>
```

- [ ] **Step 12.4: Verify DELETE_TASK is re-exported from the index barrel**

Run: `grep -nE "DELETE_TASK" src/api/operations/index.js`
Expected: at least one match. If not present, add `export { DELETE_TASK } from './projects.js'` to `src/api/operations/index.js` so the dynamic import inside `deleteTaskById` resolves.

If you had to add the re-export, stage that file with the rest of this task's commit.

- [ ] **Step 12.5: Run the view tests to verify they pass**

Run: `npx vitest run tests/views/ReviewView.test.js`
Expected: PASS, all 6 tests.

- [ ] **Step 12.6: Run the entire review-feature test suite as a sanity check**

Run: `npx vitest run tests/components/review/ tests/views/ReviewView.test.js tests/stores/review.store.test.js`
Expected: PASS for all review-related specs.

- [ ] **Step 12.7: Commit**

```bash
git add src/views/ReviewView.vue tests/views/ReviewView.test.js src/api/operations/index.js
git commit -m "feat(review): Wren-led daily review with carry-forward actions"
```

If `src/api/operations/index.js` was not modified, drop it from the `git add`.

---

## Task 13: Manual verification

**Files:** none — exercises the running app.

- [ ] **Step 13.1: Start the dev server**

If using Claude Code: invoke `preview_start` from the Claude Preview MCP and navigate to `/review`.
Otherwise: run `npm run dev` in the background and open the URL the dev server prints. Navigate to `/review`.

- [ ] **Step 13.2: Walk the conversation**

For a day with at least one completed and one pending task in the mock fixture:

- Pick a mood pill — it highlights as accent.
- Star a completed win; try starring a 4th — the oldest unstars.
- Type a friction line, toggle two chips.
- For a pending task: try **Tomorrow** (default), **Pick day** (opens date picker), **Drop**, **Keep**.
- Click **Move all to tomorrow** and confirm every row's chip flips.
- Type a tomorrow intent.
- Click **Finish review** — toast should appear, sendoff card shows "Review saved" with an Edit button.
- Click **Edit** — controls return to editable state; clicking Finish again does NOT re-toast or re-fire mutations (check the Network tab in browser devtools — only `SaveDailyReview` should fire, no `RescheduleTask`).

- [ ] **Step 13.3: Dark mode pass**

Toggle the app's dark mode (via the existing theme switcher). Verify every section reads cleanly with no white-on-white or black-on-black. Fix any token misuses (e.g. a missing `text-ink` token) in the offending component.

- [ ] **Step 13.4: Stop the dev server**

Stop the background process.

---

## Task 14: Full test sweep + final commit

**Files:** none.

- [ ] **Step 14.1: Run the full test suite (review-feature scope)**

Run: `npx vitest run tests/components/review/ tests/views/ReviewView.test.js tests/stores/review.store.test.js tests/i18n/i18n.test.js`
Expected: all PASS.

- [ ] **Step 14.2: If any tests fail, fix and re-run**

Repeat until all green. Do not skip or `.skip` failing tests.

- [ ] **Step 14.3: No final commit required**

All work was already committed in tasks 1–12. Confirm with `git status` — working tree should show only the same pre-existing in-flight files from session start, plus no untracked review additions.

---

## Notes on the pre-existing working tree

The repo's working tree has ~30 modified files from in-flight work outside this plan, and the test suite has pre-existing failures unrelated to this redesign (AppTopBar, ProjectDetailView, i18n test stored-locale check, etc.). Two implications:

1. **Pre-commit hooks may fail because of those failures.** This plan's commits should each pass on their own when scoped to the touched files (via `git add` of specific paths). If a pre-commit hook runs the full suite and fails on unrelated files, surface the situation to the user rather than skipping hooks.

2. **The `tests/views/ReviewView.test.js` rewrite is the only test in this plan that overlaps the existing snapshot.** All other tests are new files and won't conflict.

If the pre-existing failures must be cleared first to land any commit, escalate to the user before starting Task 1.
