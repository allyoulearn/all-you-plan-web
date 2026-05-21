# All You Plan Web — Premium Redesign & Persistent AI Assistant

**Date:** 2026-05-21
**Status:** Design approved, pending spec review
**Scope:** `all-you-plan-web` (Vue 3 + Vite + Tailwind + Apollo). No API changes required.

## Overview

Two goals drive this work:

1. **Visual sophistication.** The app currently reads as flat and sparse — uniform glass cards, little depth, minimal motion. The target is a "premium productivity" feel in the spirit of Linear and Superhuman: layered surfaces, purposeful motion, and information density that feels substantial rather than cluttered.
2. **Persistent AI access.** AI presently surfaces in only two places — the briefing banner on the dashboard and the suggested-quadrant banner inside the task slide-over. The goal is to make AI assistance available from anywhere in the app, through both a persistent chat panel and contextual inline suggestions.

This is a full-app overhaul of the web client. It touches the visual system, dashboard, app shell, task interactions, and adds a new AI assistant subsystem. It does **not** change the GraphQL API.

## Decisions

| Topic | Decision |
| --- | --- |
| Visual direction | Premium productivity (Linear / Superhuman tier) |
| Design approach | Depth & layering combined with information density |
| AI chat placement | Right-side panel, toggled from the sidebar, content pushes left |
| AI inline suggestions | Contextual indicators throughout the app |
| AI proactiveness | Adaptive — volume tied to the existing nudge-frequency setting |
| AI backend | Hybrid — structured rule-based assistant now, behind a pluggable `AssistantProvider` interface so a real LLM can be added later with no UI rework |

### Rejected alternatives

- **Bottom drawer / floating window for the chat panel** — rejected. A right-side panel mirrors the existing task slide-over pattern and does not compete with the Eisenhower grid for vertical space.
- **Depth-only or density-only visual approach** — rejected. Scope is a full overhaul; combining both produces the largest coherent upgrade.
- **Real LLM backend now** — deferred. It would expand scope into `all-you-plan-api` (an `aiChat` resolver, conversation storage, an API key, per-message cost). The hybrid keeps that decision open without blocking the redesign.
- **Rule-based assistant with no chat input** — rejected. The hybrid keeps a real text input and a clean provider boundary so the upgrade path to an LLM requires no UI changes.

## Non-goals

- No changes to `all-you-plan-api`, `all-you-plan-mobile`, or any GraphQL schema.
- No real LLM integration in this work. The provider interface is designed for it; implementing it is future work (see "Future extension").
- No new routes or pages. The briefing, settings, space, and auth views keep their current routes.
- No internationalisation work beyond what already exists. New strings follow the existing i18n pattern.
- No authentication or data-model changes.

## Section 1 — Visual System

The foundation every other section builds on. Implemented primarily in `tailwind.config.mjs` and `src/assets/main.css`.

### Surfaces (three-tier hierarchy)

- **Base** — the page background becomes a subtle vertical gradient (`#0c1424` to `#0a1018`) rather than a flat fill.
- **Elevated** — cards and panels keep the glass-morphism treatment and gain a 2px gradient accent bar along their top edge (a quadrant or brand colour fading to transparent toward the right). A faint inner glow appears on hover.
- **Floating** — modals, the task slide-over, and the AI panel use a higher backdrop blur, a stronger border, and a soft teal-tinted box-shadow.

### Tokens and utilities

Add to `tailwind.config.mjs`:

- Surface colour tokens for the three tiers (base / elevated / floating) so components do not hand-code rgba values.
- New keyframe animations: `ripple` (completion feedback), `message-in` (chat message entry), `number-flip` (counter updates). Existing `check-bounce`, `slide-up`, `fade-in`, `glow-pulse` are retained.
- Box-shadow tokens for the floating tier and for ambient glows.

Add to `main.css`:

- A `.surface-accent` component class for the gradient accent bar.
- A `.radial-glow` utility for the ambient light spots.
- Standardised focus-ring styling (`ring-1 ring-primary-500/30`) applied to inputs.

### Motion

- Task checkbox completion: existing bounce, plus a brief radial ripple in the quadrant colour.
- Card hover: border brightens one step; `scale(1.005)` transform.
- Page/route transitions: slide-up with fade, 200ms ease-out.
- AI suggestions: fade-in over 300ms; fade-out on dismiss.
- All interactive elements share a 150ms hover transition.

### Typography

