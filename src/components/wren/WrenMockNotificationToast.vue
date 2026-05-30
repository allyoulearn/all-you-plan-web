<template>
  <!-- Floating Wren toast — proactive nudge that fires every 30s in mock mode.
       Slides in from the right edge, lingers for AUTO_DISMISS_MS, exits with
       a softer fade-and-slide. Hovering pauses the auto-dismiss so the user
       can read the longer messages. -->
  <Teleport to="body">
    <Transition name="wren-toast">
      <div
        v-if="visible && notification"
        :key="notification.key"
        :class="[
          'wren-toast',
          `wren-toast--${notification.accent}`,
          {
            'wren-toast--dock-hidden': wrenCollapsed,
            'wren-toast--drawer-open': wrenOpen
          }
        ]"
        role="status"
        aria-live="polite"
        @mouseenter="pauseCountdown"
        @mouseleave="resumeCountdown"
      >
        <!-- Decorative glow layer behind the card; the accent colour bleeds
             through here so the card itself can stay paper-coloured. -->
        <div class="wren-toast__glow" aria-hidden="true" />

        <!-- Type bar with shimmer sweep on entry. -->
        <div class="wren-toast__bar" aria-hidden="true">
          <span class="wren-toast__bar-fill" />
        </div>

        <div class="wren-toast__body">
          <span class="wren-toast__avatar" aria-hidden="true">
            <span class="wren-toast__avatar-letter">
              W
            </span>

            <span class="wren-toast__avatar-pulse" />
          </span>

          <div class="wren-toast__main">
            <div class="wren-toast__eyebrow-row">
              <component
                :is="iconComponent"
                v-if="iconComponent"
                class="wren-toast__eyebrow-icon"
                aria-hidden="true"
              />

              <span class="wren-toast__eyebrow">
                {{ notification.label }}
              </span>

              <span class="wren-toast__source">
                Wren
              </span>
            </div>

            <p class="wren-toast__text">
              {{ notification.text }}
            </p>

            <div v-if="notification.cta" class="wren-toast__actions">
              <button
                type="button"
                class="wren-toast__cta"
                @click="onCta"
              >
                {{ notification.cta.label }}

                <ArrowRightIcon class="wren-toast__cta-icon" aria-hidden="true" />
              </button>

              <button
                type="button"
                class="wren-toast__dismiss-link"
                @click="dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            type="button"
            class="wren-toast__close"
            aria-label="Dismiss Wren notification"
            @click="dismiss"
          >
            <XMarkIcon class="wren-toast__close-icon" aria-hidden="true" />
          </button>
        </div>

        <!-- Countdown bar fills down to zero, then auto-dismisses. -->
        <div class="wren-toast__progress" aria-hidden="true">
          <span
            class="wren-toast__progress-fill"
            :style="{
              animationDuration: `${AUTO_DISMISS_MS}ms`,
              animationPlayState: paused ? 'paused' : 'running'
            }"
            @animationend="dismiss"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
/**
 * WrenMockNotificationToast — floating, animated proactive Wren toast.
 *
 * Driven by `useWrenMockNotifications` which fires a fresh notification every
 * 30s in mock mode. The toast self-dismisses via the bottom progress bar's
 * `animationend` (cheaper than a parallel JS timer and stays perfectly in
 * sync with the visible countdown).
 *
 * Hover pauses the CSS animation; mouseleave resumes it from wherever it was.
 */
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  XMarkIcon,
  ArrowRightIcon,
  SparklesIcon,
  FireIcon,
  HeartIcon,
  LightBulbIcon,
  ClockIcon,
  HandRaisedIcon,
  BookmarkIcon,
  CheckBadgeIcon
} from '@heroicons/vue/24/outline'
import { SparklesIcon as SparkleSolid } from '@heroicons/vue/24/solid'

const ICON_MAP = {
  sparkles: SparklesIcon,
  fire: FireIcon,
  heart: HeartIcon,
  lightbulb: LightBulbIcon,
  clock: ClockIcon,
  'hand-raised': HandRaisedIcon,
  bookmark: BookmarkIcon,
  'check-badge': CheckBadgeIcon,
  sparkle: SparkleSolid
}

const CTA_ROUTES = {
  today: '/',
  chores: '/chores',
  wren: '/wren'
}

const AUTO_DISMISS_MS = 8000

