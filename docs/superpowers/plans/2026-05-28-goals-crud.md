# Goals CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `window.prompt` create flow on the Goals view with a polished editorial modal, and add edit + remove actions reachable from every goal card.

**Architecture:** Mirror the chores feature 1:1. A shared `GoalForm` powers both `CreateGoalModal` and `EditGoalModal`. A reusable `GoalCardMenu` adds a `⋯` popover to every card. `GoalsView` owns the three pieces of UI state (`showCreate`, `editingGoal`, `removingGoal`) and mounts the modals + `AppConfirmDialog`. No store or GraphQL changes — the existing actions already cover the surface.

**Tech Stack:** Vue 3 + Pinia + vue-i18n + Apollo + Tailwind/SCSS, tested with Vitest + @vue/test-utils + @pinia/testing.

---

## File map

**Create:**
- `src/components/goals/GoalForm.vue` — shared form fields (title, why, target date) with `v-model` and `valid` events.
- `src/components/goals/CreateGoalModal.vue` — create-flow modal wrapping `GoalForm`.
- `src/components/goals/EditGoalModal.vue` — edit-flow modal wrapping `GoalForm`, seeded from a `goal` prop.
- `src/components/goals/GoalCardMenu.vue` — `⋯` button + popover with Edit / Remove items.
- `tests/components/goals/GoalForm.test.js`
- `tests/components/goals/CreateGoalModal.test.js`
- `tests/components/goals/EditGoalModal.test.js`
- `tests/components/goals/GoalCardMenu.test.js`

**Modify:**
- `src/views/GoalsView.vue` — drop `window.prompt`; mount modals + confirm dialog; add `GoalCardMenu` to hero + grid cards.
- `tests/views/GoalsView.test.js` — replace the window.prompt tests with modal-open + kebab-menu tests.
- `src/i18n/locales/{en,de,es,fr,pt-BR}.json` — add the new `goals.*` keys; remove the now-dead `promptTitle`, `promptWhy`, `promptTargetDate` keys.

---

## Task 1: Add new i18n strings and remove the prompt-flow strings

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/de.json`
- Modify: `src/i18n/locales/fr.json`
- Modify: `src/i18n/locales/pt-BR.json`

- [ ] **Step 1: Replace the three prompt keys with the new keys in `en.json`**

Inside `"goals": { … }`, remove these three lines:

```json
"promptTitle": "Goal title?",
"promptWhy": "Why does this matter?",
"promptTargetDate": "Target date (YYYY-MM-DD)?"
```

And add (immediately after `"targetPrefix"`):

```json
"createEyebrow": "NEW GOAL",
"editEyebrow": "EDIT GOAL",
"createPrompt": "What are you working toward?",
"editPrompt": "Refine this goal.",
"titlePlaceholder": "A short, vivid name…",
"whyLabel": "Why",
"whyPlaceholder": "Why does this matter to you?",
"targetDateLabel": "Target date",
"saveCreate": "Save goal",
"saveEdit": "Save changes",
"saving": "Saving…",
"actionsLabel": "Goal actions",
"edit": "Edit",
"remove": "Remove",
"removeTitle": "Remove this goal?",
"removeMessage": "\"{title}\" will be archived. Linked projects and chores stay where they are.",
"removeConfirm": "Remove",
"removing": "Removing…"
```

- [ ] **Step 2: Mirror the same change in `es.json`**

Remove `promptTitle`, `promptWhy`, `promptTargetDate`. Add:

```json
"createEyebrow": "NUEVA META",
"editEyebrow": "EDITAR META",
"createPrompt": "¿Hacia qué estás avanzando?",
"editPrompt": "Refina esta meta.",
"titlePlaceholder": "Un nombre breve y vívido…",
"whyLabel": "Por qué",
"whyPlaceholder": "¿Por qué te importa?",
"targetDateLabel": "Fecha objetivo",
"saveCreate": "Guardar meta",
"saveEdit": "Guardar cambios",
"saving": "Guardando…",
"actionsLabel": "Acciones de la meta",
"edit": "Editar",
"remove": "Quitar",
"removeTitle": "¿Quitar esta meta?",
"removeMessage": "Se archivará \"{title}\". Los proyectos y rutinas vinculados se quedan donde están.",
"removeConfirm": "Quitar",
"removing": "Quitando…"
```

- [ ] **Step 3: Mirror in `de.json`**

Remove the three prompt keys. Add:

```json
"createEyebrow": "NEUES ZIEL",
"editEyebrow": "ZIEL BEARBEITEN",
"createPrompt": "Worauf arbeitest du hin?",
"editPrompt": "Dieses Ziel verfeinern.",
"titlePlaceholder": "Ein kurzer, lebendiger Name…",
"whyLabel": "Warum",
"whyPlaceholder": "Warum ist dir das wichtig?",
"targetDateLabel": "Zieldatum",
"saveCreate": "Ziel speichern",
"saveEdit": "Änderungen speichern",
"saving": "Wird gespeichert…",
"actionsLabel": "Zielaktionen",
"edit": "Bearbeiten",
"remove": "Entfernen",
"removeTitle": "Dieses Ziel entfernen?",
"removeMessage": "„{title}“ wird archiviert. Verknüpfte Projekte und Routinen bleiben unverändert.",
"removeConfirm": "Entfernen",
"removing": "Wird entfernt…"
```

- [ ] **Step 4: Mirror in `fr.json`**

Remove the three prompt keys. Add:

```json
"createEyebrow": "NOUVEL OBJECTIF",
"editEyebrow": "MODIFIER L'OBJECTIF",
"createPrompt": "Vers quoi avancez-vous ?",
"editPrompt": "Affinez cet objectif.",
"titlePlaceholder": "Un nom court et évocateur…",
"whyLabel": "Pourquoi",
"whyPlaceholder": "Pourquoi est-ce important pour vous ?",
"targetDateLabel": "Date cible",
"saveCreate": "Enregistrer l'objectif",
"saveEdit": "Enregistrer les modifications",
"saving": "Enregistrement…",
"actionsLabel": "Actions de l'objectif",
"edit": "Modifier",
"remove": "Supprimer",
"removeTitle": "Supprimer cet objectif ?",
"removeMessage": "« {title} » sera archivé. Les projets et routines liés restent en place.",
"removeConfirm": "Supprimer",
"removing": "Suppression…"
```

- [ ] **Step 5: Mirror in `pt-BR.json`**

Remove the three prompt keys. Add:

```json
"createEyebrow": "NOVA META",
"editEyebrow": "EDITAR META",
"createPrompt": "Em direção a quê você está indo?",
"editPrompt": "Refine esta meta.",
"titlePlaceholder": "Um nome curto e vívido…",
"whyLabel": "Por quê",
"whyPlaceholder": "Por que isso importa para você?",
"targetDateLabel": "Data alvo",
"saveCreate": "Salvar meta",
"saveEdit": "Salvar alterações",
"saving": "Salvando…",
"actionsLabel": "Ações da meta",
"edit": "Editar",
"remove": "Remover",
"removeTitle": "Remover esta meta?",
"removeMessage": "\"{title}\" será arquivada. Projetos e rotinas vinculados ficam onde estão.",
"removeConfirm": "Remover",
"removing": "Removendo…"
```

- [ ] **Step 6: Lint check (catches JSON syntax errors)**

Run: `npm run lint:check`
Expected: PASS (or warnings only, no errors)

- [ ] **Step 7: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/es.json src/i18n/locales/de.json src/i18n/locales/fr.json src/i18n/locales/pt-BR.json
git commit -m "feat(goals): add i18n strings for create/edit/remove modals"
```

