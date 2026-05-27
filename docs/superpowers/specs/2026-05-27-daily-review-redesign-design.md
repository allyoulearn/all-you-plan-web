# Daily Review Redesign — Wren-led Conversation

**Date:** 2026-05-27
**Status:** Spec — pending review
**Scope:** `all-you-plan-web` only. No backend changes.

## Problem

Today's `/review` view is a four-card form: mood pills, a read-only list of completed tasks, a read-only list of pending tasks, a static italic quote, and a Wren cross-app upsell at the bottom. It works but it doesn't earn a daily habit. Concretely:

1. **Too shallow / passive.** The backend already supports a `responses` JSON payload, and the mock fixture even shapes reflection Q&A ("What did you accomplish?", "What got in the way?", "What will you carry into tomorrow?"). The UI ignores all of it.
2. **No tomorrow planning.** Pending tasks are read-only. The user has to leave the review and reschedule them by hand elsewhere.
3. **No progress / streak / Wren insight.** The today query already returns `kpis.streak`, `todayDone`, and `todayTotal`. The review screen surfaces none of it. The send-off is a hardcoded quote.
4. **Wren is bolted on.** Wren shows up as a route eyebrow, a static italic quote, and a paid upsell card. Plan's whole product story is Wren — the review is the highest-intent reflective moment to make that real.

## Goal

Rebuild the review as a **Wren-led conversation**: each section is a Wren prompt followed by the user's answer, on one scrollable page. The redesign reuses existing data (today KPIs, completed/pending tasks, review responses JSON) and existing task mutations (`RescheduleTask`, `MoveUnfinishedToTomorrow`, `DeleteTask`) — no backend work.

## Non-goals

- LLM-generated Wren voice (template-only in v1)
- Week / month review aggregation screen
- Goal or habit reflection
- Sharing or export
- Time-of-day analytics
- Energy as a separate axis from mood (the mood scale covers it)
- Tomorrow-intent banner on TodayView (called out as a follow-up, not in v1)
- React Native (mobile) parity — web only

## Information architecture

Single scrollable page. Six sections, each structured as a **Wren-turn** (Wren's prompt) followed by an **answer-turn** (the user's response). No wizard gating — the user can scroll, edit, and return freely. The conversation rhythm is the structure.

Section order, top → bottom:

1. **Open + mood** — Wren greets, shows today's headline ("5 of 8 done · 3-day streak"), user picks mood
2. **Wins** — Wren asks what mattered; user stars 0–3 completed tasks and adds optional free text
3. **Friction** — Wren asks what got in the way; user writes + taps optional friction chips
4. **Leftovers** — Wren asks about pending tasks; each row has inline actions **Tomorrow / Pick day / Drop / Keep**
5. **Tomorrow intent** — Wren asks for the one thing; user writes a single short line
6. **Send-off** — Wren composes a dynamic close from today's data; one **Finish review** button

The streak and headline are folded into Wren's opening turn so they read as recognition, not gamification. The Wren cross-app upsell stays, but moves below the send-off and becomes visually quieter — the send-off is the closer, the upsell is an offer beneath.

## Visual pattern: WrenTurn

A single reusable component, `WrenTurn.vue`, drives every Wren prompt:

