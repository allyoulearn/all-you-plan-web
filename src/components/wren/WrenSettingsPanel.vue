<template>
  <div class="wren-settings">
    <!-- Header -->
    <header class="wren-settings__header">
      <h2 class="wren-settings__title">
        Wren settings
      </h2>
    </header>

    <!-- Settings form -->
    <form class="wren-settings__form" @submit.prevent="onSave">
      <!-- Display name field -->
      <label class="wren-settings__field">
        <span class="wren-settings__label">
          Display name
        </span>

        <input
          v-model="form.displayName"
          type="text"
          maxlength="100"
          class="wren-settings__input"
          :disabled="loading"
        />
      </label>

      <!-- Tone field -->
      <label class="wren-settings__field">
        <span class="wren-settings__label">
          Tone
        </span>

        <select v-model="form.tone" class="wren-settings__input" :disabled="loading">
          <option value="warm">
            Warm
          </option>

          <option value="direct">
            Direct
          </option>

          <option value="playful">
            Playful
          </option>

          <option value="gentle">
            Gentle
          </option>
        </select>
      </label>

      <!-- Enable toggle -->
      <label class="wren-settings__field wren-settings__field--inline">
        <input
          v-model="form.enabled"
          type="checkbox"
          class="wren-settings__checkbox"
          :disabled="loading"
        />

        <span class="wren-settings__label">
          Enable Wren
        </span>
      </label>

      <!-- Daily turn cap field -->
      <label class="wren-settings__field">
        <span class="wren-settings__label">
          Daily turn cap (1-1000, blank for default)
        </span>

        <input
          v-model.number="form.dailyTurnCap"
          type="number"
          min="1"
          max="1000"
          class="wren-settings__input"
          :disabled="loading"
        />
      </label>

      <!-- Submit button -->
      <div class="wren-settings__actions">
        <AppButton
          type="submit"
          variant="primary"
          size="md"
          :disabled="saving || loading"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </AppButton>
      </div>

      <!-- Error message -->
      <p v-if="error" class="wren-settings__error" role="alert">
        {{ error }}
      </p>

      <!-- Saved confirmation -->
      <p v-if="saved" class="wren-settings__saved">
        Saved
      </p>
    </form>
  </div>
</template>

<script>
/**
 * WrenSettingsPanel — form panel for tone, displayName, enabled, and
 * dailyTurnCap.
 *
 * Responsibility:
 *   Standalone settings form. Loads the user's WrenSettings on mount via
 *   the wren store, presents an editable form, and persists changes via
 *   updateWrenSettings on submit.
 *
 * Props / Emits:
 *   None — the panel reads and writes the wren store directly.
 *
 * Non-obvious behaviour:
 *   - An empty `displayName` text field is sent as `null` (clear field)
 *     rather than `""` so the API resolver treats it as an explicit unset.
 *   - An empty `dailyTurnCap` number field is sent as `null` (use default
 *     cap) rather than `NaN`.
 *   - Initial mount sets loading=true and disables all inputs until
 *     loadSettings resolves; the form is then re-populated from
 *     store.settings.
 *   - Save status is rendered inline (no toast) because the panel sits in
 *     a settings context where inline feedback is preferred.
 */
import { ref, onMounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useWrenStore } from '@/stores/wren.store.js'

export default {
  name: 'WrenSettingsPanel',
  components: { AppButton },
  setup() {
    // -- State --
    const form = ref({ displayName: '', tone: 'warm', enabled: true, dailyTurnCap: null })
    const loading = ref(true)
    const saving = ref(false)
    const error = ref('')
    const saved = ref(false)

    // -- Lifecycle --
    onMounted(async () => {
      const store = useWrenStore()

      try {
        await store.loadSettings()

        if (store.settings) {
          form.value = {
            displayName: store.settings.displayName ?? '',
            tone: store.settings.tone ?? 'warm',
            enabled: store.settings.enabled ?? true,
            dailyTurnCap: store.settings.dailyTurnCap ?? null
          }
        }
      } catch (e) {
        error.value = e?.message || 'Failed to load settings'
      } finally {
        loading.value = false
      }
    })

    return {
      form,
      loading,
      saving,
      error,
      saved,
      onSave,
    }

    // -- Function definitions --

    /**
     * Persist the current form values via `useWrenStore().updateSettings`.
     * Normalises empty strings to `null` so the resolver treats them as
     * explicit unsets rather than literal empty values.
     */
    async function onSave() {
      const store = useWrenStore()
      saving.value = true
      saved.value = false
      error.value = ''

      const patch = {
        displayName: form.value.displayName || null,
        tone: form.value.tone,
        enabled: form.value.enabled,
        dailyTurnCap:
          form.value.dailyTurnCap === '' || form.value.dailyTurnCap == null
            ? null
            : Number(form.value.dailyTurnCap)
      }

      const res = await store.updateSettings(patch)
      saving.value = false
      if (res) saved.value = true
      else error.value = 'Save failed'
    }
  }
}
</script>

<style scoped>
.wren-settings {
  padding: 1rem;
}
.wren-settings__title {
  font-size: 1.125rem;
  margin-bottom: 1rem;
}
.wren-settings__field {
  display: block;
  margin-bottom: 0.875rem;
}
.wren-settings__field--inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.wren-settings__label {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: var(--ink-2, #444);
}
.wren-settings__input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--paper-3, #d8d6cf);
  border-radius: 0.25rem;
  background: var(--paper-1, #fff);
  font-size: 0.875rem;
}
.wren-settings__checkbox {
  width: 1rem;
  height: 1rem;
}
.wren-settings__actions {
  margin-top: 1rem;
}
.wren-settings__error {
  margin-top: 0.5rem;
  color: var(--red-6, #b00020);
  font-size: 0.875rem;
}
.wren-settings__saved {
  margin-top: 0.5rem;
  color: var(--green-6, #1a7a3a);
  font-size: 0.875rem;
}
</style>