export default {
  name: 'WrenMockNotificationToast',
  components: { XMarkIcon, ArrowRightIcon },
  props: {
    /** Current notification payload (or null when nothing is on screen). */
    notification: {
      type: Object,
      default: null
    },
    /**
     * True when the Wren panel is open as a drawer (below lg). Drives the
     * toast off the right edge by the drawer width so it does not slide in
     * underneath an already-open Wren surface.
     */
    wrenOpen: {
      type: Boolean,
      default: false
    },
    /**
     * True when the docked Wren panel has been collapsed at lg+. With the
     * dock hidden, the toast snaps back to the viewport's right edge instead
     * of leaving a 320–360px gap where the dock used to be.
     */
    wrenCollapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['dismiss'],
  setup(props, { emit }) {
    const router = useRouter()
    const paused = ref(false)
    const visible = ref(Boolean(props.notification))

    // Reset visibility on every new notification so the Transition fires its
    // enter animation; if a previous toast was still on-screen, the parent
    // composable has already swapped it for us.
    watch(
      () => props.notification?.key,
      next => {
        if (next) {
          visible.value = false

          // Yield one tick so Vue actually unmounts the previous node before
          // we flip back to true — otherwise the Transition skips the enter.
          requestAnimationFrame(() => {
            visible.value = true
          })
        } else {
          visible.value = false
        }
      }
    )

    const iconComponent = computed(() => {
      const name = props.notification?.icon
      return name ? ICON_MAP[name] ?? null : null
    })

    return {
      AUTO_DISMISS_MS,
      visible,
      paused,
      iconComponent,
      dismiss,
      onCta,
      pauseCountdown,
      resumeCountdown
    }

    function dismiss() {
      visible.value = false
      emit('dismiss')
    }

    function onCta() {
      const action = props.notification?.cta?.action
      const path = action ? CTA_ROUTES[action] : null
      if (path) router.push(path).catch(() => {})
      dismiss()
    }

    function pauseCountdown() {
      paused.value = true
    }

    function resumeCountdown() {
      paused.value = false
    }
  }
}
</script>

<style lang="scss" scoped>
.wren-toast {
  // Pin to the bottom-right above the docked Wren panel at lg+ and clear of
  // the device's safe-area insets on mobile. The toast hard-caps at 360px so
  // it never crowds the main content column even on narrow viewports.
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  right: calc(env(safe-area-inset-right, 0px) + 24px);
  z-index: 40;
  width: min(360px, calc(100vw - 32px));
  isolation: isolate;
  border-radius: 18px;
  background: var(--paper);
  border: 1px solid var(--rule-soft);
  box-shadow:
    0 1px 2px rgba(20, 18, 12, 0.06),
    0 18px 48px rgba(20, 18, 12, 0.16);
  overflow: hidden;
  cursor: default;
  // Animate the right offset so collapsing / opening the Wren panel slides
  // the toast smoothly into its new resting spot instead of snapping.
  transition: right 280ms cubic-bezier(0.16, 1, 0.3, 1);

  // Slot the toast above the Wren dock on lg+. The Wren panel is 320–360px
  // wide on the right, so we push the toast left of that column on those
  // breakpoints so the two surfaces never overlap.
  @media (min-width: 1024px) {
    right: calc(320px + 24px);
  }

  @media (min-width: 1280px) {
    right: calc(360px + 32px);
  }

  // Below lg the Wren panel is a slide-in drawer (max 420px). When it is
  // open, push the toast clear of the drawer so the two surfaces don't
  // stack. The drawer + scrim cover most of a phone anyway, so on the
  // narrowest viewports we just slide the toast all the way off — the
  // composable keeps firing in the background and the next interval after
  // the drawer closes will land normally.
  &--drawer-open {
    @media (max-width: 1023.98px) {
      right: calc(env(safe-area-inset-right, 0px) + min(420px, 100vw) + 16px);
    }
  }

  // Dock collapsed at lg+ — the right column is gone, so snap to the edge.
  &--dock-hidden {
    @media (min-width: 1024px) {
      right: calc(env(safe-area-inset-right, 0px) + 24px);
    }
  }
}

.wren-toast__glow {
  // Soft accent halo behind the card. Uses color-mix so each notification
  // type gets its own tint without us hardcoding a colour table.
  position: absolute;
  inset: -40px;
  z-index: -1;
  border-radius: 32px;
  background: radial-gradient(
    60% 60% at 80% 20%,
    color-mix(in oklab, var(--wren-toast-accent) 38%, transparent) 0%,
    transparent 70%
  );
  filter: blur(28px);
  opacity: 0.85;
  animation: wren-toast-glow-breathe 4s ease-in-out infinite;
}

.wren-toast__bar {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: color-mix(in oklab, var(--wren-toast-accent) 30%, var(--paper-2));
  overflow: hidden;
}

.wren-toast__bar-fill {
  // Vertical sweep that travels from top to bottom once on entry. Uses a
  // gradient mask so the bar feels lit rather than painted.
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--wren-toast-accent) 50%,
    transparent 100%
  );
  transform: translateY(-100%);
  animation: wren-toast-sweep 1.4s ease-out 200ms 1 forwards;
}

.wren-toast__body {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  padding: 14px 14px 12px 18px;
}

