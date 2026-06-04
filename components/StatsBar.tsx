// FILE: components/StatsBar.tsx
import type { Entry, Mood } from '@/lib/types'
import { format, subDays } from 'date-fns'

const MOOD_EMOJI: Record<Mood, string> = {
  great: '😄', good: '🙂', neutral: '😐', bad: '😔', terrible: '😢',
}

interface Props { entries: Entry[] }

function computeStreaks(entries: Entry[]): { current: number; longest: number } {
  if (entries.length === 0) return { current: 0, longest: 0 }

  const dates = new Set(entries.map((e) => e.date))
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // Current streak: walk back from today or yesterday
  let current = 0
  let cursor = dates.has(today) ? new Date() : dates.has(yesterday) ? subDays(new Date(), 1) : null
  while (cursor) {
    const ds = format(cursor, 'yyyy-MM-dd')
    if (dates.has(ds)) {
      current++
      cursor = subDays(cursor, 1)
    } else {
      break
    }
  }

  // Longest streak: sort all dates and scan
  const sorted = [...dates].sort()
  let longest = 0
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = (curr.getTime() - prev.getTime()) / 86400000
      run = diff === 1 ? run + 1 : 1
    }
    longest = Math.max(longest, run)
  }

  return { current, longest }
}

function dominantMoodThisWeek(entries: Entry[]): Mood | null {
  const today = new Date()
  const weekAgo = format(subDays(today, 6), 'yyyy-MM-dd')
  const todayStr = format(today, 'yyyy-MM-dd')

  const weekEntries = entries.filter((e) => e.date >= weekAgo && e.date <= todayStr)
  if (weekEntries.length === 0) return null

  const counts = weekEntries.reduce<Partial<Record<Mood, number>>>((acc, e) => {
    acc[e.mood] = (acc[e.mood] ?? 0) + 1
    return acc
  }, {})

  return (Object.entries(counts) as [Mood, number][]).sort((a, b) => b[1] - a[1])[0][0]
}

interface StatProps { label: string; value: string | number }
function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3">
      <span className="text-xl font-bold text-white">{value}</span>
      <span className="text-xs text-slate-500 text-center">{label}</span>
    </div>
  )
}

export default function StatsBar({ entries }: Props) {
  const { current, longest } = computeStreaks(entries)
  const mood = dominantMoodThisWeek(entries)

  return (
    <div className="flex flex-wrap justify-around divide-x divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
      <Stat label="Total entries" value={entries.length} />
      <Stat label="Current streak" value={current === 0 ? '—' : `${current}d`} />
      <Stat label="Longest streak" value={longest === 0 ? '—' : `${longest}d`} />
      <Stat label="This week's mood" value={mood ? MOOD_EMOJI[mood] : '—'} />
    </div>
  )
}
