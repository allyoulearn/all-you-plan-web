import * as Outline from '@heroicons/vue/24/outline'
import * as Solid from '@heroicons/vue/24/solid'

const names = {
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
  filter: 'FunnelIcon'
}

export const outlineIcons = Object.fromEntries(
  Object.entries(names).map(([k, v]) => [k, Outline[v]])
)
export const solidIcons = Object.fromEntries(Object.entries(names).map(([k, v]) => [k, Solid[v]]))
