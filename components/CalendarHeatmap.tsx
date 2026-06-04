// FILE: components/CalendarHeatmap.tsx
'use client'

import { useState } from 'react'
import { format, subDays, startOfDay, getDay } from 'date-fns'
import type { Entry, Mood } from '@/lib/types'

const MOOD_BG: Record<Mood, string> = {
  great: 'bg-emerald-500',
  good: 'bg-teal-500',
  neutral: 'bg-slate-500',
  bad: 'bg-orange-500',
  terrible: 'bg-red-500',
}

const MOOD_EMOJI: Record<Mood, string> = {
  great: '😄', good: '🙂', neutral: '😐', bad: '😔', terrible: '😢',
}

const MOOD_LABEL: Record<Mood, string> = {
  great: 'Great', good: 'Good', neutral: 'Neutral', bad: 'Bad', terrible: 'Terrible',
}

const LEGEND: { mood: Mood }[] = [
  { mood: 'great' }, { mood: 'good' }, { mood: 'neutral' }, { mood: 'bad' }, { mood: 'terrible' },
]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props { entries: Entry[] }

export default function CalendarHeatmap({ entries }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const byDate = Object.fromEntries(entries.map((e) => [e.date, e]))

  // Build last 28 days aligned to Mon–Sun grid
  const today = startOfDay(new Date())
  // day index 0=Sun…6=Sat, convert to Mon=0…Sun=6
  const todayDow = (getDay(today) + 6) % 7
  // pad forward so the grid ends on Sunday
  const daysToAdd = 6 - todayDow
  const gridEnd = subDays(today, -daysToAdd)

  // 28-cell grid ending at gridEnd
  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = subDays(gridEnd, 27 - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const isFuture = d > today
    return { dateStr, label: format(d, 'MMM d'), entry: byDate[dateStr] ?? null, isFuture }
  })

  // Chunk into 4 rows of 7
  const rows = Array.from({ length: 4 }, (_, r) => cells.slice(r * 7, r * 7 + 7))

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="mb-3 text-sm font-medium text-slate-300">Last 28 days</p>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] text-slate-600">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1.5">
            {row.map(({ dateStr, label, entry, isFuture }) => {
              const isHovered = hovered === dateStr
              return (
                <div
                  key={dateStr}
                  className="relative"
                  onMouseEnter={() => !isFuture && setHovered(dateStr)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className={`aspect-square w-full rounded-sm transition-transform ${
                      isFuture
                        ? 'bg-slate-900 border border-slate-800'
                        : entry
                        ? `${MOOD_BG[entry.mood]} cursor-pointer hover:scale-110`
                        : 'bg-slate-800 cursor-default'
                    }`}
                  />
                  {isHovered && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg">
                      {label}
                      {entry ? ` · ${MOOD_EMOJI[entry.mood]} ${MOOD_LABEL[entry.mood]}` : ' · No entry'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-600">Mood:</span>
        {LEGEND.map(({ mood }) => (
          <div key={mood} className="flex items-center gap-1">
            <div className={`h-2.5 w-2.5 rounded-sm ${MOOD_BG[mood]}`} />
            <span className="text-xs text-slate-500">{MOOD_LABEL[mood]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-slate-800" />
          <span className="text-xs text-slate-500">No entry</span>
        </div>
      </div>
    </div>
  )
}
