<template>
  <div class="wren-api-keys" data-testid="wren-api-key-settings">
    <!-- Header -->
    <header class="wren-api-keys__header">
      <KeyIcon class="wren-api-keys__icon" aria-hidden="true" />

      <div>
        <h3 class="wren-api-keys__title">
          Bring your own AI key
        </h3>

        <p class="wren-api-keys__subtitle">
          Use your own Anthropic or OpenAI key for Wren turns. Keys are
          encrypted at rest and only ever decrypted in-memory on your turn.
        </p>
      </div>
    </header>

    <!-- Existing keys list -->
    <div class="wren-api-keys__list">
      <div
        v-for="provider in providers"
        :key="provider"
        class="wren-api-keys__row"
        :data-testid="`wren-api-key-row-${provider}`"
      >
        <div class="wren-api-keys__row-info">
          <span class="wren-api-keys__row-label">
            {{ providerLabel(provider) }}
          </span>

          <span v-if="keyFor(provider)" class="wren-api-keys__row-preview">
            {{ keyFor(provider).keyPreview }}
          </span>

          <span v-else class="wren-api-keys__row-empty">
            Not connected
          </span>
        </div>

        <div class="wren-api-keys__row-actions">
          <button
            v-if="!keyFor(provider)"
            type="button"
            class="wren-api-keys__action wren-api-keys__action--add"
            :disabled="loading || saving[provider]"
            @click="onAddClick(provider)"
          >
            <PlusIcon class="wren-api-keys__action-icon" aria-hidden="true" />
            Add key
          </button>

          <button
            v-else
            type="button"
            class="wren-api-keys__action wren-api-keys__action--remove"
            :disabled="loading || saving[provider]"
            @click="onRemoveClick(provider)"
          >
            <TrashIcon class="wren-api-keys__action-icon" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </div>

    <!-- Inline form (shown when adding) -->
    <form
      v-if="addingProvider"
      class="wren-api-keys__form"
      data-testid="wren-api-key-form"
      @submit.prevent="onSubmit"
    >
      <label class="wren-api-keys__field">
        <span class="wren-api-keys__field-label">
          Paste your {{ providerLabel(addingProvider) }} key
        </span>

        <input
          v-model="keyInput"
          type="password"
          class="wren-api-keys__input"
          autocomplete="off"
          spellcheck="false"
          :placeholder="placeholderFor(addingProvider)"
          :disabled="saving[addingProvider]"
        />
      </label>

      <p class="wren-api-keys__field-hint">
        Saved keys are encrypted with AES-256-GCM. The plaintext leaves
        your browser only once and is never sent back.
      </p>

      <div class="wren-api-keys__form-actions">
        <button
          type="button"
          class="wren-api-keys__btn wren-api-keys__btn--cancel"
          :disabled="saving[addingProvider]"
          @click="onCancel"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="wren-api-keys__btn wren-api-keys__btn--save"
          :disabled="saving[addingProvider] || !keyInput.trim()"
        >
          {{ saving[addingProvider] ? 'Saving…' : 'Save key' }}
        </button>
      </div>

      <p v-if="error" class="wren-api-keys__error" role="alert">
        {{ error }}
      </p>
    </form>

    <!-- Success / general status -->
    <p v-if="status" class="wren-api-keys__status">
      {{ status }}
    </p>
  </div>
</template>

<script>
/**
 * WrenApiKeySettings — BYOK form for the Plan settings page. Lists the
 * Anthropic + OpenAI providers, shows the masked preview of any
 * already-stored key, and provides Add / Remove actions that hit the
 * setUserApiKey / removeUserApiKey GraphQL mutations.
 *
 * Security shape:
 *   - The input type is `password` so screen-readers + 1Password don't
 *     leak the value to the screen.
 *   - autocomplete=off + spellcheck=false stop the browser caching the
 *     plaintext in form history.
 *   - We never round-trip the plaintext: after save we clear the input
 *     and reload only the metadata (provider + keyPreview).
 *   - The remove confirm is a plain window.confirm — good enough for a
 *     destructive but recoverable action (the user can paste again).
 */
import { computed, reactive, ref, onMounted } from 'vue'
import { KeyIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useApolloClient } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const QUERY_USER_API_KEYS = gql`
  query UserApiKeys {
    userApiKeys {
      id
      provider
      keyPreview
      addedAt
      lastUsedAt
    }
  }
`

const MUTATION_SET_USER_API_KEY = gql`
  mutation SetUserApiKey($provider: ApiKeyProvider!, $plaintext: String!) {
    setUserApiKey(provider: $provider, plaintext: $plaintext) {
      id
      provider
      keyPreview
      addedAt
      lastUsedAt
    }
  }
`

const MUTATION_REMOVE_USER_API_KEY = gql`
  mutation RemoveUserApiKey($provider: ApiKeyProvider!) {
    removeUserApiKey(provider: $provider)
  }
`

const PROVIDERS = ['anthropic', 'openai']

