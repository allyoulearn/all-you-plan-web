/** Mock fixtures for the Stats screen. */

// 182 integers (0-3) representing six months of daily activity intensity.
// 0 = no activity, 1 = light, 2 = moderate, 3 = intense.
const heatmap = [
  0, 0, 1, 0, 2, 1, 0, 1, 2, 3, 1, 0, 2, 1, 1, 0, 3, 2, 1, 0, 1, 1, 2, 0, 1, 3, 2, 1, 0, 0, 1, 2, 1,
  3, 1, 0, 2, 1, 1, 2, 3, 1, 0, 2, 1, 0, 1, 2, 1, 0, 2, 1, 3, 1, 2, 1, 0, 1, 2, 3, 1, 0, 0, 1, 2, 1,
  3, 2, 1, 0, 1, 1, 2, 3, 1, 2, 0, 1, 2, 1, 0, 3, 2, 1, 1, 2, 0, 1, 3, 2, 1, 0, 1, 2, 1, 0, 1, 2, 3,
  1, 2, 0, 1, 1, 2, 3, 0, 1, 2, 1, 3, 1, 0, 2, 1, 1, 0, 3, 2, 1, 2, 0, 1, 1, 2, 3, 1, 0, 2, 1, 0, 1,
  2, 1, 3, 2, 0, 1, 2, 1, 0, 3, 2, 1, 0, 1, 2, 1, 3, 1, 2, 0, 1, 2, 3, 1, 0, 1, 2, 1, 0, 3, 2, 1, 1,
  2, 0, 1, 3, 2, 1, 0, 1, 2, 1, 0, 1, 3, 2, 1, 0, 2
]

const rankedHabits = [
  { choreId: 'c2', name: 'Meditate', streak: 6, bestStreak: 21 },
  { choreId: 'c3', name: 'Journaling', streak: 3, bestStreak: 9 },
  { choreId: 'c1', name: 'Morning workout', streak: 4, bestStreak: 12 },
  { choreId: 'c4', name: 'Review inbox', streak: 2, bestStreak: 6 },
  { choreId: 'c5', name: 'Monthly budget review', streak: 1, bestStreak: 4 }
]

export const registry = {
  stats: () => ({ stats: { heatmap, rankedHabits } })
}
