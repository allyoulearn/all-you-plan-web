# All You Plan Mobile — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `all-you-plan-mobile` boot into the new warm editorial design system — tokens, 4-theme theming, shared primitives, the tabbed shell with the Wren FAB and sheet, scaffolded routes — with the old Eisenhower UI removed.

**Architecture:** Eight precomputed palette objects are resolved by a `useTheme()` hook backed by the Zustand user store; primitives and shell are styled with `useTheme()` + `StyleSheet`. Expo Router drives a 5-tab shell plus detail screens reached from a "More" hub. Every route renders a themed placeholder pending its feature sub-project.

**Tech Stack:** Expo SDK 54, React Native 0.79, React 19, expo-router 6, Zustand, react-native-heroicons, @expo-google-fonts, Jest, TypeScript.

**Spec:** `all-you-plan-web/docs/superpowers/specs/2026-05-21-foundation-design-system-design.md` (sub-project 1 of 7).

**This plan targets the `all-you-plan-mobile` repo.** The document lives in the `all-you-plan-web` docs tree alongside the spec and the web plan (the program's single docs home); every file path below is relative to the `all-you-plan-mobile` repo root.

**Before you start:** Do this work in a dedicated git branch or worktree of `all-you-plan-mobile` (see superpowers:using-git-worktrees). Per the family `CLAUDE.md` "batch commits" rule, never commit a partial or broken state — each task ends with a complete, verified, committable increment.

**Notes on conventions:** The app is TypeScript. The import alias `@/` maps to `src/` (per `tsconfig.json`). Verification uses `npx tsc --noEmit` (typecheck) and `npm test` (Jest). Commit messages follow Conventional Commits, matching the repo history.

**Transient errors:** Tasks 3–18 rework the design system while the old Eisenhower screens are still present. Those old screens reference the reworked user store and will report TypeScript errors until Task 19 removes them. When a task says "verify the typecheck passes," it means no errors in the files that task created or modified — pre-existing errors in the old screens are expected until Task 19.

---

### Task 1: Install dependencies & fonts

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm/expo)

- [ ] **Step 1: Install the SVG native dependency**

Run from the `all-you-plan-mobile` directory (`expo install` picks the SDK-compatible version):

```bash
npx expo install react-native-svg
```

- [ ] **Step 2: Install icons and fonts**

```bash
npm install react-native-heroicons @expo-google-fonts/instrument-sans @expo-google-fonts/instrument-serif @expo-google-fonts/jetbrains-mono
```

- [ ] **Step 3: Verify**

Run: `npm ls react-native-heroicons react-native-svg @expo-google-fonts/instrument-sans`
Expected: each resolves to an installed version with no `UNMET DEPENDENCY`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add design-system dependencies (heroicons, svg, fonts)"
```

---

### Task 2: Theme palettes & scales

**Files:**
- Create: `src/theme/palettes.ts`, `src/theme/scales.ts`, `src/theme/palettes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/theme/palettes.test.ts`:

```ts
import { resolvePalette, THEME_NAMES } from './palettes'