export default {
  name: 'WrenApiKeySettings',
  components: { KeyIcon, PlusIcon, TrashIcon },
  setup() {
    const { client } = useApolloClient()

    const keys = ref([])
    const loading = ref(true)
    const saving = reactive({ anthropic: false, openai: false })
    const addingProvider = ref(null)
    const keyInput = ref('')
    const error = ref('')
    const status = ref('')

    const keyFor = (provider) => keys.value.find((k) => k.provider === provider) ?? null

    const providers = computed(() => PROVIDERS)

    onMounted(loadKeys)

    return {
      providers,
      keys,
      loading,
      saving,
      addingProvider,
      keyInput,
      error,
      status,
      keyFor,
      providerLabel,
      placeholderFor,
      onAddClick,
      onCancel,
      onSubmit,
      onRemoveClick,
    }

    function providerLabel(provider) {
      if (provider === 'anthropic') return 'Anthropic (Claude)'
      if (provider === 'openai') return 'OpenAI (GPT)'
      return provider
    }

    function placeholderFor(provider) {
      if (provider === 'anthropic') return 'sk-ant-api03-…'
      if (provider === 'openai') return 'sk-…'
      return ''
    }

    async function loadKeys() {
      loading.value = true
      error.value = ''

      try {
        const { data } = await client.query({
          query: QUERY_USER_API_KEYS,
          fetchPolicy: 'no-cache',
        })

        keys.value = Array.isArray(data?.userApiKeys) ? data.userApiKeys : []
      } catch (e) {
        error.value = e?.message || 'Failed to load BYOK keys'
      } finally {
        loading.value = false
      }
    }

    function onAddClick(provider) {
      addingProvider.value = provider
      keyInput.value = ''
      error.value = ''
      status.value = ''
    }

    function onCancel() {
      addingProvider.value = null
      keyInput.value = ''
      error.value = ''
    }

    async function onSubmit() {
      const provider = addingProvider.value
      if (!provider) return
      saving[provider] = true
      error.value = ''

      try {
        await client.mutate({
          mutation: MUTATION_SET_USER_API_KEY,
          variables: { provider, plaintext: keyInput.value.trim() },
        })

        status.value = `${providerLabel(provider)} key saved.`
        keyInput.value = ''
        addingProvider.value = null
        await loadKeys()
      } catch (e) {
        error.value = e?.message || 'Save failed'
      } finally {
        saving[provider] = false
      }
    }

    async function onRemoveClick(provider) {
      const ok = window.confirm(
        `Remove your ${providerLabel(provider)} key? Wren will fall back to the All You Plan default.`,
      )

      if (!ok) return
      saving[provider] = true
      error.value = ''

      try {
        await client.mutate({
          mutation: MUTATION_REMOVE_USER_API_KEY,
          variables: { provider },
        })

        status.value = `${providerLabel(provider)} key removed.`
        await loadKeys()
      } catch (e) {
        error.value = e?.message || 'Remove failed'
      } finally {
        saving[provider] = false
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.wren-api-keys {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.wren-api-keys__header {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.wren-api-keys__icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--accent, #b87f00);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.wren-api-keys__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.wren-api-keys__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--muted, #555);
  line-height: 1.45;
}

.wren-api-keys__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wren-api-keys__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--paper-3, #d8d6cf);
  border-radius: 0.5rem;
  background: var(--paper-2, #fff);
}

.wren-api-keys__row-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.wren-api-keys__row-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.wren-api-keys__row-preview {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.8rem;
  color: var(--muted, #555);
}

.wren-api-keys__row-empty {
  font-size: 0.8rem;
  color: var(--muted, #999);
}

.wren-api-keys__row-actions {
  display: flex;
  gap: 0.5rem;
}

.wren-api-keys__action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--paper-3, #d8d6cf);
  border-radius: 0.375rem;
  font-size: 0.8rem;
  background: var(--paper-2, #fff);
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &--remove {
    color: var(--bad, #b00020);
  }
}

.wren-api-keys__action-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.wren-api-keys__form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: var(--paper-2, #f5f3ec);
}

.wren-api-keys__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.wren-api-keys__field-label {
  font-size: 0.85rem;
  color: var(--ink-2, #333);
}

.wren-api-keys__input {
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--paper-3, #d8d6cf);
  border-radius: 0.375rem;
  background: var(--paper-2, #fff);
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85rem;
}

.wren-api-keys__field-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted, #777);
  line-height: 1.4;
}

.wren-api-keys__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.wren-api-keys__btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--cancel {
    background: transparent;
    border-color: var(--paper-3, #d8d6cf);
    color: var(--ink-2, #333);
  }

  &--save {
    background: var(--accent, #b87f00);
    color: white;
  }
}

.wren-api-keys__error {
  margin: 0.25rem 0 0;
  color: var(--bad, #b00020);
  font-size: 0.8rem;
}

.wren-api-keys__status {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ok, #1a7a3a);
}
</style>
