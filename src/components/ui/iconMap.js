/**
 * AppIcon map.
 * Maps application-specific icon keys (e.g. 'today', 'calendar') to their
 * Heroicons component names, then builds two lookup objects — one for the
 * outline variant and one for the solid variant — exported as
 * `outlineIcons` and `solidIcons`.
 */
import * as Outline from '@heroicons/vue/24/outline'
import * as Solid from '@heroicons/vue/24/solid'

// -- Key-to-name mapping --

const names = {
  today: 'HomeIcon',
  chores: 'ArrowPathIcon',
  projects: 'Squares2X2Icon',
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
  'arrow-left': 'ArrowLeftIcon',
  filter: 'FunnelIcon',
  x: 'XMarkIcon',
  // Reserved for upcoming task/project row actions (delete, edit, archive)
  //. Consumers will appear in the next slice; the dev-only
  // assertion below catches typos in either set.
  trash: 'TrashIcon',
  pencil: 'PencilSquareIcon',
  archive: 'ArchiveBoxIcon',
  tag: 'TagIcon',
  clock: 'ClockIcon',
  sparkles: 'SparklesIcon',
  menu: 'Bars3Icon',
  'map-pin': 'MapPinIcon',
  fire: 'FireIcon',
  grip: 'Bars3Icon'
}

// Dev-only sanity check: every value in `names` must resolve to
// a real Heroicons export in BOTH the outline and solid sets. A typo here
// (e.g. `HomeIcons` with a trailing 's') would otherwise silently render
// nothing — the dev console error makes it obvious immediately.
if (import.meta.env.DEV) {
  for (const [k, v] of Object.entries(names)) {
    if (!Outline[v]) {
      console.error(
        `[iconMap] Outline icon "${v}" (key "${k}") is not in @heroicons/vue/24/outline`
      )
    }

    if (!Solid[v]) {
      console.error(`[iconMap] Solid icon "${v}" (key "${k}") is not in @heroicons/vue/24/solid`)
    }
  }
}

// -- Exports --

/** Outline variant icon lookup by application key. */
export const outlineIcons = Object.fromEntries(
  Object.entries(names).map(([k, v]) => [k, Outline[v]])
)

/** Solid variant icon lookup by application key. */
export const solidIcons = Object.fromEntries(Object.entries(names).map(([k, v]) => [k, Solid[v]]))