---

## Task 2: Build `GoalForm.vue` (TDD)

**Files:**
- Create: `src/components/goals/GoalForm.vue`
- Create: `tests/components/goals/GoalForm.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/components/goals/GoalForm.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import GoalForm from '@/components/goals/GoalForm.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :data-placeholder="placeholder" :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  }
}

function baseModel(overrides = {}) {
  return { title: '', why: '', targetDate: '', ...overrides }
}

function mountForm(props = {}) {
  return mount(GoalForm, {
    props: { modelValue: baseModel(), ...props },
    global: { plugins: [i18n], stubs: globalStubs }
  })
}

describe('GoalForm', () => {
  it('renders title, why, and target-date fields', () => {
    const wrapper = mountForm()
    expect(wrapper.find('input[data-placeholder="A short, vivid name…"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
  })

  it('emits update:modelValue when the title changes', async () => {
    const wrapper = mountForm()
    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted.at(-1)[0].title).toBe('Memoir')
  })

  it('emits update:modelValue when the why changes', async () => {
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('because it matters')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted.at(-1)[0].why).toBe('because it matters')
  })

  it('emits update:modelValue when the target date changes', async () => {
    const wrapper = mountForm()
    await wrapper.find('input[type="date"]').setValue('2026-12-31')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted.at(-1)[0].targetDate).toBe('2026-12-31')
  })

  it('emits valid=false when any required field is empty', () => {
    const wrapper = mountForm({ modelValue: baseModel({ title: 'X', why: 'Y' }) })
    const events = wrapper.emitted('valid')
    expect(events?.at(-1)?.[0]).toBe(false)
  })

  it('emits valid=true once all three fields are populated', async () => {
    const wrapper = mountForm({
      modelValue: baseModel({ title: 'X', why: 'Y', targetDate: '2026-12-31' })
    })
    const events = wrapper.emitted('valid')
    expect(events?.at(-1)?.[0]).toBe(true)
  })

  it('emits valid=false when target date does not match YYYY-MM-DD', () => {
    const wrapper = mountForm({
      modelValue: baseModel({ title: 'X', why: 'Y', targetDate: 'not-a-date' })
    })
    const events = wrapper.emitted('valid')
    expect(events?.at(-1)?.[0]).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/goals/GoalForm.test.js`
Expected: FAIL — `Cannot find module '@/components/goals/GoalForm.vue'`

- [ ] **Step 3: Create the component**

Create `src/components/goals/GoalForm.vue`:

