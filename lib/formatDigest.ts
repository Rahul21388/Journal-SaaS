// FILE: lib/formatDigest.ts
import { format } from 'date-fns'
import { getWeekRange } from './weekId'

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible'

export interface MoodCount {
  mood: Mood
  count: number
  emoji: string
  label: string
}

const MOOD_META: Record<Mood, { emoji: string; label: string }> = {
  great:    { emoji: '😄', label: 'Great'    },
  good:     { emoji: '🙂', label: 'Good'     },
  neutral:  { emoji: '😐', label: 'Neutral'  },
  bad:      { emoji: '😔', label: 'Bad'      },
  terrible: { emoji: '😢', label: 'Terrible' },
}

const MOOD_ORDER: Mood[] = ['great', 'good', 'neutral', 'bad', 'terrible']

export function formatDigestToParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function shortWeekLabel(weekId: string): string {
  const { monday, sunday } = getWeekRange(weekId)
  return `${format(monday, 'MMM d')} – ${format(sunday, 'MMM d')}`
}

export function fullWeekLabel(weekId: string): string {
  const { monday, sunday } = getWeekRange(weekId)
  return `Week of ${format(monday, 'EEE d MMM')} – ${format(sunday, 'EEE d MMM yyyy')}`
}

export function summariseMoods(moods: string[]): MoodCount[] {
  const counts: Partial<Record<Mood, number>> = {}
  for (const m of moods) {
    const mood = m as Mood
    if (MOOD_META[mood]) {
      counts[mood] = (counts[mood] ?? 0) + 1
    }
  }
  return MOOD_ORDER
    .filter((m) => (counts[m] ?? 0) > 0)
    .map((m) => ({
      mood: m,
      count: counts[m]!,
      emoji: MOOD_META[m].emoji,
      label: MOOD_META[m].label,
    }))
}
