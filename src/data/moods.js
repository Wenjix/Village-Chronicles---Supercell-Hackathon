// Mood definitions, personality system, and random event helpers

export const MOODS = {
  happy:   { label: 'Happy',   color: '#22c55e', emoji: '😊', buildSpeed: 1.0, refusalChance: 0.00 },
  tired:   { label: 'Tired',   color: '#60a5fa', emoji: '😴', buildSpeed: 0.7, refusalChance: 0.10 },
  grumpy:  { label: 'Grumpy',  color: '#ef4444', emoji: '😠', buildSpeed: 0.5, refusalChance: 0.30 },
  lazy:    { label: 'Lazy',    color: '#a855f7', emoji: '😒', buildSpeed: 0.6, refusalChance: 0.40 },
  feuding: { label: 'Feuding', color: '#f97316', emoji: '🤬', buildSpeed: 0.8, refusalChance: 0.60 },
}

export const PERSONALITIES = {
  diligent: {
    label: 'Diligent',
    // Weighted mood outcomes — higher = more likely
    weights: { happy: 5, tired: 2, grumpy: 1, lazy: 0, feuding: 1 },
  },
  lazy: {
    label: 'Lazy',
    weights: { happy: 1, tired: 3, grumpy: 1, lazy: 4, feuding: 1 },
  },
  hothead: {
    label: 'Hothead',
    weights: { happy: 1, tired: 1, grumpy: 4, lazy: 1, feuding: 3 },
  },
  cheerful: {
    label: 'Cheerful',
    weights: { happy: 6, tired: 2, grumpy: 0, lazy: 1, feuding: 0 },
  },
}

/**
 * Roll a new mood based on personality weights.
 * Returns a mood key string.
 */
export function rollMoodShift(personality) {
  const p = PERSONALITIES[personality]
  if (!p) return 'happy'
  const entries = Object.entries(p.weights)
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [mood, weight] of entries) {
    roll -= weight
    if (roll <= 0) return mood
  }
  return 'happy'
}

/**
 * Roll whether a villager refuses a work assignment.
 * Returns true if they refuse.
 */
export function rollRefusal(mood) {
  const m = MOODS[mood]
  if (!m) return false
  return Math.random() < m.refusalChance
}

/**
 * Get the build timer decrement for a mood (replaces flat -1).
 */
export function getBuildDecrement(mood) {
  const m = MOODS[mood]
  return m ? m.buildSpeed : 1.0
}

/**
 * Calculate overall village happiness (0-100).
 */
export function getVillageHappiness(villagers) {
  if (!villagers || villagers.length === 0) return 50
  const moodScores = { happy: 100, tired: 60, grumpy: 20, lazy: 40, feuding: 10 }
  const total = villagers.reduce((sum, v) => sum + (moodScores[v.mood] || 50), 0)
  return Math.round(total / villagers.length)
}

// Random events that can trigger on building completion or periodically
export const RANDOM_EVENTS = {
  production_bonus: {
    label: 'Production Surge',
    emoji: '🚀',
    description: 'High morale boosts all production!',
    multiplier: 1.5,
    duration: 15,
  },
  production_penalty: {
    label: 'Worker Slowdown',
    emoji: '🐌',
    description: 'Low morale slows production...',
    multiplier: 0.5,
    duration: 15,
  },
  feud_outbreak: {
    label: 'Feud Outbreak',
    emoji: '⚔️',
    description: 'Two villagers have started feuding!',
    multiplier: 1.0,
    duration: 0,
  },
  morale_boost: {
    label: 'Festival',
    emoji: '🎉',
    description: 'A spontaneous celebration lifts all spirits!',
    multiplier: 1.0,
    duration: 0,
  },
}

/**
 * Roll for a random event based on village happiness.
 * Low happiness = more negative events, high = more positive.
 * Returns an event key or null.
 */
export function rollRandomEvent(happiness) {
  // 3% chance per tick (~once per 30 seconds on average)
  if (Math.random() > 0.03) return null

  if (happiness >= 70) {
    // Mostly positive
    return Math.random() < 0.7 ? 'production_bonus' : 'morale_boost'
  } else if (happiness <= 30) {
    // Mostly negative
    return Math.random() < 0.6 ? 'production_penalty' : 'feud_outbreak'
  } else {
    // Mixed
    const roll = Math.random()
    if (roll < 0.25) return 'production_bonus'
    if (roll < 0.50) return 'production_penalty'
    if (roll < 0.75) return 'morale_boost'
    return 'feud_outbreak'
  }
}
