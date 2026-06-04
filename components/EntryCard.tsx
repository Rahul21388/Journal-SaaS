// FILE: components/EntryCard.tsx
import type { Entry, Mood } from '@/lib/firestore'
import { format, parseISO } from 'date-fns'

const MOOD_META: Record<Mood, { emoji: string; label: string; color: string }> = {
  great: { emoji: '😄', label: 'Great', color: 'text-emerald-400' },
  good: { emoji: '🙂', label: 'Good', color: 'text-blue-400' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'text-slate-400' },
  bad: { emoji: '😔', label: 'Bad', color: 'text-amber-400' },
  terrible: { emoji: '😢', label: 'Terrible', color: 'text-red-400' },
}

interface Props {
  entry: Entry
}

export default function EntryCard({ entry }: Props) {
  const mood = MOOD_META[entry.mood]
  const dateLabel = format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')
  const preview =
    entry.content.length > 200 ? entry.content.slice(0, 200) + '…' : entry.content

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      <div className="mb-3 flex items-center justify-between">
        <time className="text-sm font-medium text-slate-300">{dateLabel}</time>
        <span className={`flex items-center gap-1.5 text-sm font-medium ${mood.color}`}>
          {mood.emoji} {mood.label}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{preview}</p>
    </article>
  )
}
