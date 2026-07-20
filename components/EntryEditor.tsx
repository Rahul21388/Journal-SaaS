// FILE: components/EntryEditor.tsx
'use client'

import { useState, useRef } from 'react'
import type { Mood } from '@/lib/types'

const MAX_TAGS = 5
const MAX_TAG_LEN = 20

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
  initialTags?: string[]
  isEdit?: boolean
  lastSavedAt?: Date | null
  onSave: (content: string, mood: Mood, tags: string[]) => Promise<void>
  saving?: boolean
}

export default function EntryEditor({
  initialContent = '',
  initialMood = 'neutral',
  initialTags = [],
  isEdit = false,
  lastSavedAt = null,
  onSave,
  saving = false,
}: Props) {
  const [content, setContent] = useState(initialContent)
  const [mood, setMood] = useState<Mood>(initialMood)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState('')
  const [toast, setToast] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const canSave = content.trim().length >= 10

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length

  const addTag = (raw: string) => {
    const tag = raw.toLowerCase().trim().slice(0, MAX_TAG_LEN)
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return
    setTags((prev) => [...prev, tag])
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    await onSave(content, mood, tags)
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

      {/* Tags */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-400">
          Tags <span className="font-normal text-slate-600">(optional · up to {MAX_TAGS})</span>
        </p>
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 focus-within:border-slate-500 cursor-text"
          onClick={() => tagInputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-200"
            >
              #{tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                className="text-slate-400 hover:text-white leading-none"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          {tags.length < MAX_TAGS && (
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.replace(',', ''))}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput('') } }}
              placeholder={tags.length === 0 ? 'Add a tag and press Enter…' : ''}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-100 placeholder-slate-600 outline-none"
              maxLength={MAX_TAG_LEN + 1}
            />
          )}
        </div>
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
