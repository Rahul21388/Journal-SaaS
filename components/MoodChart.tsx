// FILE: components/MoodChart.tsx
'use client'

import { useState } from 'react'
import type { Entry, Mood } from '@/lib/types'
import { format, subDays, parseISO } from 'date-fns'

const MOOD_SCORE: Record<Mood, number> = {
  great: 5, good: 4, neutral: 3, bad: 2, terrible: 1,
}

const MOOD_COLOR: Record<Mood, string> = {
  great: '#34d399', good: '#2dd4bf', neutral: '#94a3b8', bad: '#fb923c', terrible: '#f87171',
}

const MOOD_LABEL: Record<Mood, string> = {
  great: 'Great', good: 'Good', neutral: 'Neutral', bad: 'Bad', terrible: 'Terrible',
}

const MOOD_EMOJI: Record<Mood, string> = {
  great: '😄', good: '🙂', neutral: '😐', bad: '😔', terrible: '😢',
}

interface Props { entries: Entry[] }

export default function MoodChart({ entries }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null)

  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') }
  })

  const byDate = Object.fromEntries(entries.map((e) => [e.date, e]))
  const weekEntries = days.map((d) => byDate[d.date] ?? null)
  const validEntries = weekEntries.filter(Boolean) as Entry[]

  // Stats
  const moodCounts = validEntries.reduce<Partial<Record<Mood, number>>>((acc, e) => {
    acc[e.mood] = (acc[e.mood] ?? 0) + 1
    return acc
  }, {})
  const dominantMood = (Object.entries(moodCounts) as [Mood, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // SVG layout
  const W = 500
  const H = 140
  const padL = 28
  const padR = 16
  const padT = 16
  const padB = 28
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const xStep = chartW / 6
  const yScale = (score: number) => padT + chartH - ((score - 1) / 4) * chartH

  const points = days
    .map((d, i) => {
      const entry = byDate[d.date]
      if (!entry) return null
      return { x: padL + i * xStep, y: yScale(MOOD_SCORE[entry.mood]), entry, day: d }
    })
    .filter(Boolean) as { x: number; y: number; entry: Entry; day: { date: string; label: string } }[]

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  const yLabels = [
    { score: 5, label: '😄' },
    { score: 3, label: '😐' },
    { score: 1, label: '😢' },
  ]

  if (validEntries.length < 2) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-sm font-medium text-slate-400 mb-1">Mood trend</p>
        <p className="text-xs text-slate-600">Keep writing to see your mood trend.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm font-medium text-slate-300 mb-3">Mood trend — last 7 days</p>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y gridlines */}
          {yLabels.map(({ score, label }) => {
            const y = yScale(score)
            return (
              <g key={score}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1e293b" strokeWidth="1" />
                <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#475569">{label}</text>
              </g>
            )
          })}

          {/* X axis labels */}
          {days.map((d, i) => (
            <text
              key={d.date}
              x={padL + i * xStep}
              y={H - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#475569"
            >
              {d.label}
            </text>
          ))}

          {/* Line */}
          {points.length >= 2 && (
            <polyline
              points={polyline}
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}

          {/* Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="6"
              fill={MOOD_COLOR[p.entry.mood]}
              stroke="#0f172a"
              strokeWidth="2"
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.closest('svg') as SVGElement).getBoundingClientRect()
                const svgX = (p.x / W) * rect.width + rect.left
                const svgY = (p.y / H) * rect.height + rect.top
                setTooltip({
                  x: svgX,
                  y: svgY,
                  label: `${format(parseISO(p.day.date), 'MMM d')} · ${MOOD_EMOJI[p.entry.mood]} ${MOOD_LABEL[p.entry.mood]}`,
                })
              }}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y - 8 }}
          >
            {tooltip.label}
          </div>
        )}
      </div>

      {dominantMood && (
        <p className="mt-2 text-xs text-slate-500">
          Your most frequent mood this week:{' '}
          <span className="font-medium text-slate-300">
            {MOOD_EMOJI[dominantMood]} {MOOD_LABEL[dominantMood]}
          </span>
        </p>
      )}
    </div>
  )
}