.wren-toast__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-family: 'Instrument Serif', ui-serif, Georgia, serif;
  font-style: italic;
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
  animation: wren-toast-avatar-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 1 both;
}

.wren-toast__avatar-letter {
  position: relative;
  z-index: 1;
}

.wren-toast__avatar-pulse {
  // Concentric "online" ping behind the avatar. Throttled to once per 2.4s so
  // it reads as a heartbeat, not a strobe.
  position: absolute;
  inset: -4px;
  border-radius: 999px;
  border: 2px solid var(--wren-toast-accent);
  opacity: 0;
  animation: wren-toast-pulse 2.4s ease-out infinite;
}

.wren-toast__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wren-toast__eyebrow-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.wren-toast__eyebrow-icon {
  width: 14px;
  height: 14px;
  color: var(--wren-toast-accent);
  flex-shrink: 0;
}

.wren-toast__eyebrow {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--wren-toast-accent);
  white-space: nowrap;
  flex-shrink: 0;
}

.wren-toast__source {
  margin-left: auto;
  font-family: 'Instrument Serif', ui-serif, Georgia, serif;
  font-style: italic;
  font-size: 13px;
  color: var(--muted);
}

.wren-toast__text {
  color: var(--ink);
  font-size: 13.5px;
  line-height: 1.5;
  margin: 2px 0 0 0;
  // Two-line clamp keeps the toast height predictable; the full message is
  // still readable because the writing pool keeps each entry short.
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wren-toast__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.wren-toast__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in oklab, var(--wren-toast-accent) 40%, transparent);
  background: color-mix(in oklab, var(--wren-toast-accent) 12%, var(--paper));
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 160ms ease, transform 160ms ease;

  &:hover {
    background: color-mix(in oklab, var(--wren-toast-accent) 22%, var(--paper));
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--wren-toast-accent);
    outline-offset: 2px;
  }
}

.wren-toast__cta-icon {
  width: 12px;
  height: 12px;
}

.wren-toast__dismiss-link {
  background: none;
  border: 0;
  padding: 0;
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;

  &:hover {
    color: var(--ink);
  }
}

.wren-toast__close {
  align-self: flex-start;
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;

  &:hover {
    background: var(--paper-2);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.wren-toast__close-icon {
  width: 14px;
  height: 14px;
}

.wren-toast__progress {
  position: relative;
  height: 3px;
  background: var(--paper-2);
}

.wren-toast__progress-fill {
  display: block;
  height: 100%;
  width: 100%;
  background: linear-gradient(
    90deg,
    var(--wren-toast-accent),
    color-mix(in oklab, var(--wren-toast-accent) 60%, var(--accent))
  );
  transform-origin: left center;
  animation-name: wren-toast-countdown;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

// Per-type accent: drives the bar, eyebrow, glow, and pulse ring. CSS var so
// every selector that needs the colour can read one source of truth.
.wren-toast--accent {
  --wren-toast-accent: var(--accent);
}

.wren-toast--ok {
  --wren-toast-accent: var(--ok);
}

.wren-toast--warn {
  --wren-toast-accent: var(--warn);
}

.wren-toast--bad {
  --wren-toast-accent: var(--bad);
}

// -- Animations --

@keyframes wren-toast-countdown {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@keyframes wren-toast-pulse {
  0% {
    transform: scale(0.85);
    opacity: 0.6;
  }
  70% {
    transform: scale(1.4);
    opacity: 0;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

@keyframes wren-toast-avatar-pop {
  0% {
    transform: scale(0.4) rotate(-6deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.08) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes wren-toast-sweep {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@keyframes wren-toast-glow-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.05);
  }
}

// -- Vue Transition (enter / leave) --

.wren-toast-enter-active {
  // Spring-style curve so the toast settles instead of snapping. The slight
  // overshoot reads as "Wren is leaning in to say something".
  transition:
    transform 460ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 320ms ease-out;
}

.wren-toast-leave-active {
  // Quicker exit — gets out of the user's way once they've dismissed.
  transition:
    transform 220ms cubic-bezier(0.4, 0, 1, 1),
    opacity 220ms ease-in;
}

.wren-toast-enter-from {
  transform: translateX(120%) translateY(8px) scale(0.96);
  opacity: 0;
}

.wren-toast-leave-to {
  transform: translateX(40%) scale(0.96);
  opacity: 0;
}

// Respect users who'd rather not have motion in their UI.
@media (prefers-reduced-motion: reduce) {
  .wren-toast-enter-active,
  .wren-toast-leave-active {
    transition: opacity 200ms ease;
  }

  .wren-toast-enter-from,
  .wren-toast-leave-to {
    transform: none;
    opacity: 0;
  }

  .wren-toast__avatar,
  .wren-toast__avatar-pulse,
  .wren-toast__bar-fill,
  .wren-toast__glow {
    animation: none;
  }
}
</style>
