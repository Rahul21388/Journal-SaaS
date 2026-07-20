// FILE: components/EntryCard.tsx
'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { Entry, Mood } from '@/lib/types'

const MOOD_META: Record<Mood, { emoji: string; label: string; classes: string }> = {
  great:   { emoji: '😄', label: 'Great',    classes: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
  good:    { emoji: '🙂', label: 'Good',     classes: 'bg-teal-950 text-teal-400 border-teal-800' },
  neutral: { emoji: '😐', label: 'Neutral',  classes: 'bg-slate-800 text-slate-400 border-slate-700' },
  bad:     { emoji: '😔', label: 'Bad',      classes: 'bg-orange-950 text-orange-400 border-orange-800' },
  terrible:{ emoji: '😢', label: 'Terrible', classes: 'bg-red-950 text-red-400 border-red-800' },
}

interface Props {
  entry: Entry
}

export default function EntryCard({ entry }: Props) {
  const [expanded, setExpanded] = useState(false)

  const mood = MOOD_META[entry.mood]
  const dateLabel = format(parseISO(entry.date), 'EEEE, d MMMM yyyy')
  const preview = entry.content.slice(0, 150)
  const hasMore = entry.content.length > 150

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <time className="text-sm font-medium text-slate-300">{dateLabel}</time>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${mood.classes}`}
        >
          {mood.emoji} {mood.label}
        </span>
      </div>

      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[2000px]' : 'max-h-24'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
          {expanded ? entry.content : preview + (hasMore && !expanded ? '…' : '')}
        </p>
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* View / Collapse toggle */}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 rounded-lg border border-slate-700 px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
        >
          {expanded ? 'Collapse' : 'View'}
        </button>
      )}
    </article>
  )
}