- Page titles move to `text-2xl`, `font-semibold`, high-contrast white.
- Secondary text standardises on `slate-400`.
- Numeric data (counts, dates, streak figures) uses JetBrains Mono for a "dashboard instrument" feel.

## Section 2 — Dashboard

### Stats row (new)

A horizontal row of three compact stat cards, placed between the header and the briefing banner. Component: `components/dashboard/StatsRow.vue`, with a child `StatCard.vue`.

- **Completion rate** — a circular progress ring plus a percentage. Defined as the share of *tasks due today* that are completed, computed client-side from the existing `GET_TASKS_DUE_TODAY` query. (Chosen so no new API field is needed; documented here because it is a deliberate definition.)
- **Overdue** — a count with a status dot that pulses only when the count is greater than zero. Sourced from the briefing's `overdueTasks` length.
- **Streak** — a fire icon and the day count, from the briefing's `streak.current`.

Cards use the elevated surface tier, monospace numerals, and a single-row height.

### Briefing banner upgrade

`components/dashboard/BriefingBanner.vue` is modified, not replaced:

- Background becomes a low-opacity teal-to-pink gradient.
- A radial glow sits in the top-right corner.
- A small gradient AI avatar icon precedes the greeting.
- When the briefing contains actionable `quadrantShifts`, a teal ghost-button pill appears (e.g. "3 tasks could be rescheduled") that opens the AI panel pre-loaded with that context.

### Eisenhower matrix cards

`components/dashboard/QuadrantCard.vue` is modified:

- A gradient accent bar along the top edge in the quadrant colour.
- A count badge in the top-right of the card header — a low-opacity quadrant-coloured circle.
- Task rows shift slightly and brighten their border on hover.
- Tasks whose `suggestedQuadrant` differs from their current quadrant show an AI sparkle dot (see Section 4).

## Section 3 — AI Assistant Panel (Hybrid)

### Architecture

The panel UI is fully built now. Its intelligence is deterministic but sits behind a pluggable interface.

**Provider boundary.** A single interface decouples the UI from the intelligence:

```
// src/assistant/types.js — JSDoc typedefs (the app is JavaScript, not TypeScript)

AssistantContext  { page, spaceId, taskId, nudgeFrequency }
AssistantResponse { text (markdown), actions?: AssistantAction[], taskRefs?: string[] }
AssistantSuggestion { id, summary, intent, taskRefs?, actions? }
AssistantProvider {
  send(message, context)        => Promise<AssistantResponse>
  getSuggestions(context)       => Promise<AssistantSuggestion[]>
}
```

- `src/assistant/index.js` — a `createAssistantProvider()` factory. Returns the rule-based provider today.
- `src/assistant/ruleBasedProvider.js` — the default implementation. Matches user text against a fixed intent set and answers deterministically using existing GraphQL operations and Pinia stores. No new API.
- `src/assistant/intents.js` — intent definitions and the matcher.
- `src/assistant/context.js` — builds an `AssistantContext` from the current route and stores.

The panel and the assistant store never reference a concrete provider. Swapping in an LLM later means adding `llmProvider.js` and changing one line in the factory.

### Intent set (rule-based provider)

| Intent | Trigger (text or quick action) | Response |
| --- | --- | --- |
| `plan_day` | "plan my day", "what should I focus on" | Suggested focus order from the briefing |
| `overdue` | "what's overdue", "what's late" | List of overdue tasks |
| `rebalance` | "rebalance", "reorganize quadrants" | Quadrant-shift suggestions, with an action to apply |
| `whats_next` | "what's next" | Top task from the focus order |
| `summarize_space` | space context only | Per-quadrant task breakdown for the space |
| `explain_suggestion` | opened from a sparkle dot | The suggestion's reason string |
| `capabilities` | "help", "what can you do" | List of supported actions |
| `fallback` | unrecognised input | Honest "I can't answer that yet" plus quick-action chips |

### Panel structure (top to bottom)

New components under `components/ai/`:

1. **Header** — `AiPanel.vue` root. Gradient AI avatar, "AI Assistant" label, collapse button.
2. **Context strip** — `AiContextStrip.vue`. One line showing the current page context ("Dashboard", "Space: Work", "Task: …").
3. **Suggestion cards** — `AiSuggestionCard.vue`. Collapsible list of proactive suggestions, each with accept/dismiss controls.
4. **Chat thread** — `AiMessage.vue`. AI messages in teal-tinted left-aligned bubbles, user messages in neutral right-aligned bubbles. Markdown rendering for structured responses.
5. **Quick actions** — `AiQuickActions.vue`. Context-dependent chips that trigger intents directly without text parsing.
6. **Input bar** — text input ("Ask anything…"), Enter to send, Shift+Enter for newline.