describe('resolvePalette', () => {
  it('returns the warm light palette', () => {
    expect(resolvePalette('warm', 'light').paper).toBe('#f7f3ea')
  })

  it('returns the warm dark palette', () => {
    expect(resolvePalette('warm', 'dark').paper).toBe('#15130e')
  })

  it('returns the rose dark accent', () => {
    expect(resolvePalette('rose', 'dark').accent).toBe('#ff7a96')
  })

  it('falls back to warm light for an unknown theme', () => {
    // @ts-expect-error testing the runtime fallback
    expect(resolvePalette('bogus', 'light').paper).toBe('#f7f3ea')
  })

  it('exposes the four theme names', () => {
    expect(THEME_NAMES).toEqual(['warm', 'ink', 'blueprint', 'rose'])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- palettes`
Expected: FAIL — cannot find module `./palettes`.

- [ ] **Step 3: Create `src/theme/palettes.ts`**

```ts
export type ThemeName = 'warm' | 'ink' | 'blueprint' | 'rose'
export type Mode = 'light' | 'dark'

export interface Palette {
  paper: string
  paper2: string
  paper3: string
  ink: string
  ink2: string
  muted: string
  rule: string
  ruleSoft: string
  accent: string
  accentInk: string
  ok: string
  warn: string
  bad: string
}

const status = { ok: '#2f7a3f', warn: '#c3a200', bad: '#b7351a' }

export const palettes: Record<ThemeName, Record<Mode, Palette>> = {
  warm: {
    light: { paper: '#f7f3ea', paper2: '#ffffff', paper3: '#efe9d8', ink: '#1a1814', ink2: '#38332a', muted: '#756f63', rule: '#1a1814', ruleSoft: '#e6dfca', accent: '#ff5a1f', accentInk: '#ffffff', ...status },
    dark: { paper: '#15130e', paper2: '#1f1c15', paper3: '#2a2519', ink: '#f3efe3', ink2: '#c9c4b5', muted: '#8a857a', rule: '#efe9d7', ruleSoft: '#2e2a22', accent: '#ff6a2c', accentInk: '#ffffff', ...status },
  },
  ink: {
    light: { paper: '#f2efe6', paper2: '#fbfaf4', paper3: '#e6e0cd', ink: '#131311', ink2: '#2a2825', muted: '#6e6a60', rule: '#131311', ruleSoft: '#ddd5bf', accent: '#1c6a35', accentInk: '#ffffff', ...status },
    dark: { paper: '#0f100e', paper2: '#181a16', paper3: '#232520', ink: '#ecebe3', ink2: '#2a2825', muted: '#8a8a80', rule: '#ecebe3', ruleSoft: '#262822', accent: '#5fbf75', accentInk: '#ffffff', ...status },
  },
  blueprint: {
    light: { paper: '#eef2f8', paper2: '#ffffff', paper3: '#dde4ee', ink: '#0c1a2e', ink2: '#2a2825', muted: '#5b6779', rule: '#0c1a2e', ruleSoft: '#ccd5e2', accent: '#2563eb', accentInk: '#ffffff', ...status },
    dark: { paper: '#0b1220', paper2: '#131c2c', paper3: '#1c2638', ink: '#e9edf5', ink2: '#2a2825', muted: '#7e8aa0', rule: '#e9edf5', ruleSoft: '#1f2840', accent: '#7da4ff', accentInk: '#ffffff', ...status },
  },
  rose: {
    light: { paper: '#f6efe8', paper2: '#fdf9f4', paper3: '#ead9cb', ink: '#1a1010', ink2: '#2a2825', muted: '#80695f', rule: '#1a1010', ruleSoft: '#e7d3c4', accent: '#d63b65', accentInk: '#ffffff', ...status },
    dark: { paper: '#150f0f', paper2: '#1e1614', paper3: '#2a1f1c', ink: '#f1e8e4', ink2: '#2a2825', muted: '#8c7c77', rule: '#f1e8e4', ruleSoft: '#2c211e', accent: '#ff7a96', accentInk: '#ffffff', ...status },
  },
}

export const THEME_NAMES: ThemeName[] = ['warm', 'ink', 'blueprint', 'rose']

export function resolvePalette(name: ThemeName, mode: Mode): Palette {
  return (palettes[name] ?? palettes.warm)[mode] ?? palettes.warm.light
}
```

- [ ] **Step 4: Create `src/theme/scales.ts`**

```ts
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const

export const radii = { sm: 10, md: 16, lg: 22, pill: 999 } as const

export const fontSizes = {
  display: 38,
  title: 30,
  numeral: 26,
  heading: 21,
  body: 14,
  label: 12.5,
  caption: 11.5,
  micro: 11,
} as const

export const fonts = {
  sans: 'InstrumentSans_400Regular',
  sansMedium: 'InstrumentSans_500Medium',
  sansSemibold: 'InstrumentSans_600SemiBold',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- palettes`
Expected: PASS — 5 tests passed. (If Jest does not discover the file, confirm `jest.config.js` does not restrict `roots`/`testMatch` away from `src/`; the React Native preset's default `testMatch` includes `**/?(*.)+(spec|test).[jt]s?(x)`.)

- [ ] **Step 6: Commit**

```bash
git add src/theme/palettes.ts src/theme/scales.ts src/theme/palettes.test.ts
git commit -m "feat: 8-palette theme tokens and scales"
```

---

### Task 3: User store & `useTheme` hook

**Files:**
- Modify (overwrite): `src/stores/user.store.ts`
- Create: `src/theme/useTheme.ts`

- [ ] **Step 1: Replace `src/stores/user.store.ts`**

This replaces the old `darkMode` preference with `themeName` + `mode`:

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ThemeName, Mode } from '@/theme/palettes'

interface UserState {
  themeName: ThemeName
  mode: Mode
  locale: string
  setTheme: (name: ThemeName) => void
  setMode: (mode: Mode) => void
  toggleMode: () => void
  setLocale: (locale: string) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      themeName: 'warm',
      mode: 'light',
      locale: 'en',
      setTheme: (name) => set({ themeName: name }),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'ayp-user-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
```

- [ ] **Step 2: Create `src/theme/useTheme.ts`**

```ts
import { useUserStore } from '@/stores/user.store'
import { resolvePalette, THEME_NAMES } from './palettes'
import { spacing, radii, fontSizes, fonts } from './scales'

export function useTheme() {
  const themeName = useUserStore((s) => s.themeName)
  const mode = useUserStore((s) => s.mode)
  const setTheme = useUserStore((s) => s.setTheme)
  const setMode = useUserStore((s) => s.setMode)
  const toggleMode = useUserStore((s) => s.toggleMode)

  return {
    palette: resolvePalette(themeName, mode),
    themeName,
    mode,
    themeNames: THEME_NAMES,
    setTheme,
    setMode,
    toggleMode,
    spacing,
    radii,
    fontSizes,
    fonts,
  }
}
```

- [ ] **Step 3: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors from `src/theme/` or `src/stores/user.store.ts`. (Errors may still appear from old screens that import the removed `darkMode` field — those screens are deleted in Task 19; if `tsc` reports only such errors, that is expected at this stage. Note them and continue.)

- [ ] **Step 4: Commit**

```bash
git add src/stores/user.store.ts src/theme/useTheme.ts
git commit -m "feat: theme state in the user store and useTheme hook"
```

---

### Task 4: Wire fonts & theme into the root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add the font imports**

In `app/_layout.tsx`, add these imports near the top:

```tsx
import { useFonts, InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans'
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif'
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono'
import { useTheme } from '@/theme/useTheme'
```

- [ ] **Step 2: Load the fonts**

If `_layout.tsx` already calls `useFonts(...)`, replace its argument with the object below; otherwise add the call inside the root component and gate rendering on `fontsLoaded` (return `null` until loaded, keeping any existing splash-screen handling):

```tsx
const [fontsLoaded] = useFonts({
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
})
```

- [ ] **Step 3: Drive the status bar from the theme mode**

Replace the existing `StatusBar` usage with a mode-driven one. Inside the component that has access to the theme:

```tsx
const { mode, palette } = useTheme()
// ...in JSX:
<StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={palette.paper} />
```

Keep the existing `ApolloProvider`, `SafeAreaProvider`, the auth session-restore call (`tryRestoreSession`), and the `Stack` with the `(auth)` and `(tabs)` groups exactly as they are.

- [ ] **Step 4: Verify**

Run: `npx expo start` and open the app in a simulator or Expo Go.
Expected: the app launches with no font or import errors (screens are still the old ones until later tasks; that is fine). Stop the server.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: load editorial fonts and theme-driven status bar"
```

---

### Task 5: `Icon` primitive

**Files:**
- Create: `src/components/ui/iconMap.ts`, `src/components/ui/Icon.tsx`

- [ ] **Step 1: Create `src/components/ui/iconMap.ts`**

```ts
export const ICON_NAMES: Record<string, string> = {
  today: 'HomeIcon',
  chores: 'ArrowPathIcon',
  projects: 'Squares2X2Icon',
  wren: 'SparklesIcon',
  more: 'EllipsisHorizontalIcon',
  calendar: 'CalendarIcon',
  stats: 'ChartBarIcon',
  journal: 'BookOpenIcon',
  inbox: 'InboxIcon',
  chat: 'ChatBubbleLeftRightIcon',
  review: 'ClipboardDocumentCheckIcon',
  settings: 'Cog6ToothIcon',
  search: 'MagnifyingGlassIcon',
  plus: 'PlusIcon',
  check: 'CheckIcon',
  'chevron-left': 'ChevronLeftIcon',
  'chevron-right': 'ChevronRightIcon',
  'chevron-down': 'ChevronDownIcon',
  moon: 'MoonIcon',
  sun: 'SunIcon',
  flag: 'FlagIcon',
  mic: 'MicrophoneIcon',
  bolt: 'BoltIcon',
  'arrow-right': 'ArrowRightIcon',
  filter: 'FunnelIcon',
}
```

- [ ] **Step 2: Create `src/components/ui/Icon.tsx`**

```tsx
import React from 'react'
import * as Outline from 'react-native-heroicons/outline'
import * as Solid from 'react-native-heroicons/solid'
import { useTheme } from '@/theme/useTheme'
import { ICON_NAMES } from './iconMap'

interface IconProps {
  name: string
  size?: number
  color?: string
  solid?: boolean
}

type SvgIcon = React.ComponentType<{ size?: number; color?: string }>

export function Icon({ name, size = 22, color, solid = false }: IconProps) {
  const { palette } = useTheme()
  const set = solid ? Solid : Outline
  const Cmp = (set as Record<string, SvgIcon>)[ICON_NAMES[name]]
  if (!Cmp) return null
  return <Cmp size={size} color={color ?? palette.ink} />
}
```

- [ ] **Step 3: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors from `src/components/ui/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/iconMap.ts src/components/ui/Icon.tsx
git commit -m "feat: Icon primitive over react-native-heroicons"
```

---

### Task 6: `Button` & `IconButton` primitives

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/IconButton.tsx`

- [ ] **Step 1: Create `src/components/ui/Button.tsx`**

```tsx
import React from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import { Icon } from './Icon'
import { useTheme } from '@/theme/useTheme'

type Variant = 'default' | 'primary' | 'accent' | 'ghost'

interface ButtonProps {
  label: string
  onPress?: () => void
  variant?: Variant
  icon?: string
  disabled?: boolean
}

export function Button({ label, onPress, variant = 'default', icon, disabled }: ButtonProps) {
  const { palette, fonts } = useTheme()

  const bg: Record<Variant, string> = {
    default: palette.paper2,
    primary: palette.ink,
    accent: palette.accent,
    ghost: 'transparent',
  }
  const fg: Record<Variant, string> = {
    default: palette.ink,
    primary: palette.paper,
    accent: palette.accentInk,
    ghost: palette.ink,
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        {
          backgroundColor: bg[variant],
          borderColor: variant === 'default' ? palette.ruleSoft : bg[variant],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={fg[variant]} /> : null}
      <Text style={[styles.label, { color: fg[variant], fontFamily: fonts.sansMedium }]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: { fontSize: 13 },
})
```

- [ ] **Step 2: Create `src/components/ui/IconButton.tsx`**

```tsx
import React from 'react'
import { Pressable } from 'react-native'
import { Icon } from './Icon'
import { useTheme } from '@/theme/useTheme'

interface IconButtonProps {
  icon: string
  onPress?: () => void
  size?: number
  variant?: 'default' | 'ghost'
  disabled?: boolean
}

export function IconButton({ icon, onPress, size = 38, variant = 'default', disabled }: IconButtonProps) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: variant === 'ghost' ? 'transparent' : palette.paper3,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.47)} color={palette.ink2} />
    </Pressable>
  )
}
```

- [ ] **Step 3: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/IconButton.tsx
git commit -m "feat: Button and IconButton primitives"
```

---

### Task 7: `Card` & `Pill` primitives

**Files:**
- Create: `src/components/ui/Card.tsx`, `src/components/ui/Pill.tsx`

- [ ] **Step 1: Create `src/components/ui/Card.tsx`**

```tsx
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { useTheme } from '@/theme/useTheme'

interface CardProps {
  variant?: 'default' | 'accent'
  style?: ViewStyle
  children: React.ReactNode
}

export function Card({ variant = 'default', style, children }: CardProps) {
  const { palette } = useTheme()
  const accent = variant === 'accent'
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? palette.accent : palette.paper2,
          shadowColor: accent ? palette.accent : '#14120c',
          shadowOpacity: accent ? 0.3 : 0.06,
          shadowRadius: accent ? 24 : 8,
          shadowOffset: { width: 0, height: accent ? 6 : 2 },
          elevation: accent ? 6 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, gap: 10 },
})
```

- [ ] **Step 2: Create `src/components/ui/Pill.tsx`**

```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/theme/useTheme'

type Variant = 'default' | 'accent' | 'soft' | 'dot'

interface PillProps {
  label: string
  variant?: Variant
}

export function Pill({ label, variant = 'default' }: PillProps) {
  const { palette, fonts } = useTheme()

  const bg = variant === 'accent' ? palette.accent : 'transparent'
  const filled = variant === 'default' || variant === 'dot'
  const fg = variant === 'accent' ? palette.accentInk : variant === 'soft' ? palette.muted : palette.ink2

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: filled ? palette.paper3 : bg,
          borderWidth: variant === 'soft' ? 1 : 0,
          borderColor: palette.ruleSoft,
        },
      ]}
    >
      {variant === 'dot' ? (
        <View style={[styles.dot, { backgroundColor: palette.accent }]} />
      ) : null}
      <Text style={{ color: fg, fontSize: 11, fontFamily: fonts.sansMedium }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 999 },
})
```

- [ ] **Step 3: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Card.tsx src/components/ui/Pill.tsx
git commit -m "feat: Card and Pill primitives"
```

