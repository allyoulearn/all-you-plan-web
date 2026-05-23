/**
 * Icon map.
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
  filter: 'FunnelIcon',
  x: 'XMarkIcon',
  trash: 'TrashIcon',
  pencil: 'PencilSquareIcon',
  archive: 'ArchiveBoxIcon'
}

// -- Exports --

/** Outline variant icon lookup by application key. */
export const outlineIcons = Object.fromEntries(
  Object.entries(names).map(([k, v]) => [k, Outline[v]])
)

/** Solid variant icon lookup by application key. */
export const solidIcons = Object.fromEntries(Object.entries(names).map(([k, v]) => [k, Solid[v]]))