- Small Wren mark (16px) at the top-left
- Prompt text in serif italic ~18px (Plan's existing quote register)
- Optional mono-caps callout below the prompt for data ("5 of 8 done · 3-day streak")
- Accent-soft background, no heavy chrome

The **answer-turn** sits directly below the Wren-turn with no card chrome — just spaced content (input, pills, task rows). Visually the user answers into the space Wren opened.

## Section detail

### 1. Open + mood

- Wren-turn: greeting ("How did today feel?") + today headline callout: `{done} of {total} done · {streak}-day streak` (callout hidden when streak is 0 or total is 0).
- Answer-turn: 5 mood pills.
- **Mood scale renamed** to fix the existing "alight" typo and tighten the register: `heavy / low / steady / good / lit`. Persisted value is the lowercase label. Older saved reviews may carry the previous labels (`ok`, `alight`); the picker accepts any persisted value and selects the matching pill if present, otherwise leaves the selection empty (the user can re-pick on the new scale). No data migration.

### 2. Wins

- Wren-turn: "What mattered most?"
- Answer-turn:
  - List of completed task rows. Each row is tappable; tapping toggles a "star" (filled solid icon when starred). Hard cap of 3 stars — attempting a 4th unstars the oldest.
  - Below the rows, a single-line free-text field: "Anything off-list?" (max 280 chars).
- Empty state (no completed tasks): a muted line — "Some days nothing on the list moves. That's still a day." — followed by the free-text field only.

### 3. Friction

- Wren-turn: "What got in the way?"
- Answer-turn:
  - Auto-grow textarea (min 3 rows, max 10 rows). 1000-char soft cap with a subtle counter at 800+.
  - Chip row of quick-add tags: `meetings · energy · scope · surprise · context-switch`. Chips toggle on/off and are persisted as a string array. Tags supplement the text; they don't replace it.

### 4. Leftovers

- Wren-turn: "These didn't land — what do we do with them?"
- Answer-turn:
  - Bulk action link at the top: **Move all to tomorrow** — UI-only shortcut that flips every row's selection to Tomorrow. The user can still flip individual rows back. Mutations are always derived from per-row state at Finish; `MoveUnfinishedToTomorrow` is not used (it would move tasks the user explicitly chose Drop or Keep for).
  - One row per pending task with inline action chips:
    - **Tomorrow** (default selection) — schedule to tomorrow on Finish
    - **Pick day** — opens a small inline date picker
    - **Drop** — archives the task on Finish (`DeleteTask`)
    - **Keep** — leaves the task on today
  - Each row tracks the user's chosen action locally; mutations fire on **Finish review**, not on each click. This lets the user change their mind mid-review and means a failed Finish leaves task state untouched.
- Empty state (no pending tasks): a muted line — "Everything got done. Quiet flex." — and the section collapses to that single line.

### 5. Tomorrow intent

- Wren-turn: "If one thing happens tomorrow, what is it?"
- Answer-turn: single-line text input, 80-char soft cap with a subtle counter from 60+.
- Persisted into `responses.tomorrowIntent`. Surfacing this on TodayView is a follow-up (out of scope here).

### 6. Send-off

- Wren-turn only — no answer-turn. Closes the conversation.
- Dynamic prose composed client-side from today's data, branching on mood × completion-bucket × whether the user wrote a tomorrow intent. Examples:
  - Heavy / 0 done / has intent: *"Some days the day wins. You've named tomorrow's one thing — that's the work that matters right now. Sleep."*
  - Steady / partial done / has intent: *"Solid showing. {topWin} mattered. Tomorrow you said: {intent}. I'll put it at the top."*
  - Lit / all done / streak ≥ 3: *"Everything on the list. {streak} days running. Quietly building."*
- Followed by a single **Finish review** button.

## Wren voice generation

Pure client-side, templated. A small composer module returns a `{ headline, body }` pair given:

```js
composeSendoff({
  mood,                  // 'heavy' | 'low' | 'steady' | 'good' | 'lit'
  doneCount,
  totalCount,
  streak,
  topWinTitle,           // first starred completed task, optional
  tomorrowIntent,        // optional
  frictionTagCount,
})
```

Branch tree: ~15 outcome lines covering mood × completion-bucket (`none`, `partial`, `all`) × intent (`with`, `without`). Streak is mentioned only when ≥ 3 days. Lines live in `en.json` under `review.sendoff.*`; other locales fall back to `en` (the project already does this for new keys).

Not LLM. Cheap, predictable, localizable. An LLM hook is a Pro upgrade for later.

## Data shape

`responses` JSON, replacing the loose blob written by the current UI:

```js
{
  wins: {
    starred: ['<taskId>', ...],   // ordered by selection time, max 3
    freeText: ''
  },
  friction: {
    text: '',
    tags: ['meetings', 'energy', ...]
  },
  leftovers: {
    tomorrow: ['<taskId>', ...],  // tasks user chose "Tomorrow" for
    picked: [{ id: '<taskId>', date: '<ISO>' }, ...],
    dropped: ['<taskId>', ...],
    kept: ['<taskId>', ...]
  },
  tomorrowIntent: ''
}
```

The shape is descriptive (the user's recorded decisions), not authoritative — the side-effect mutations are the source of truth for task state. Storing the decisions inside `responses` lets the next visit to `/review` for the same date restore the UI exactly.

## Save flow

On **Finish review**:

1. Compose the `responses` payload from current section state.
2. Diff `responses.leftovers` against the previously-saved `leftovers` (loaded on mount). The diff gives the set of *new* decisions that need a mutation — re-Finishing a review without changing leftover actions does not re-fire mutations.
3. Call `SAVE_DAILY_REVIEW` with `{ date, mood, responses }`.
4. After save succeeds, dispatch the carry-forward mutations for the *diffed* set only:
   - `RescheduleTask` for each newly-added task in `leftovers.tomorrow` (date = tomorrow) and `leftovers.picked` (date = picked date).
   - `DeleteTask` for each newly-added task in `leftovers.dropped`.
   - No-op for `leftovers.kept` and for any tasks already in the previously-saved set.
5. Toast success.

If any carry-forward mutation fails, surface a single inline error ("Review saved, but {n} task(s) couldn't be moved.") and leave the review record intact. The review is the primary commit; task moves are best-effort follow-on.

## Streak

Already returned by `TODAY_QUERY` as `kpis.streak`. No new API.

## Reload semantics

On mount:

- Fetch today's `dailyReview` and today's `today` envelope in parallel (existing behavior).
- If the review exists, hydrate every section from `responses`:
  - mood pill → `review.mood`
  - starred wins → `responses.wins.starred`
  - wins free text → `responses.wins.freeText`
  - friction text + tags → `responses.friction`
  - leftover action per task → derived from `responses.leftovers`
  - tomorrow intent → `responses.tomorrowIntent`
- The send-off section becomes "Review saved" with a small inline "Edit" affordance that returns to editable state. The Save flow's diff against previously-saved `leftovers` means a second Finish without changing leftover actions does not re-fire any task mutations.

## Wren upsell

Keep `WrenCrossAppUpsell` and its dismissal logic. Move it below the send-off card. Tone down visual emphasis: same component, no variant change needed — placement does the work.

## Files touched

New components (under `src/components/review/`):

- `WrenTurn.vue` — the reusable Wren-prompt visual pattern
- `MoodPicker.vue` — 5-pill scale, new wording
- `WinPicker.vue` — completed task list with star toggles + free-text field
- `FrictionInput.vue` — auto-grow textarea + chip row
- `LeftoverRow.vue` — one row per pending task with action chips
- `TomorrowIntent.vue` — single-line input with counter
- `SendoffCard.vue` — Wren-turn that renders the composed prose + Finish button
- `sendoffComposer.js` — pure function: input data → `{ headline, body }`

Edited:

- `src/views/ReviewView.vue` — full rewrite, becomes a thin composer wiring the above
- `src/stores/review.store.js` — extend `save()` to accept the structured `responses` shape; add a helper to diff previously-saved `leftovers` for the duplicate-mutation guard
- `src/i18n/locales/en.json` — add `review.*` keys for prompts, chip labels, send-off lines, empty states, and labels for the new mood scale; remove unused `review.step*Label`, `review.sendoffQuote`, `review.noDoneTasks`, `review.noPendingTasks` keys
- `src/i18n/locales/{de,es,fr,pt-BR}.json` — placeholder en-equivalent strings or remove old keys; locales fall back to en for missing strings (existing pattern)
- `src/mocks/fixtures/review.js` — update the mock `responses` to the new shape

## Component boundaries

Each new component owns one concern:

- `WrenTurn` — visual prompt slot. Knows nothing about the section it's used in.
- `MoodPicker` — emits `update:modelValue` with the lowercase mood label.
- `WinPicker` — receives the completed-task list, emits `{ starred, freeText }`.
- `FrictionInput` — emits `{ text, tags }`.
- `LeftoverRow` — receives one task and the current action; emits the new action when chips are clicked.
- `TomorrowIntent` — emits `update:modelValue` with the trimmed string.
- `SendoffCard` — receives the composed prose + save state; emits `finish`.
- `sendoffComposer` — pure module; testable without rendering anything.

`ReviewView` composes them. It owns the canonical local state for the in-progress review, hydrates from the store on mount, and orchestrates the save flow on Finish.

## Testing

- **Unit specs** (focused, per component):
  - `WrenTurn` — renders prompt, optional callout, slot content.
  - `MoodPicker` — five pills, single-select, emits lowercase label, accessible radiogroup roles preserved from current view.
  - `WinPicker` — star toggle, 3-star cap behavior (4th unstars oldest), free-text field, empty state.
  - `FrictionInput` — textarea grows, chip toggle, char counter behavior.
  - `LeftoverRow` — chip selection, default is Tomorrow, Pick-day picker opens/closes.
  - `TomorrowIntent` — emits trimmed string, counter shows from 60+.
  - `SendoffCard` — renders composed prose, Finish button disabled when mood unset or saving.
- **Composer spec** (`sendoffComposer.spec.js`): table-driven over mood × completion-bucket × intent presence × streak threshold. Asserts the right template branch fires.
- **View spec** (`ReviewView.spec.js`): rewritten — sections render in order; save calls `SAVE_DAILY_REVIEW` with the structured payload; on save success the carry-forward mutations fire with the correct ids; reload hydrates each section from the persisted shape; the duplicate-mutation guard prevents a second Finish from re-moving tasks.
- **Coverage**: maintain the project's existing ≥90% threshold on the review surface.

## Open questions

None blocking. One small choice to flag: the new mood label for the top step. Spec proposes `lit` (matches the "warming up" arc of the scale). Alternatives: keep the original `alight` if intended, or `bright`. This can be decided at implementation time without changing structure.

## Follow-ups (out of v1)

- Surface `responses.tomorrowIntent` as a banner on the next day's TodayView ("Today's one thing: …")
- LLM-personalized Wren send-off as a Pro feature
- Week and month review aggregation screen
- React Native mobile parity (separate spec)