---

### Task 8: `ProgressBar` & `Checkbox` primitives

**Files:**
- Create: `src/components/ui/ProgressBar.tsx`, `src/components/ui/Checkbox.tsx`

- [ ] **Step 1: Create `src/components/ui/ProgressBar.tsx`**

```tsx
import React from 'react'
import { View } from 'react-native'
import { useTheme } from '@/theme/useTheme'

interface ProgressBarProps {
  value: number
  thin?: boolean
}

export function ProgressBar({ value, thin = false }: ProgressBarProps) {
  const { palette } = useTheme()
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <View
      style={{
        height: thin ? 4 : 6,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: thin ? palette.ruleSoft : palette.paper3,
      }}
    >
      <View style={{ height: '100%', width: `${pct}%`, borderRadius: 999, backgroundColor: palette.accent }} />
    </View>
  )
}
```

- [ ] **Step 2: Create `src/components/ui/Checkbox.tsx`**

```tsx
import React from 'react'
import { Pressable } from 'react-native'
import { Icon } from './Icon'
import { useTheme } from '@/theme/useTheme'

interface CheckboxProps {
  checked: boolean
  onChange?: (next: boolean) => void
  size?: number
  disabled?: boolean
}

export function Checkbox({ checked, onChange, size = 22, disabled }: CheckboxProps) {
  const { palette } = useTheme()
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: checked ? palette.accent : palette.paper2,
        borderColor: checked ? palette.accent : palette.ruleSoft,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {checked ? <Icon name="check" size={Math.round(size * 0.6)} color={palette.accentInk} /> : null}
    </Pressable>
  )
}
```

