# All You Plan — Sub-project 7: Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox (`- [ ]`) steps.

**Goal:** Build the Settings screen on web and mobile — editing the user's settings, persisting them to the API, and driving the live theme.

**Architecture:** The Settings screen reads `authStore.user.settings`, renders setting rows using the Foundation `SegmentedControl` primitive, and on change persists via the `updateProfile` mutation. The Look settings (theme, light/dark) additionally drive the Foundation theme controller live.

**API contract:** `updateProfile(name, timezone, settings: UpdateSettingsInput)` → `User` (built — `2026-05-21-sp2-api.md` Task 2). `User.settings` = `{ theme, mode, density, coachPersonality, checkIns, stalledNudgeDays, journalVisibility }`.

**Design reference:** the Claude Design bundle — desktop `screens.jsx` Settings (three groups: Coach / Look / Privacy, each a list of rows with a label + a segmented control) and mobile `mobile.jsx` `MSettingsScreen`.

**Scope note — density:** the design's Settings has a compact/normal/cozy density control, but the Foundation built components with fixed spacing (no density token), so a density control would have no visible effect. It is **omitted** from this Settings screen (the `density` field stays in the API model, unused). Making the design system density-aware is a separate future effort.

Settings covered: **Coach** — Wren's personality (gentle/direct/reflective), Proactive check-ins (morning/midday/evening/stuck — multi-select), Stalled-project nudges (4/7/10 days / never). **Look** — Theme (warm/ink/blueprint/rose), Light/dark (light/dark). **Privacy** — Journal visibility (private/themed/open).

UI-only. Both apps' `settings` route is a Foundation placeholder. Work on `main`, one commit per task.

---

## Part A — Web (`all-you-plan-web`)

### Task A1: `updateSettings` store action
**Files:** Modify `src/stores/auth.store.js`.
- [ ] Add an `updateSettings(partial)` action to the auth store: it calls the `UPDATE_PROFILE` mutation with `{ settings: { ...current settings, ...partial } }`, and on success updates the store's `user.settings`. (The `UPDATE_PROFILE` operation already exists in `src/api/operations/auth.js` and accepts a `settings` input.)
- [ ] Verify `npm run build`; commit `feat: updateSettings auth-store action`.

### Task A2: Settings screen
**Files:** Overwrite `src/views/SettingsView.vue`; create `src/components/settings/SettingRow.vue`.
- [ ] `SettingRow.vue` — props `{ label, description }`, a default slot for the control. A grid row (`240px 1fr auto`): label + muted description on the left, the control slotted on the right.
- [ ] `SettingsView.vue` — `ScreenHeading` ("Tune the", "experience."). Read `authStore.user.settings`. Three `SectionHeader` groups, each a `bg-paper-2` rounded list of `SettingRow`s:
  - **Coach:** "Wren's personality" → `SegmentedControl` (gentle/direct/reflective); "Proactive check-ins" → a row of four toggle `Button`s (morning/midday/evening/stuck) reflecting membership in `checkIns`; "Stalled-project nudges" → `SegmentedControl` (4/7/10/Never — "Never" maps to `null`).
  - **Look:** "Theme" → `SegmentedControl` (Warm/Ink/Blueprint/Rose); "Appearance" → `SegmentedControl` (Light/Dark).
  - **Privacy:** "Journal visibility" → `SegmentedControl` (Private/Themed/Open).
  - Every control change calls `authStore.updateSettings({ <field>: value })`. The **Theme** and **Appearance** changes additionally call `useTheme().setTheme(value)` / `setMode(value)` so the change is immediate and locally persisted.
- [ ] Verify `npm run build`; commit `feat: live Settings screen`.

### Task A3: Web verification
- [ ] `npm run test:unit` (pass) + `npm run build` (clean). Fix any failure, commit with `fix:`.

---

## Part B — Mobile (`all-you-plan-mobile`)

### Task B1: `updateSettings` action
**Files:** Modify `src/stores/auth.store.ts`.
- [ ] Add an `updateSettings(partial)` action mirroring web A1 — calls `UPDATE_PROFILE` with the merged `settings`, updates the store's `user.settings` on success.
- [ ] Verify `npx tsc --noEmit`; commit `feat: updateSettings auth-store action`.

### Task B2: Settings screen
**Files:** Overwrite `app/(tabs)/settings.tsx`; create `src/components/settings/SettingRow.tsx`.
- [ ] `SettingRow.tsx` — props `{ label; description?; children }` (`useTheme()` + `StyleSheet`): a label + muted description, with `children` (the control) below or right-aligned.
- [ ] `settings.tsx` — a `paper` `ScrollView` (safe-area top): a back row (chevron-left `IconButton` → `router.back()`); `ScreenHeading` ("Tune the" / "experience."); the same three groups as web A2 — Coach / Look / Privacy — built from `SettingRow` + `SegmentedControl` + toggle `Button`s, reading `useAuthStore().user.settings`. Each change calls `useAuthStore().updateSettings(...)`; the Theme/Appearance changes additionally call the mobile theme hook (`useTheme().setTheme` / `setMode`) so the app re-themes immediately. 100-unit bottom spacer.
- [ ] Verify `npx tsc --noEmit`; commit `feat: live Settings screen`.

### Task B3: Mobile verification
- [ ] `npx tsc --noEmit` (clean) + `npm test` (palette suite passes). Fix any failure, commit with `fix:`.

---

## Notes
- The theme controllers (`useTheme` on web, the theme hook/store on mobile) already persist locally and apply live; `updateSettings` additionally persists the choice server-side, so the setting survives across devices once the user is logged in.
- If `authStore.user` is null (not logged in) the route is unreachable behind the auth guard — no null-handling beyond a simple guard is needed.
- This is the final sub-project of the "all you plan" warm redesign program (sub-project 7 of 7).
