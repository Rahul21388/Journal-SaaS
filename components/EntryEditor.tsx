// FILE: components/EntryEditor.tsx
'use client'

import { useState } from 'react'
import type { Mood } from '@/lib/types'

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great',    emoji: '😄', label: 'Great'    },
  { value: 'good',     emoji: '🙂', label: 'Good'     },
  { value: 'neutral',  emoji: '😐', label: 'Neutral'  },
  { value: 'bad',      emoji: '😔', label: 'Bad'      },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
]

interface Props {
  initialContent?: string
  initialMood?: Mood
  isEdit?: boolean
  lastSavedAt?: Date | null
  onSave: (content: string, mood: Mood) => Promise<void>
  saving?: boolean
}

export default function EntryEditor({
  initialContent = '',
  initialMood = 'neutral',
  isEdit = false,
  lastSavedAt = null,
  onSave,
  saving = false,
}: Props) {
  const [content, setContent] = useState(initialContent)
  const [mood, setMood] = useState<Mood>(initialMood)
  const [toast, setToast] = useState(false)

  const canSave = content.trim().length >= 10

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    await onSave(content, mood)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Mood selector */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-400">How are you feeling today?</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              title={m.label}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 text-2xl transition-all ${
                mood === m.value
                  ? 'scale-105 border-slate-400 bg-slate-700'
                  : 'border-transparent bg-slate-800 hover:border-slate-600 hover:bg-slate-700'
              }`}
            >
              {m.emoji}
              <span className="text-xs text-slate-400">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="flex flex-col gap-2">
        <label htmlFor="entry" className="text-sm font-medium text-slate-400">
          What&apos;s on your mind?
        </label>
        <textarea
          id="entry"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write freely — this space is just for you…"
          className="min-h-[60vh] w-full resize-y rounded-xl border border-slate-700 bg-slate-900 p-4 text-base text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
        <p className="text-right text-xs text-slate-600">
          {content.length} character{content.length !== 1 ? 's' : ''} · {wordCount} word{wordCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving || !canSave}
          className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Entry' : 'Save Entry'}
        </button>

        <span
          className={`text-sm font-medium text-emerald-400 transition-opacity duration-300 ${
            toast ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Entry saved ✓
        </span>

        {lastSavedAt && !toast && (
          <span className="text-xs text-slate-600">
            Last saved: {formatTime(lastSavedAt)}
          </span>
        )}
      </div>

      {content.trim().length > 0 && content.trim().length < 10 && (
        <p className="text-xs text-amber-500">Write at least 10 characters to save.</p>
      )}
    </form>
  )
}