- [ ] **Step 3: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ProgressBar.tsx src/components/ui/Checkbox.tsx
git commit -m "feat: ProgressBar and Checkbox primitives"
```

---

### Task 9: `TextField` primitive

**Files:**
- Create: `src/components/ui/TextField.tsx`

- [ ] **Step 1: Create `src/components/ui/TextField.tsx`**

```tsx
import React from 'react'
import { View, Text, TextInput, StyleSheet, type KeyboardTypeOptions } from 'react-native'
import { Icon } from './Icon'
import { useTheme } from '@/theme/useTheme'

interface TextFieldProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  icon?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  invalid?: boolean
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  label,
  icon,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  invalid,
}: TextFieldProps) {
  const { palette, fonts } = useTheme()
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ color: palette.muted, fontSize: 12, fontFamily: fonts.sansMedium }}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: palette.paper2, borderColor: invalid ? palette.bad : palette.ruleSoft },
        ]}
      >
        {icon ? <Icon name={icon} size={16} color={palette.muted} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{ flex: 1, color: palette.ink, fontSize: 14, fontFamily: fonts.sans, padding: 0 }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
})
```

- [ ] **Step 2: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TextField.tsx
git commit -m "feat: TextField primitive"
```

---

### Task 10: `SegmentedControl` primitive

**Files:**
- Create: `src/components/ui/SegmentedControl.tsx`

- [ ] **Step 1: Create `src/components/ui/SegmentedControl.tsx`**