```vue
<template>
  <form class="goal-form" @submit.prevent>
    <!-- Title -->
    <AppTextField
      :model-value="modelValue.title"
      :placeholder="t('goals.titlePlaceholder')"
      :invalid="submitted && !modelValue.title.trim()"
      class="goal-form__title"
      @update:model-value="patch({ title: $event })"
    />

    <!-- Why (multiline editorial field) -->
    <label class="goal-form__field">
      <span class="goal-form__eyebrow">
        {{ t('goals.whyLabel') }}
      </span>

      <textarea
        :value="modelValue.why"
        :placeholder="t('goals.whyPlaceholder')"
        :aria-invalid="submitted && !modelValue.why.trim() ? 'true' : undefined"
        class="goal-form__why"
        :class="submitted && !modelValue.why.trim() ? 'goal-form__why--invalid' : ''"
        rows="3"
        @input="patch({ why: $event.target.value })"
      />
    </label>

    <!-- Target date -->
    <label class="goal-form__field">
      <span class="goal-form__eyebrow">
        {{ t('goals.targetDateLabel') }}
      </span>

      <input
        type="date"
        :value="modelValue.targetDate"
        :aria-invalid="submitted && !dateValid ? 'true' : undefined"
        class="goal-form__date"
        :class="submitted && !dateValid ? 'goal-form__date--invalid' : ''"
        @input="patch({ targetDate: $event.target.value })"
      />
    </label>
  </form>
</template>

<script>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTextField from '@/components/ui/AppTextField.vue'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default {
  name: 'GoalForm',
  components: { AppTextField },
  props: {
    modelValue: { type: Object, required: true },
    submitted: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'valid'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const dateValid = computed(() => DATE_RE.test(props.modelValue.targetDate || ''))

    const valid = computed(
      () =>
        !!props.modelValue.title.trim() &&
        !!props.modelValue.why.trim() &&
        dateValid.value
    )

    watch(valid, v => emit('valid', v), { immediate: true })

    return { t, dateValid, patch }

    function patch(partial) {
      emit('update:modelValue', { ...props.modelValue, ...partial })
    }
  }
}
</script>

<style lang="scss" scoped>
.goal-form {
  @apply flex flex-col gap-5;

  &__title :deep(.text-field__input) {
    @apply font-serif text-[22px];
  }

  &__field {
    @apply flex flex-col gap-1.5;
  }

  &__eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  &__why {
    @apply min-h-[88px] resize-y rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 font-serif italic text-ink outline-none transition-colors;
    @apply focus:border-muted placeholder:text-muted placeholder:not-italic placeholder:font-sans;
    font-size: 18px;
    line-height: 1.4;

    &--invalid {
      @apply border-bad;
    }
  }

  &__date {
    @apply rounded-md border border-rule-soft bg-paper-2 px-3.5 py-2.5 font-mono text-[14px] text-ink outline-none transition-colors;
    @apply focus:border-muted;

    &--invalid {
      @apply border-bad;
    }
  }
}
</style>
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run tests/components/goals/GoalForm.test.js`
Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/goals/GoalForm.vue tests/components/goals/GoalForm.test.js
git commit -m "feat(goals): add shared GoalForm component"
```

---

## Task 3: Build `CreateGoalModal.vue` (TDD)

**Files:**
- Create: `src/components/goals/CreateGoalModal.vue`
- Create: `tests/components/goals/CreateGoalModal.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/components/goals/CreateGoalModal.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import CreateGoalModal from '@/components/goals/CreateGoalModal.vue'
import { useGoalsStore } from '@/stores/goals.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop'],
    emits: ['update:modelValue'],
    template:
      '<div v-if="modelValue" class="app-modal-stub"><slot name="header" /><slot /><slot name="footer" /></div>'
  },
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :data-placeholder="placeholder" :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" :data-variant="variant" @click="$emit(\'click\')"><slot /></button>'
  }
}

