<template>
  <span
    v-if="visible"
    class="wren-origin-badge"
    :title="label"
    :aria-label="label"
  >
    <AppIcon name="sparkles" :size="12" solid />
  </span>
</template>

<script>
/**
 * WrenOriginBadge — a small sparkles glyph rendered next to an entity Wren
 * has applied an action to in the current session. Reads `originRefs` from
 * the wren store so the badge appears as soon as the WrenActionEvent lands
 * and persists across renders for the rest of the session.
 *
 * Renders nothing when the (refType, refId) pair is not in the origin set,
 * so callers can mount it unconditionally — there's no need to gate the
 * component at the call site.
 *
 * The label is intentionally hardcoded English rather than going through
 * vue-i18n so the badge stays mountable from any component test without
 * forcing the test to install the i18n plugin (the badge is rendered from
 * many row/card components whose unit tests don't otherwise need i18n).
 */
import { computed } from 'vue'
import { useWrenStore } from '@/stores/wren.store.js'
import AppIcon from '@/components/ui/AppIcon.vue'

const LABEL = 'Created by Wren'

export default {
  name: 'WrenOriginBadge',
  components: { AppIcon },
  props: {
    /** Entity domain ('task', 'project', 'chore', 'calendar_event', etc.). */
    refType: { type: String, required: true },
    /** Entity identifier as returned by the API. */
    refId: { type: [String, Number], required: true }
  },
  setup(props) {
    // -- State --
    const store = useWrenStore()

    // -- Computed --
    /** True when (refType, refId) is in the wren store's origin set for the current session. */
    const visible = computed(() => store.isWrenOrigin(props.refType, String(props.refId)))

    return { visible, label: LABEL }
  }
}
</script>

<style lang="scss" scoped>
.wren-origin-badge {
  @apply inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-ink;
}
</style>