```tsx
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '@/theme/useTheme'

export interface SegmentOption {
  value: string
  label: string
  count?: number
}

interface SegmentedControlProps {
  value: string
  options: SegmentOption[]
  onChange: (value: string) => void
}

export function SegmentedControl({ value, options, onChange }: SegmentedControlProps) {
  const { palette, fonts } = useTheme()
  return (
    <View style={[styles.track, { backgroundColor: palette.paper3 }]}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.item, active && { backgroundColor: palette.paper2 }]}
          >
            <Text
              style={{
                color: active ? palette.ink : palette.muted,
                fontSize: 12.5,
                fontFamily: fonts.sansMedium,
              }}
            >
              {opt.label}
            </Text>
            {opt.count != null ? (
              <Text style={{ color: palette.muted, fontSize: 11, fontFamily: fonts.mono }}>
                {opt.count}
              </Text>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 2, borderRadius: 12, padding: 3, alignSelf: 'flex-start' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
})
```

- [ ] **Step 2: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/SegmentedControl.tsx
git commit -m "feat: SegmentedControl primitive"
```

---

### Task 11: `ScreenHeading` & `SectionHeader` primitives

**Files:**
- Create: `src/components/ui/ScreenHeading.tsx`, `src/components/ui/SectionHeader.tsx`

- [ ] **Step 1: Create `src/components/ui/ScreenHeading.tsx`**

```tsx
import React from 'react'
import { View, Text } from 'react-native'
import { useTheme } from '@/theme/useTheme'

interface ScreenHeadingProps {
  eyebrow?: string
  title: string
  emphasis?: string
  big?: boolean
}

export function ScreenHeading({ eyebrow, title, emphasis, big = true }: ScreenHeadingProps) {
  const { palette, fonts } = useTheme()
  return (
    <View style={{ gap: 6, marginBottom: 8 }}>
      {eyebrow ? (
        <Text style={{ color: palette.muted, fontSize: 12.5, fontFamily: fonts.sans }}>{eyebrow}</Text>
      ) : null}
      <Text
        style={{
          color: palette.ink,
          fontSize: big ? 38 : 30,
          lineHeight: big ? 40 : 32,
          fontFamily: fonts.serif,
        }}
      >
        {title}
        {emphasis ? (
          <Text style={{ fontFamily: fonts.serifItalic }}> {emphasis}</Text>
        ) : null}
      </Text>
    </View>
  )
}
```

- [ ] **Step 2: Create `src/components/ui/SectionHeader.tsx`**

```tsx
import React from 'react'
import { View, Text } from 'react-native'
import { useTheme } from '@/theme/useTheme'

interface SectionHeaderProps {
  label: string
  count?: number
  action?: React.ReactNode
}

export function SectionHeader({ label, count, action }: SectionHeaderProps) {
  const { palette, fonts } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 24, marginBottom: 10 }}>
      <Text style={{ color: palette.ink, fontSize: 13, fontFamily: fonts.sansSemibold }}>{label}</Text>
      {count != null ? (
        <Text style={{ color: palette.muted, fontSize: 11, fontFamily: fonts.mono }}>{count}</Text>
      ) : null}
      <View style={{ flex: 1 }} />
      {action}
    </View>
  )
}
```

- [ ] **Step 3: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ScreenHeading.tsx src/components/ui/SectionHeader.tsx
git commit -m "feat: ScreenHeading and SectionHeader primitives"
```

---

### Task 12: `TabBar`

**Files:**
- Create: `src/components/shell/TabBar.tsx`

- [ ] **Step 1: Create `src/components/shell/TabBar.tsx`**

A custom bottom tab bar. It renders exactly the five tab destinations; any other route registered in the `(tabs)` group (the detail screens) is simply not given a button.

```tsx
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Icon } from '@/components/ui/Icon'
import { useTheme } from '@/theme/useTheme'

const TABS = [
  { name: 'index', label: 'Today', icon: 'today' },
  { name: 'chores', label: 'Chores', icon: 'chores' },
  { name: 'projects', label: 'Projects', icon: 'projects' },
  { name: 'wren', label: 'Wren', icon: 'wren' },
  { name: 'more', label: 'More', icon: 'more' },
]

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { palette, mode, fonts } = useTheme()
  const insets = useSafeAreaInsets()
  const activeName = state.routes[state.index]?.name

  return (
    <BlurView
      intensity={40}
      tint={mode === 'dark' ? 'dark' : 'light'}
      style={[styles.bar, { paddingBottom: insets.bottom + 8, borderTopColor: palette.ruleSoft }]}
    >
      {TABS.map((tab) => {
        const focused = activeName === tab.name
        const color = focused ? palette.accent : palette.muted
        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Icon name={tab.icon} size={tab.name === 'wren' ? 22 : 20} color={color} />
            <Text style={{ color, fontSize: 10.5, fontFamily: fonts.sansMedium }}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
})
```

- [ ] **Step 2: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors. (`@react-navigation/bottom-tabs` is a transitive dependency of `expo-router` and resolves without an extra install.)

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/TabBar.tsx
git commit -m "feat: custom bottom tab bar"
```

---

### Task 13: `WrenFab`

**Files:**
- Create: `src/components/shell/WrenFab.tsx`

- [ ] **Step 1: Create `src/components/shell/WrenFab.tsx`**

```tsx
import React from 'react'
import { Pressable, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/ui/Icon'
import { useTheme } from '@/theme/useTheme'

interface WrenFabProps {
  onPress: () => void
  bottomOffset: number
}

export function WrenFab({ onPress, bottomOffset }: WrenFabProps) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.fab,
        {
          bottom: bottomOffset,
          backgroundColor: palette.accent,
          shadowColor: palette.accent,
        },
      ]}
    >
      <Icon name="wren" size={24} color={palette.accentInk} solid />
      <View style={[styles.dot, { backgroundColor: palette.accent, borderColor: palette.paper }]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
  },
})
```

- [ ] **Step 2: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/WrenFab.tsx
git commit -m "feat: floating Wren button"
```