function mountModal(props = {}) {
  return mount(CreateGoalModal, {
    props: { modelValue: true, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('CreateGoalModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.app-modal-stub').exists()).toBe(true)
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'ghost')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('submit no-ops when form is invalid', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    const saveBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'primary')
    await saveBtn.trigger('click')
    await flushPromises()
    expect(store.create).not.toHaveBeenCalled()
  })

  it('submit calls store.create with trimmed fields', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.create.mockResolvedValue({ id: 'g1' })

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('  Memoir  ')
    await wrapper.find('textarea').setValue('  because it matters  ')
    await wrapper.find('input[type="date"]').setValue('2026-12-31')

    const saveBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(store.create).toHaveBeenCalledWith({
      title: 'Memoir',
      why: 'because it matters',
      targetDate: '2026-12-31'
    })
  })

  it('closes the modal on successful save', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.create.mockResolvedValue({ id: 'g1' })

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir')
    await wrapper.find('textarea').setValue('because')
    await wrapper.find('input[type="date"]').setValue('2026-12-31')

    const saveBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('stays open on store rejection', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.create.mockRejectedValue(new Error('boom'))

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir')
    await wrapper.find('textarea').setValue('because')
    await wrapper.find('input[type="date"]').setValue('2026-12-31')

    const saveBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/goals/CreateGoalModal.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the component**

Create `src/components/goals/CreateGoalModal.vue`:

```vue
<template>
  <AppModal
    :model-value="modelValue"
    :close-on-backdrop="!saving"
    :aria-label="t('goals.createEyebrow')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="goal-modal__header">
        <span class="goal-modal__eyebrow">{{ t('goals.createEyebrow') }}</span>
        <h2 class="goal-modal__title">{{ t('goals.createPrompt') }}</h2>
      </div>
    </template>

    <GoalForm
      v-model="form"
      :submitted="submitted"
      @valid="formValid = $event"
    />

    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="saving" @click="handleSubmit">
        {{ saving ? t('goals.saving') : t('goals.saveCreate') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from '@/stores/goals.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import GoalForm from './GoalForm.vue'

const DEFAULT_FORM = () => ({ title: '', why: '', targetDate: '' })

export default {
  name: 'CreateGoalModal',
  components: { AppModal, AppButton, GoalForm },
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useGoalsStore()
    const form = ref(DEFAULT_FORM())
    const submitted = ref(false)
    const saving = ref(false)
    const formValid = ref(false)

    watch(
      () => props.modelValue,
      open => {
        if (open) {
          form.value = DEFAULT_FORM()
          submitted.value = false
          saving.value = false
        }
      }
    )

    return { t, form, submitted, saving, formValid, cancel, handleSubmit }

    function cancel() {
      emit('update:modelValue', false)
    }

    async function handleSubmit() {
      submitted.value = true
      if (!formValid.value || saving.value) return
      saving.value = true

      try {
        await store.create({
          title: form.value.title.trim(),
          why: form.value.why.trim(),
          targetDate: form.value.targetDate
        })

        emit('update:modelValue', false)
      } catch {
        // toasted by store
      } finally {
        saving.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.goal-modal {
  &__header {
    @apply flex flex-col gap-1.5;
  }

  &__eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  &__title {
    @apply font-serif font-normal text-ink;
    font-size: 28px;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }
}
</style>
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run tests/components/goals/CreateGoalModal.test.js`
Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/goals/CreateGoalModal.vue tests/components/goals/CreateGoalModal.test.js
git commit -m "feat(goals): add CreateGoalModal"
```

---

## Task 4: Build `EditGoalModal.vue` (TDD)

**Files:**
- Create: `src/components/goals/EditGoalModal.vue`
- Create: `tests/components/goals/EditGoalModal.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/components/goals/EditGoalModal.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import EditGoalModal from '@/components/goals/EditGoalModal.vue'
import { useGoalsStore } from '@/stores/goals.store'
import en from '@/i18n/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppModal: {
    props: ['modelValue', 'title', 'closeOnBackdrop'],
    emits: ['update:modelValue'],
    template:
      '<div v-if="modelValue" class="app-modal-stub"><slot name="header" /><slot /><slot name="footer" /></div>'
  },
  AppTextField: {
    props: ['modelValue', 'label', 'placeholder', 'invalid', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :data-label="label" :data-placeholder="placeholder" :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" :data-variant="variant" @click="$emit(\'click\')"><slot /></button>'
  }
}

const goalFixture = {
  id: 'g1',
  title: 'Memoir',
  why: 'because writers write',
  targetDate: '2026-12-31'
}

function mountModal(props = {}) {
  return mount(EditGoalModal, {
    props: { modelValue: true, goal: goalFixture, ...props },
    global: {
      stubs: globalStubs,
      plugins: [createTestingPinia({ createSpy: vi.fn }), i18n]
    }
  })
}

describe('EditGoalModal', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('seeds the form from the goal prop', () => {
    const wrapper = mountModal()
    expect(wrapper.find('input[data-placeholder="A short, vivid name…"]').element.value).toBe(
      'Memoir'
    )
    expect(wrapper.find('textarea').element.value).toBe('because writers write')
    expect(wrapper.find('input[type="date"]').element.value).toBe('2026-12-31')
  })

  it('cancel emits update:modelValue=false', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'ghost')
    await cancelBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('save calls store.update with the goal id and current fields', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.update.mockResolvedValue({})

    await wrapper.find('input[data-placeholder="A short, vivid name…"]').setValue('Memoir v2')

    const saveBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(store.update).toHaveBeenCalledWith('g1', {
      title: 'Memoir v2',
      why: 'because writers write',
      targetDate: '2026-12-31'
    })
  })

  it('closes on successful save', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.update.mockResolvedValue({})

    const saveBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('stays open on store rejection', async () => {
    const wrapper = mountModal()
    const store = useGoalsStore()
    store.update.mockRejectedValue(new Error('boom'))

    const saveBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('data-variant') === 'primary')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/goals/EditGoalModal.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the component**

Create `src/components/goals/EditGoalModal.vue`:

```vue
<template>
  <AppModal
    :model-value="modelValue"
    :close-on-backdrop="!saving"
    :aria-label="t('goals.editEyebrow')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="goal-modal__header">
        <span class="goal-modal__eyebrow">{{ t('goals.editEyebrow') }}</span>
        <h2 class="goal-modal__title">{{ t('goals.editPrompt') }}</h2>
      </div>
    </template>

    <GoalForm
      v-if="form"
      v-model="form"
      :submitted="submitted"
      @valid="formValid = $event"
    />

    <template #footer>
      <AppButton variant="ghost" :disabled="saving" @click="cancel">
        {{ t('common.cancel') }}
      </AppButton>

      <AppButton variant="primary" :disabled="saving" @click="handleSubmit">
        {{ saving ? t('goals.saving') : t('goals.saveEdit') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from '@/stores/goals.store.js'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import GoalForm from './GoalForm.vue'

function fromGoal(goal) {
  if (!goal) return null
  return {
    title: goal.title ?? '',
    why: goal.why ?? '',
    targetDate: goal.targetDate ?? ''
  }
}

export default {
  name: 'EditGoalModal',
  components: { AppModal, AppButton, GoalForm },
  props: {
    modelValue: { type: Boolean, default: false },
    goal: { type: Object, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useGoalsStore()
    const form = ref(fromGoal(props.goal))
    const submitted = ref(false)
    const saving = ref(false)
    const formValid = ref(true)

    watch(
      () => [props.modelValue, props.goal],
      ([open]) => {
        if (open) {
          form.value = fromGoal(props.goal)
          submitted.value = false
          saving.value = false
        }
      }
    )

    return { t, form, submitted, saving, formValid, cancel, handleSubmit }

    function cancel() {
      emit('update:modelValue', false)
    }

    async function handleSubmit() {
      submitted.value = true
      if (!formValid.value || saving.value || !props.goal) return
      saving.value = true

      try {
        await store.update(props.goal.id, {
          title: form.value.title.trim(),
          why: form.value.why.trim(),
          targetDate: form.value.targetDate
        })

        emit('update:modelValue', false)
      } catch {
        // toasted by store
      } finally {
        saving.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.goal-modal {
  &__header {
    @apply flex flex-col gap-1.5;
  }

  &__eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  &__title {
    @apply font-serif font-normal text-ink;
    font-size: 28px;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }
}
</style>
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run tests/components/goals/EditGoalModal.test.js`
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/goals/EditGoalModal.vue tests/components/goals/EditGoalModal.test.js
git commit -m "feat(goals): add EditGoalModal"
```

---

## Task 5: Build `GoalCardMenu.vue` (TDD)

**Files:**
- Create: `src/components/goals/GoalCardMenu.vue`
- Create: `tests/components/goals/GoalCardMenu.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/components/goals/GoalCardMenu.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import GoalCardMenu from '@/components/goals/GoalCardMenu.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = { AppIcon: true }

function mountMenu() {
  return mount(GoalCardMenu, {
    attachTo: document.body,
    global: { plugins: [i18n], stubs: globalStubs }
  })
}

describe('GoalCardMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a trigger button with the accessible label', () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('button[aria-haspopup="menu"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-label')).toBe('Goal actions')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('opens the menu on trigger click', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('emits "edit" when the Edit item is clicked', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    const editItem = wrapper.findAll('[role="menuitem"]').find(b => b.text() === 'Edit')
    await editItem.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits "remove" when the Remove item is clicked', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    const removeItem = wrapper.findAll('[role="menuitem"]').find(b => b.text() === 'Remove')
    await removeItem.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    wrapper.unmount()
  })

  it('closes the menu after an action is selected', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    const editItem = wrapper.findAll('[role="menuitem"]').find(b => b.text() === 'Edit')
    await editItem.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes on Escape', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/goals/GoalCardMenu.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the component**

Create `src/components/goals/GoalCardMenu.vue`:

```vue
<template>
  <div class="goal-menu">
    <button
      ref="triggerRef"
      type="button"
      class="goal-menu__trigger"
      :aria-label="t('goals.actionsLabel')"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click.stop="open = !open"
    >
      <AppIcon name="more" :size="16" />
    </button>

    <ul
      v-if="open"
      ref="listRef"
      class="goal-menu__list"
      role="menu"
    >
      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="goal-menu__item"
          @click="trigger('edit')"
        >
          {{ t('goals.edit') }}
        </button>
      </li>

      <li class="goal-menu__divider" aria-hidden="true" />

      <li role="none">
        <button
          type="button"
          role="menuitem"
          class="goal-menu__item goal-menu__item--danger"
          @click="trigger('remove')"
        >
          {{ t('goals.remove') }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

export default {
  name: 'GoalCardMenu',
  components: { AppIcon },
  emits: ['edit', 'remove'],
  setup(_, { emit }) {
    const { t } = useI18n()
    const open = ref(false)
    const triggerRef = ref(null)
    const listRef = ref(null)

    onMounted(() => {
      document.addEventListener('click', onDocClick)
      document.addEventListener('keydown', onKey)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    })

    return { t, open, triggerRef, listRef, trigger }

    function trigger(action) {
      open.value = false
      emit(action)
    }

    function onDocClick(e) {
      if (!open.value) return
      if (triggerRef.value?.contains(e.target)) return
      if (listRef.value?.contains(e.target)) return
      open.value = false
    }

    function onKey(e) {
      if (e.key === 'Escape' && open.value) {
        e.stopPropagation()
        open.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.goal-menu {
  @apply relative shrink-0;

  &__trigger {
    @apply inline-flex h-7 w-7 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-3 hover:text-ink;
    @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent;
  }

  &__list {
    @apply absolute right-0 top-8 z-20 min-w-[160px] rounded-md border border-rule-soft bg-paper py-1 shadow-md;
  }

  &__item {
    @apply flex w-full items-center px-3 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-paper-2;
    @apply disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60 disabled:hover:bg-transparent;

    &--danger {
      @apply text-bad;
    }
  }

  &__divider {
    @apply my-1 border-t border-rule-soft;
  }
}
</style>
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run tests/components/goals/GoalCardMenu.test.js`
Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/goals/GoalCardMenu.vue tests/components/goals/GoalCardMenu.test.js
git commit -m "feat(goals): add GoalCardMenu (kebab menu for cards)"
```

---

## Task 6: Wire it all into `GoalsView.vue`

**Files:**
- Modify: `src/views/GoalsView.vue`
- Modify: `tests/views/GoalsView.test.js`

- [ ] **Step 1: Rewrite the GoalsView test file**

Replace the entire contents of `tests/views/GoalsView.test.js` with:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import GoalsView from '@/views/GoalsView.vue'
import { useGoalsStore } from '@/stores/goals.store'
import enRaw from '@/i18n/locales/en.json'

function sanitize(value) {
  if (typeof value === 'string') return value.replace(/@/g, "{'@'}")
  if (Array.isArray(value)) return value.map(sanitize)

  if (value && typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[k] = sanitize(value[k])
    return out
  }

  return value
}

const en = sanitize(enRaw)
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const globalStubs = {
  AppScreenHeading: true,
  AppSectionHeader: true,
  AppButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button type="button" :data-variant="variant" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  },
  AppIcon: true,
  // The modals + confirm dialog are stubbed to a div that exposes their open
  // state via a data attribute so we can assert "the modal opened" without
  // pulling in the full Teleport machinery.
  CreateGoalModal: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="create-goal-stub" :data-open="modelValue ? \'1\' : \'0\'" />'
  },
  EditGoalModal: {
    props: ['modelValue', 'goal'],
    emits: ['update:modelValue'],
    template:
      '<div class="edit-goal-stub" :data-open="modelValue ? \'1\' : \'0\'" :data-goal-id="goal && goal.id" />'
  },
  AppConfirmDialog: {
    props: ['modelValue', 'title', 'message', 'busy', 'confirmLabel', 'cancelLabel', 'busyLabel'],
    emits: ['update:modelValue', 'confirm', 'cancel'],
    template:
      '<div class="confirm-stub" :data-open="modelValue ? \'1\' : \'0\'"><button class="confirm-stub__confirm" @click="$emit(\'confirm\')">confirm</button></div>'
  },
  GoalCardMenu: {
    emits: ['edit', 'remove'],
    template:
      '<div class="goal-menu-stub"><button class="goal-menu-stub__edit" @click="$emit(\'edit\')">edit</button><button class="goal-menu-stub__remove" @click="$emit(\'remove\')">remove</button></div>'
  }
}

const FAKE_GOAL = {
  id: 'g1',
  title: 'Write book',
  why: 'because writers write',
  status: 'ok',
  progress: 0.25,
  targetDate: '2026-12-31',
  linkedProjects: [{ id: 'p1', name: 'Outline', progress: 0.5, kind: 'project' }],
  linkedChores: [{ id: 'c1', name: 'Pages daily', progress: 0.8, kind: 'chore' }]
}

const RISK_GOAL = {
  ...FAKE_GOAL,
  id: 'g2',
  title: 'Marathon',
  status: 'risk',
  linkedProjects: [],
  linkedChores: []
}

const DONE_GOAL = {
  ...FAKE_GOAL,
  id: 'g3',
  title: 'Done',
  status: 'done',
  linkedProjects: [],
  linkedChores: []
}

function mountGoals(storeOverrides = {}) {
  return mount(GoalsView, {
    global: {
      stubs: globalStubs,
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            goals: { goals: [], loading: false, error: '', ...storeOverrides }
          }
        }),
        i18n
      ]
    }
  })
}

describe('GoalsView', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn }))
    vi.clearAllMocks()
  })

  it('mounts cleanly with an empty store', () => {
    const wrapper = mountGoals()
    expect(wrapper.exists()).toBe(true)
  })

  it('calls store.load on mount', () => {
    mountGoals()
    const store = useGoalsStore()
    expect(store.load).toHaveBeenCalledTimes(1)
  })

  it('shows loading text while first load is in flight', () => {
    const wrapper = mountGoals({ loading: true })
    expect(wrapper.text()).toContain('Loading')
  })

  it('renders the empty-state CTA when no goals exist', async () => {
    const wrapper = mountGoals()
    await flushPromises()
    expect(wrapper.find('.goals__empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No goals yet')
    expect(wrapper.text()).toContain('Add your first goal')
  })

  it('renders the hero card when goals exist', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__hero').exists()).toBe(true)
    expect(wrapper.text()).toContain('Write book')
  })

  it('shows status pill for risk goals using the risk label', async () => {
    const wrapper = mountGoals({ goals: [RISK_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__status--risk').exists()).toBe(true)
  })

  it('uses the done label for completed goals', async () => {
    const wrapper = mountGoals({ goals: [DONE_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__status--done').exists()).toBe(true)
  })

  it('renders both hero (first) and grid (rest) goals', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL, RISK_GOAL] })
    await flushPromises()
    expect(wrapper.find('.goals__hero').exists()).toBe(true)
    expect(wrapper.findAll('.goals__card').length).toBe(1)
  })

  it('opens the create modal when "Add your first goal" is clicked', async () => {
    const wrapper = mountGoals()
    await flushPromises()
    const btn = wrapper.findAll('button').find(b => b.text().includes('Add your first goal'))
    await btn.trigger('click')
    expect(wrapper.find('.create-goal-stub').attributes('data-open')).toBe('1')
  })

  it('opens the create modal when the "New goal" action-bar button is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    const btn = wrapper.findAll('button').find(b => b.text().includes('New goal'))
    await btn.trigger('click')
    expect(wrapper.find('.create-goal-stub').attributes('data-open')).toBe('1')
  })

  it('opens the edit modal when a card kebab → Edit is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    await wrapper.find('.goal-menu-stub__edit').trigger('click')
    const editStub = wrapper.find('.edit-goal-stub')
    expect(editStub.attributes('data-open')).toBe('1')
    expect(editStub.attributes('data-goal-id')).toBe('g1')
  })

  it('opens the confirm dialog when a card kebab → Remove is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    await flushPromises()
    await wrapper.find('.goal-menu-stub__remove').trigger('click')
    expect(wrapper.find('.confirm-stub').attributes('data-open')).toBe('1')
  })

  it('calls store.archive when the remove confirm is clicked', async () => {
    const wrapper = mountGoals({ goals: [FAKE_GOAL] })
    const store = useGoalsStore()
    store.archive.mockResolvedValue(undefined)
    await flushPromises()
    await wrapper.find('.goal-menu-stub__remove').trigger('click')
    await wrapper.find('.confirm-stub__confirm').trigger('click')
    await flushPromises()
    expect(store.archive).toHaveBeenCalledWith('g1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/views/GoalsView.test.js`
Expected: FAIL — the new tests reference behavior the view does not yet have (`.create-goal-stub`, etc.).

- [ ] **Step 3: Replace `src/views/GoalsView.vue` with the wired-up version**

Replace the entire file contents:

```vue
<template>
  <div>
    <!-- Screen heading -->
    <AppScreenHeading
      :eyebrow="t('goals.eyebrow')"
      :title="t('goals.headingPrefix')"
      :emphasis="t('goals.headingEmphasis')"
    >
      <template #meta>
        {{ t('goals.metaLine1') }}<br />{{ t('goals.metaLine2') }}
      </template>
    </AppScreenHeading>

    <!-- Loading state -->
    <div v-if="loading && !goals.length" class="goals__status">
      {{ t('goals.loading') }}
    </div>

    <!-- Empty state -->
    <div v-else-if="!goals.length" class="goals__empty">
      <div class="goals__empty-eyebrow">
        {{ t('goals.noGoalsYet') }}
      </div>

      <h2 class="goals__empty-h">
        {{ t('goals.emptyHeadingPrefix') }}<br />

        <em>
          {{ t('goals.emptyHeadingEmphasis') }}
        </em>
      </h2>

      <p class="goals__empty-lede">
        {{ t('goals.emptyLede') }}
      </p>

      <div class="goals__empty-actions">
        <AppButton variant="primary" @click="openCreate">
          <AppIcon name="plus" :size="14" /> {{ t('goals.addFirstGoal') }}
        </AppButton>

        <AppButton variant="ghost">
          {{ t('goals.browseExamples') }}
        </AppButton>
      </div>
    </div>

    <!-- Goals content -->
    <template v-else>
      <!-- Action bar -->
      <div class="goals__actions">
        <AppButton variant="primary" @click="openCreate">
          <AppIcon name="plus" :size="14" /> {{ t('goals.newGoal') }}
        </AppButton>

        <AppButton variant="ghost">
          <AppIcon name="filter" :size="12" /> {{ t('goals.allStatuses') }}
        </AppButton>

        <span class="goals__spacer" />

        <AppButton variant="ghost">
          {{ t('goals.yearEndReview') }}
        </AppButton>
      </div>

      <!-- Most active section -->
      <AppSectionHeader :label="t('goals.mostActive')" />

      <!-- Hero goal card -->
      <div class="goals__hero">
        <div class="goals__hero-top">
          <span class="goals__pill">
            {{ t('goals.pillWriting') }}
          </span>

          <span :class="['goals__status', `goals__status--${goals[0].status}`]">
            {{ statusLabel(goals[0].status) }}
          </span>

          <span class="goals__spacer" />

          <span class="goals__mono">
            {{ t('goals.targetPrefix', { date: goals[0].targetDate }) }}
          </span>

          <GoalCardMenu
            @edit="openEdit(goals[0])"
            @remove="openRemove(goals[0])"
          />
        </div>

        <h3 class="goals__hero-title">
          {{ goals[0].title }}
        </h3>

        <p class="goals__hero-why">
          "{{ goals[0].why }}"
        </p>

        <div class="goals__hero-bar">
          <div class="goals__bar">
            <i :style="{ width: `${goals[0].progress * 100}%` }" />
          </div>

          <span class="goals__pct">
            {{ Math.round(goals[0].progress * 100) }}%
          </span>
        </div>

        <div class="goals__linked">
          <div v-for="l in [...goals[0].linkedProjects, ...goals[0].linkedChores]" :key="l.id" class="goals__link">
            <AppIcon :name="l.kind === 'chore' ? 'chores' : 'projects'" :size="13" />

            <span class="goals__link-name">
              {{ l.name }}
            </span>

            <span class="goals__bar goals__bar--inline">
              <i :style="{ width: `${l.progress * 100}%` }" />
            </span>

            <span class="goals__pct">
              {{ Math.round(l.progress * 100) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- All goals section -->
      <AppSectionHeader :label="t('goals.allGoals')" :count="goals.length" />

      <!-- Goal grid -->
      <div class="goals__grid">
        <div v-for="g in goals.slice(1)" :key="g.id" class="goals__card">
          <div class="goals__hero-top">
            <span :class="['goals__status', `goals__status--${g.status}`]">
              {{ statusLabel(g.status) }}
            </span>

            <span class="goals__spacer" />

            <span class="goals__mono">
              {{ g.targetDate }}
            </span>

            <GoalCardMenu
              @edit="openEdit(g)"
              @remove="openRemove(g)"
            />
          </div>

          <h3 class="goals__card-title">
            {{ g.title }}
          </h3>

          <p class="goals__card-why">
            "{{ g.why }}"
          </p>

          <div class="goals__hero-bar">
            <div class="goals__bar">
              <i :style="{ width: `${g.progress * 100}%`, background: g.status === 'risk' ? 'var(--warn)' : 'var(--accent)' }" />
            </div>

            <span class="goals__pct">
              {{ Math.round(g.progress * 100) }}%
            </span>
          </div>

          <div class="goals__linked">
            <div v-for="l in [...g.linkedProjects, ...g.linkedChores]" :key="l.id" class="goals__link">
              <AppIcon :name="l.kind === 'chore' ? 'chores' : 'projects'" :size="12" />

              <span class="goals__link-name">
                {{ l.name }}
              </span>

              <span class="goals__pct">
                {{ Math.round(l.progress * 100) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <CreateGoalModal v-model="showCreate" />

    <EditGoalModal
      :model-value="!!editingGoal"
      :goal="editingGoal"
      @update:model-value="onEditModalToggle"
    />

    <AppConfirmDialog
      :model-value="!!removingGoal"
      :title="t('goals.removeTitle')"
      :message="removingGoal ? t('goals.removeMessage', { title: removingGoal.title }) : ''"
      :confirm-label="t('goals.removeConfirm')"
      :cancel-label="t('common.cancel')"
      :busy="removing"
      :busy-label="t('goals.removing')"
      @update:model-value="onRemoveDialogToggle"
      @confirm="confirmRemove"
    />
  </div>
</template>

<script>
/** GoalsView — top-level Goals tab. Lists active goals + a hero card. */
import { onMounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalsStore } from '@/stores/goals.store.js'
import AppScreenHeading from '@/components/ui/AppScreenHeading.vue'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import CreateGoalModal from '@/components/goals/CreateGoalModal.vue'
import EditGoalModal from '@/components/goals/EditGoalModal.vue'
import GoalCardMenu from '@/components/goals/GoalCardMenu.vue'

export default {
  name: 'GoalsView',
  components: {
    AppScreenHeading,
    AppSectionHeader,
    AppButton,
    AppIcon,
    AppConfirmDialog,
    CreateGoalModal,
    EditGoalModal,
    GoalCardMenu
  },
  setup() {
    const { t } = useI18n()
    const store = useGoalsStore()
    const goals = computed(() => store.goals)
    const loading = computed(() => store.loading)

    const showCreate = ref(false)
    const editingGoal = ref(null)
    const removingGoal = ref(null)
    const removing = ref(false)

    onMounted(() => store.load())

    return {
      t,
      goals,
      loading,
      showCreate,
      editingGoal,
      removingGoal,
      removing,
      openCreate,
      openEdit,
      openRemove,
      onEditModalToggle,
      onRemoveDialogToggle,
      confirmRemove,
      statusLabel
    }

    function statusLabel(status) {
      if (status === 'risk') return t('goals.statusAtRisk')
      if (status === 'done') return t('goals.statusDone')
      return t('goals.statusOnTrack')
    }

    function openCreate() {
      showCreate.value = true
    }

    function openEdit(goal) {
      editingGoal.value = goal
    }

    function openRemove(goal) {
      removingGoal.value = goal
    }

    function onEditModalToggle(open) {
      if (!open) editingGoal.value = null
    }

    function onRemoveDialogToggle(open) {
      if (!open) removingGoal.value = null
    }

    async function confirmRemove() {
      if (!removingGoal.value || removing.value) return
      removing.value = true

      try {
        await store.archive(removingGoal.value.id)
        removingGoal.value = null
      } catch {
        // toasted by store
      } finally {
        removing.value = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.goals {
  &__status { @apply text-[13px] text-muted; }

  &__empty {
    @apply flex flex-col items-center gap-3.5 rounded-[18px] border border-dashed border-rule-soft bg-paper-2 px-10 py-16 text-center;
  }
  &__empty-eyebrow {
    @apply font-mono uppercase text-muted;
    font-size: 11px;
    letter-spacing: 0.14em;
  }
  &__empty-h {
    @apply font-serif font-normal;
    font-size: 36px;
    line-height: 1.1;

    em { font-style: italic; }
  }
  &__empty-lede {
    @apply max-w-md font-serif italic text-ink-2;
    font-size: 18px;
    line-height: 1.4;
  }
  &__empty-actions { @apply mt-2 flex flex-wrap gap-2; }

  &__actions {
    @apply mb-4 flex flex-wrap items-center gap-2;
  }
  &__spacer { @apply flex-1; }

  &__hero {
    @apply mb-4 flex flex-col gap-3 rounded-[16px] p-7 shadow-sm;
    background: var(--paper-2);
  }
  &__hero-top { @apply flex items-center gap-3; }
  &__pill {
    @apply inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium;
    background: var(--paper-3);
    color: var(--ink-2);
  }
  &__status {
    @apply rounded-full px-2.5 py-1 font-mono uppercase;
    font-size: 10px;
    letter-spacing: 0.14em;

    &--ok { background: color-mix(in oklab, var(--ok) 14%, transparent); color: var(--ok); }
    &--risk { background: color-mix(in oklab, var(--warn) 18%, transparent); color: color-mix(in oklab, var(--warn) 80%, var(--ink)); }
    &--done { background: var(--paper-3); color: var(--muted); }
  }
  &__mono {
    @apply font-mono;
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 0.06em;
  }
  &__hero-title {
    @apply mt-1 font-serif font-normal;
    font-size: 36px;
    line-height: 1;
    letter-spacing: -0.01em;
  }
  &__hero-why {
    @apply mb-1 font-serif italic;
    color: var(--ink-2);
    font-size: 22px;
  }
  &__hero-bar { @apply flex items-center gap-3 pt-1.5; }
  &__bar {
    @apply flex-1 overflow-hidden rounded-full;
    height: 6px;
    background: var(--paper-3);

    > i {
      @apply block h-full rounded-full;
      background: var(--accent);
    }

    &--inline {
      @apply flex-none;
      width: 140px;
      height: 4px;
      background: var(--rule-soft);
    }
  }
  &__pct {
    @apply text-right font-mono;
    color: var(--muted);
    font-size: 12px;
    min-width: 38px;
  }
  &__linked {
    @apply flex flex-col gap-1.5 border-t border-rule-soft pt-2;
  }
  &__link {
    @apply flex items-center gap-2.5 text-[13px];
    color: var(--ink-2);
  }
  &__link-name { @apply flex-1 font-medium; }

  &__grid {
    @apply grid gap-4;
    grid-template-columns: 1fr 1fr;
  }
  &__card {
    @apply flex flex-col gap-3 rounded-[16px] p-5 shadow-sm;
    background: var(--paper-2);
  }
  &__card-title {
    @apply mt-1 font-serif font-normal;
    font-size: 28px;
    line-height: 1;
    letter-spacing: -0.01em;
  }
  &__card-why {
    @apply mb-1 font-serif italic;
    color: var(--ink-2);
    font-size: 18px;
  }
}
</style>
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run tests/views/GoalsView.test.js`
Expected: PASS — 13 tests passing.

- [ ] **Step 5: Run the full goals test suite to confirm nothing regressed**

Run: `npx vitest run tests/components/goals tests/views/GoalsView.test.js tests/stores/goals.store.test.js`
Expected: PASS — all goal-related tests green.

- [ ] **Step 6: Commit**

```bash
git add src/views/GoalsView.vue tests/views/GoalsView.test.js
git commit -m "feat(goals): wire up create/edit/remove modals into GoalsView"
```

---

## Task 7: Full sweep — lint + full test run

**Files:** none (verification only)

- [ ] **Step 1: Lint check**

Run: `npm run lint:check`
Expected: PASS (or warnings only, no errors)

- [ ] **Step 2: Full test suite**

Run: `npm run test:run`
Expected: PASS — all suites green.

If anything beyond the goal tests broke, stop and investigate; do not paper over with `--no-verify`.

- [ ] **Step 3: Manual smoke check (skip if no preview environment)**

Start the dev server: `npm run dev`. Visit the Goals route. Verify:

- Clicking "Add your first goal" (empty state) opens the editorial create modal.
- Saving with empty fields shows invalid-border styling.
- Saving with valid fields closes the modal and appears in the list.
- Clicking the `⋯` menu on any card opens Edit / Remove.
- Edit prefills the form; Save updates the card in place.
- Remove opens the confirm dialog; confirming archives the goal (it disappears).

---