### Trigger and placement

- The AI button lives in `AppSidebar.vue`, below the nav items and above the user footer. It is a circular gradient element with a green presence dot when unread suggestions exist.
- The panel occupies 320px on the right of `AppLayout.vue`. The main content area shrinks to accommodate it — it does not overlay content. On mobile (`< lg`) it is a full-width overlay.
- Toggle shortcut: `Cmd+J` / `Ctrl+J`.
- Slide-in transition: 250ms ease-out.

### Context-aware behaviour

The `AssistantContext` updates as the user navigates. Quick actions and suggestions adapt:

- Dashboard — daily prioritisation and focus.
- Space view — suggestions scoped to that space's tasks.
- Task slide-over open — suggestions about that task (quadrant, effort).
- Briefing view — questions about the briefing.

### Relationship with existing AI features

- The suggested-quadrant banner in `TaskSlideOver.vue` stays and gains a "Discuss with AI" link that opens the panel with the `explain_suggestion` intent.
- The dashboard briefing banner stays as a summary surface.
- Nudges appear as suggestion cards in the panel, in addition to the existing bell-icon badge.

### State

A new Pinia store, `stores/assistant.store.js`: `panelOpen`, `messages[]`, `suggestions[]`, `context`, `loading`. Actions: `togglePanel`, `sendMessage`, `runQuickAction`, `dismissSuggestion`, `refreshSuggestions`. The store delegates all intelligence to the provider.

## Section 4 — Contextual Inline AI Suggestions

Suggestions appear inline where they are useful. All data comes from existing sources — task `suggestedQuadrant` fields, quadrant counts, and the briefing.

1. **Task rows** — a 6px teal-pink sparkle dot on tasks whose `suggestedQuadrant` differs from the current quadrant. Hover shows a tooltip ("AI suggests: Delegate"); click opens the panel with the reasoning. Component: `components/common/AiSparkle.vue`, reused in `TaskRow.vue` and `QuadrantCard.vue`.
2. **Task slide-over** — the existing quadrant banner stays; an inline effort hint is added below the effort input when the AI's estimate differs.
3. **Quadrant card headers** — when a quadrant is overloaded, a muted text hint appears next to the count badge.
4. **Empty states** — upgraded to be AI-aware, with a ghost button that opens the panel.
5. **Space header** — a sparkle chip next to the task count when a space-level insight exists.

### Adaptive proactiveness

Tied to the existing nudge-frequency setting:

- **Normal** — all inline suggestions visible.
- **Minimal** — only task-row sparkle dots.
- **Off** — no inline suggestions; the panel remains reachable but never proactive.

Dismissed suggestions fade out and do not reappear for that item until the AI generates a new one.

## Section 5 — Shell & Navigation

### Sidebar (`AppSidebar.vue`)

- Background becomes a vertical gradient (`#0d1526` to `#091018`).
- Active nav item: 3px teal left border, subtle teal background tint, text brightens to white, 150ms transition.
- Space list items: the colour dot gains a faint matching glow on hover; task counts use monospace.
- The AI button sits between the nav items and the space list, separated by dividers.
- User footer: avatar initial gains a subtle ring; the logout icon dims until hover.

### Header (`AppHeader.vue`)

- The bottom border becomes a subtle 1px teal-to-transparent gradient line.
- The bell icon does a single subtle wiggle when a new nudge arrives via the subscription (not on every render).
- The page title fades in over 150ms on navigation.

### Page transitions

Route changes use a slide-up plus fade (200ms ease-out) via a `<Transition>` wrapping `<router-view>` in `App.vue`.

### Mobile sidebar and FAB

- The mobile sidebar overlay gains `backdrop-blur-sm`.
- `QuickAddFab.vue` gains an ambient teal glow that intensifies on hover, and shifts left when the AI panel is open.

## Section 6 — Task Interactions

### Completion

- Checkbox click: the empty circle fills with the quadrant colour (150ms), then the existing bounce, then a radial ripple. The row fades to 50% opacity and slides out after a 1-second delay so an undo is possible.
- Completed text gets a left-to-right strikethrough reveal (200ms).

### Task slide-over