---

### Task 14: `WrenSheet`

**Files:**
- Create: `src/components/shell/WrenSheet.tsx`

- [ ] **Step 1: Create `src/components/shell/WrenSheet.tsx`**

The Wren bottom-sheet chrome. The conversation body is wired in sub-project 5.

```tsx
import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, View, Text, StyleSheet, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon } from '@/components/ui/Icon'
import { useTheme } from '@/theme/useTheme'

interface WrenSheetProps {
  visible: boolean
  onClose: () => void
}

const SHEET_HEIGHT = Dimensions.get('window').height * 0.8

export function WrenSheet({ visible, onClose }: WrenSheetProps) {
  const { palette, fonts } = useTheme()
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }, [visible, translateY])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            height: SHEET_HEIGHT,
            paddingBottom: insets.bottom,
            backgroundColor: palette.paper,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.grab, { backgroundColor: palette.ruleSoft }]} />
        <View style={[styles.head, { borderBottomColor: palette.ruleSoft }]}>
          <View style={[styles.badge, { backgroundColor: palette.accent }]}>
            <Text style={{ color: palette.accentInk, fontFamily: fonts.serifItalic, fontSize: 18 }}>W</Text>
          </View>
          <Text style={{ color: palette.ink, fontFamily: fonts.serifItalic, fontSize: 20 }}>Wren</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onClose}>
            <Icon name="chevron-down" size={22} color={palette.muted} />
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text style={{ color: palette.muted, fontSize: 13, fontFamily: fonts.sans }}>
            Wren wakes up in sub-project 5.
          </Text>
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
  },
  grab: { width: 40, height: 4, borderRadius: 999, alignSelf: 'center', marginTop: 10 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  badge: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
```

- [ ] **Step 2: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/WrenSheet.tsx
git commit -m "feat: Wren bottom-sheet chrome"
```

---

### Task 15: Tabs layout

**Files:**
- Modify (overwrite): `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Replace `app/(tabs)/_layout.tsx`**

This wires the custom `TabBar`, the `WrenFab`, and the `WrenSheet`. It declares the five tab screens plus the detail screens (the custom `TabBar` only renders buttons for the five tabs; detail screens stay navigable by path).

```tsx
import React, { useState } from 'react'
import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabBar } from '@/components/shell/TabBar'
import { WrenFab } from '@/components/shell/WrenFab'
import { WrenSheet } from '@/components/shell/WrenSheet'

export default function TabsLayout() {
  const [wrenOpen, setWrenOpen] = useState(false)
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="chores" />
        <Tabs.Screen name="projects" />
        <Tabs.Screen name="wren" />
        <Tabs.Screen name="more" />
        <Tabs.Screen name="project/[id]" options={{ href: null }} />
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="stats" options={{ href: null }} />
        <Tabs.Screen name="journal" options={{ href: null }} />
        <Tabs.Screen name="inbox" options={{ href: null }} />
        <Tabs.Screen name="review" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>

      <WrenFab onPress={() => setWrenOpen(true)} bottomOffset={insets.bottom + 78} />
      <WrenSheet visible={wrenOpen} onClose={() => setWrenOpen(false)} />
    </View>
  )
}
```

Note: the `WrenFab` is rendered for the whole tab group. Hiding it on the Wren tab specifically is a sub-project 5 refinement; for Foundation it is acceptable for it to show on every tab.

- [ ] **Step 2: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors from `_layout.tsx` itself. The screen files it lists via `<Tabs.Screen>` are filesystem routes (not imports), so `tsc` does not flag them; they are created in Task 16.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: tabbed shell with Wren FAB and sheet"
```

---

### Task 16: PlaceholderScreen & route screens

**Files:**
- Create: `src/components/PlaceholderScreen.tsx`
- Modify (overwrite): `app/(tabs)/index.tsx`, `app/(tabs)/settings.tsx`
- Create: `app/(tabs)/chores.tsx`, `app/(tabs)/projects.tsx`, `app/(tabs)/wren.tsx`, `app/(tabs)/more.tsx`, `app/(tabs)/calendar.tsx`, `app/(tabs)/stats.tsx`, `app/(tabs)/journal.tsx`, `app/(tabs)/inbox.tsx`, `app/(tabs)/review.tsx`, `app/(tabs)/project/[id].tsx`

- [ ] **Step 1: Create `src/components/PlaceholderScreen.tsx`**

```tsx
import React from 'react'
import { ScrollView, View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenHeading } from '@/components/ui/ScreenHeading'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/theme/useTheme'

interface PlaceholderScreenProps {
  eyebrow?: string
  title: string
  emphasis?: string
  note: string
}

export function PlaceholderScreen({ eyebrow, title, emphasis, note }: PlaceholderScreenProps) {
  const { palette, fonts } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 120 }}
      >
        <ScreenHeading eyebrow={eyebrow} title={title} emphasis={emphasis} />
        <Card>
          <Text style={{ color: palette.ink2, fontSize: 14, fontFamily: fonts.sans }}>{note}</Text>
        </Card>
      </ScrollView>
    </View>
  )
}
```

- [ ] **Step 2: Create the tab and detail screens**

Each file renders `PlaceholderScreen` with its own props.

`app/(tabs)/index.tsx` (overwrite):

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function TodayScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Thursday · May 21"
      title="A quiet"
      emphasis="full day."
      note="The Today timeline arrives in sub-project 2."
    />
  )
}
```

`app/(tabs)/chores.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function ChoresScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Habits"
      title="Small habits,"
      emphasis="kept."
      note="Chores arrive in sub-project 3."
    />
  )
}
```

`app/(tabs)/projects.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function ProjectsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Projects"
      title="Six things"
      emphasis="you're becoming."
      note="Projects arrive in sub-project 4."
    />
  )
}
```

`app/(tabs)/wren.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function WrenScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Wren · always here"
      title="Hi,"
      emphasis="Mara."
      note="Chat with Wren arrives in sub-project 5."
    />
  )
}
```

`app/(tabs)/more.tsx` (a placeholder for now — Task 17 overwrites it with the real hub):

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function MoreScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Looking back · system"
      title="Everything"
      emphasis="else."
      note="The More hub is built in the next task."
    />
  )
}
```

`app/(tabs)/calendar.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function CalendarScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Calendar"
      title="May"
      emphasis="2026."
      note="The calendar arrives in sub-project 6."
    />
  )
}
```

`app/(tabs)/stats.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function StatsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Stats"
      title="Six months of"
      emphasis="showing up."
      note="Stats arrive in sub-project 6."
    />
  )
}
```

`app/(tabs)/journal.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function JournalScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Journal · private"
      title="Notes to"
      emphasis="yourself."
      note="The journal arrives in sub-project 6."
    />
  )
}
```

`app/(tabs)/inbox.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function InboxScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Inbox · quick capture"
      title="Triage,"
      emphasis="don't think."
      note="The inbox arrives in sub-project 6."
    />
  )
}
```

`app/(tabs)/review.tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function ReviewScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Daily review"
      title="How did"
      emphasis="today feel?"
      note="The daily review arrives in sub-project 5."
    />
  )
}
```

`app/(tabs)/settings.tsx` (overwrite):

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Settings"
      title="Tune the"
      emphasis="experience."
      note="Settings arrive in sub-project 7."
    />
  )
}
```

`app/(tabs)/project/[id].tsx`:

```tsx
import React from 'react'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'

export default function ProjectDetailScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Project · Writing"
      title="Project"
      emphasis="detail."
      note="Project detail arrives in sub-project 4."
    />
  )
}
```

- [ ] **Step 3: Verify the typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors from the new screen files. (Errors from old screens still present — `matrix.tsx`, `spaces.tsx`, `space/[id].tsx`, `task/[id].tsx` — are expected; they are removed in Task 19.)

- [ ] **Step 4: Commit**

```bash
git add src/components/PlaceholderScreen.tsx "app/(tabs)"
git commit -m "feat: placeholder screens for all routes"
```

---

### Task 17: More hub

**Files:**
- Modify (overwrite): `app/(tabs)/more.tsx` (created as a placeholder in Task 16 — overwrite it with the real hub)

- [ ] **Step 1: Create the More hub screen**

The More hub is a real (simple) screen — a list of rows linking to the six secondary destinations.

```tsx
import React from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenHeading } from '@/components/ui/ScreenHeading'
import { Icon } from '@/components/ui/Icon'
import { useTheme } from '@/theme/useTheme'

const ITEMS = [
  { route: '/calendar', icon: 'calendar', label: 'Calendar', sub: 'Month and agenda' },
  { route: '/stats', icon: 'stats', label: 'Stats', sub: 'Streaks and habits' },
  { route: '/journal', icon: 'journal', label: 'Journal', sub: 'Private notes' },
  { route: '/inbox', icon: 'inbox', label: 'Inbox', sub: 'Quick capture to triage' },
  { route: '/review', icon: 'review', label: 'Daily review', sub: 'Evening reflection' },
  { route: '/settings', icon: 'settings', label: 'Settings', sub: 'Theme, Wren, privacy' },
] as const

export default function MoreScreen() {
  const { palette, fonts } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 120 }}>
        <ScreenHeading eyebrow="Looking back · system" title="Everything" emphasis="else." />
        <View style={[styles.list, { backgroundColor: palette.paper2 }]}>
          {ITEMS.map((item, i) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route)}
              style={[
                styles.row,
                i > 0 && { borderTopWidth: 1, borderTopColor: palette.ruleSoft },
              ]}
            >
              <View style={[styles.tile, { backgroundColor: palette.paper3 }]}>
                <Icon name={item.icon} size={18} color={palette.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.ink, fontSize: 14.5, fontFamily: fonts.sansMedium }}>
                  {item.label}
                </Text>
                <Text style={{ color: palette.muted, fontSize: 12.5, fontFamily: fonts.sans }}>
                  {item.sub}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={palette.muted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  list: { borderRadius: 16, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  tile: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
})
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from `more.tsx`.

Then run `npx expo start`, open the app, and sign in. Confirm: the five tabs render, each tab loads its placeholder, the More tab lists the six destinations, tapping a More row opens that detail placeholder, and the Wren FAB opens the sliding sheet. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/more.tsx"
git commit -m "feat: More hub screen"
```