- Entry slides in from the right (250ms ease-out) over a dimmed backdrop.
- Input focus uses the standardised teal focus ring.
- Quadrant chips: the selected chip is filled (low-opacity quadrant colour) with a check icon; others use ghost styling; 150ms transition between states.
- Auto-save (already debounced 500ms) shows a brief "Saved" label near the top-right that fades after 1.5s. No toast for auto-save.

### Subtasks

- A new subtask row slides down 150ms from the add button.
- Completing a subtask fills the checkbox teal, animates the strikethrough, and flips the progress counter.

### Quick-add modal

- The backdrop gains `backdrop-blur-sm`.
- The space-selector dropdown shows colour dots.
- After creation, the new task briefly flashes a teal border (500ms) in its destination quadrant card.

## Component Inventory

### New files

- `src/components/ai/AiPanel.vue`
- `src/components/ai/AiContextStrip.vue`
- `src/components/ai/AiSuggestionCard.vue`
- `src/components/ai/AiMessage.vue`
- `src/components/ai/AiQuickActions.vue`
- `src/components/dashboard/StatsRow.vue`
- `src/components/dashboard/StatCard.vue`
- `src/components/common/ProgressRing.vue`
- `src/components/common/AiSparkle.vue`
- `src/stores/assistant.store.js`
- `src/assistant/index.js`
- `src/assistant/ruleBasedProvider.js`
- `src/assistant/intents.js`
- `src/assistant/context.js`
- `src/assistant/types.js`

### Modified files

- `tailwind.config.mjs`, `src/assets/main.css` — Section 1 tokens, animations, utilities.
- `src/App.vue` — route transition wrapper.
- `src/components/layout/AppLayout.vue` — AI panel column, content shrink behaviour.
- `src/components/layout/AppSidebar.vue` — gradient, active-item styling, AI button.
- `src/components/layout/AppHeader.vue` — gradient border, bell animation, title fade.
- `src/views/DashboardView.vue` — stats row placement.
- `src/components/dashboard/BriefingBanner.vue` — gradient, glow, AI avatar, CTA pill.
- `src/components/dashboard/QuadrantCard.vue` — accent bar, count badge, sparkle dots.
- `src/components/dashboard/EisenhowerMatrix.vue` — pass-through of new props if needed.
- `src/components/tasks/TaskRow.vue` — sparkle dot, completion animation.
- `src/components/tasks/TaskSlideOver.vue` — focus rings, chip styling, "Saved" label, "Discuss with AI" link.
- `src/components/tasks/SubtaskList.vue` — slide-down and counter animations.
- `src/components/tasks/QuickAddFab.vue` — glow, panel-aware shift.
- `src/components/spaces/SpaceCard.vue` — accent and hover polish.
- `src/views/SpaceView.vue` — sparkle chip in header, empty-state upgrade.
- `src/components/common/GlassCard.vue` — accent-bar support.

## Data Flow

No new API operations. The assistant and dashboard widgets reuse existing GraphQL operations:

- Briefing data (`GET_TODAY_BRIEFING`, `GENERATE_BRIEFING`) — focus order, overdue, quadrant shifts, streak, nudge message.
- `GET_EISENHOWER_MATRIX` — quadrant counts for badges.
- `GET_TASKS_DUE_TODAY` — completion-rate computation.
- Task `suggestedQuadrant` field — inline sparkle suggestions.
- Nudges operations — suggestion cards.

The rule-based provider reads from the existing Pinia stores (`tasks`, `briefings`, `nudges`, `spaces`) rather than issuing its own queries where the data is already loaded.

## Future Extension — Real LLM

The provider boundary is the upgrade path. When a real LLM is wanted:

1. Add an `aiChat` mutation (and conversation storage) to `all-you-plan-api`.
2. Add `src/assistant/llmProvider.js` implementing the same `AssistantProvider` interface, calling the new mutation.
3. Change the one line in `createAssistantProvider()` (optionally behind an env flag).

No panel, store, or component changes are required. The structured rule-based provider can remain as an offline fallback.

## Risks

- **Visual overload.** Combining depth and density risks clutter. Mitigation: the three-tier surface system keeps hierarchy clear; density is concentrated in the stats row, not spread everywhere.
- **AI feeling hollow.** A rule-based assistant must not pretend to be more than it is. Mitigation: the `fallback` intent answers honestly and steers the user to supported quick actions; quick actions are the primary interaction.
- **Layout pressure from the panel.** A 320px panel shrinks the matrix on smaller laptops. Mitigation: the panel is collapsible and remembers its state; on `< lg` it overlays instead of pushing.