---

### Task 18: Auth retheme

**Files:**
- Modify: `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`, `app/(auth)/reset-password.tsx`

- [ ] **Step 1: Retheme `app/(auth)/_layout.tsx`**

Replace the hardcoded `#0d1a2d` background with the theme `paper` color. Use `useTheme()` for the `Stack` `contentStyle` / screen background; keep the `Stack` and its `animation: 'fade'` option.

- [ ] **Step 2: Retheme the four auth screens**

For each of `login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`:

1. Keep all logic — `react-hook-form` + Zod, store calls, the Google OAuth button, the success states, navigation — exactly as-is.
2. Replace the screen background and the form card with theme colors via `useTheme()` (`palette.paper` background, a `palette.paper2` card with `palette.ruleSoft` border, `borderRadius: 16`).
3. Replace raw `TextInput`s with the `TextField` primitive (`import { TextField } from '@/components/ui/TextField'`), bound to the same `react-hook-form` controllers.
4. Replace the primary submit button with `<Button variant="accent" label="..." onPress={...} />` and secondary actions with `<Button variant="ghost" .../>` or themed `Pressable` + `Text` links (`palette.accent` / `palette.muted`).
5. Replace the "All You Plan" title with the serif wordmark: a `Text` with `fontFamily: fonts.serifItalic`, reading `all you plan`; screen headings use `ScreenHeading`.
6. Remove every import of the old `useThemeColors` hook; use `useTheme()` instead.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — no errors from `app/(auth)/`.
Then run `npx expo start`, open the app signed out, and confirm the four auth screens render on the warm background with the serif wordmark, themed `TextField`s, and an orange primary button; forms still submit and validate. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)"
git commit -m "feat: retheme auth screens to the warm design system"
```

---

### Task 19: Remove the old Eisenhower UI

**Files:**
- Delete: the old tab layout artifacts, screens, component, util, and test listed below

- [ ] **Step 1: Delete the old screens and the old quick-add component**

```bash
git rm "app/(tabs)/matrix.tsx" "app/(tabs)/spaces.tsx"
git rm "app/(tabs)/space/[id].tsx" "app/(tabs)/task/[id].tsx"
git rm src/components/QuickAddModal.tsx
```

If `git rm` reports a path does not exist, it was already removed — skip it. The `space/` and `task/` directories should now be empty; remove them if so.

- [ ] **Step 2: Delete the Eisenhower util, its test, and the old theme hook**

```bash
git rm src/utils/quadrantConfig.ts __tests__/quadrantConfig.test.ts
git rm src/hooks/useThemeColors.ts
```

- [ ] **Step 3: Verify nothing references the deleted modules**

Run: `npx tsc --noEmit`
Expected: no errors. If `tsc` reports an unresolved import, an old file still references deleted code — open it and remove the dead import. The Zustand domain stores and `api/operations` are kept and may still be imported by the auth flow; that is expected.

- [ ] **Step 4: Run the test suite**

Run: `npm test`
Expected: PASS — the `palettes.test.ts` suite passes; the deleted `quadrantConfig.test.ts` is gone.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove the old eisenhower UI"
```

---

### Task 20: Final verification

**Files:** none — this is a verification pass.

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 3: Manual QA**

Run: `npx expo start` and open the app in a simulator or Expo Go. Confirm:

1. The app launches with no red-box errors and no missing-font warnings.
2. After signing in, the 5-tab shell renders; each tab (Today, Chores, Projects, Wren, More) loads its placeholder.
3. The More hub lists the six destinations; tapping each opens its detail placeholder; the back gesture returns to More.
4. The Wren FAB is visible above the tab bar and opens the sliding Wren sheet; the scrim and close control dismiss it.
5. In the app, switch theme/mode by calling the store from a temporary control or by editing the persisted default — change `themeName` to `ink`, `blueprint`, `rose` and `mode` to `dark`; every surface, text color, and border recolors with no hardcoded color leaking through.
6. The auth screens render correctly in all 4 themes × light/dark.
7. If Expo warns about missing `icon.png` / `splash-icon.png` / `adaptive-icon.png` assets, add the image files to `assets/` or update the references in `app.json`.

- [ ] **Step 4: Fix and re-verify**

If any check fails, fix the cause, re-run Steps 1–3, then commit the fix with a `fix:` message. If everything passes, the Foundation mobile sub-project is complete — no commit needed for this task.

---

## Spec Coverage

Each section of `all-you-plan-web/docs/superpowers/specs/2026-05-21-foundation-design-system-design.md` maps to tasks here:

- **Token system** (§1) — Tasks 2–4 (palettes, scales, store/hook, fonts).
- **Shared primitives** (§2) — Tasks 5–11 (all 11 primitives plus the icon map).
- **Mobile app shell** (§4) — Tasks 12–15, 17 (TabBar, WrenFab, WrenSheet, tabs layout, More hub).
- **Routing & placeholder screens** (§5) — Tasks 15–17.
- **Removing the old UI** (§6) — Task 19.
- **Auth retheme** (§7) — Task 18.
- **Verification** — Tasks 2 (theme resolution test), 19, 20.
