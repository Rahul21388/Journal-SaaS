// FILE: components/EntryEditor.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Mood } from '@/lib/types'

const MAX_TAGS = 5
const MAX_TAG_LEN = 20
const VOICE_SILENCE_TIMEOUT_MS = 60_000

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great',    emoji: '😄', label: 'Great'    },
  { value: 'good',     emoji: '🙂', label: 'Good'     },
  { value: 'neutral',  emoji: '😐', label: 'Neutral'  },
  { value: 'bad',      emoji: '😔', label: 'Bad'      },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
]

// ── Web Speech API type shim (not in TS lib) ──────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

// ── Props ─────────────────────────────────────────────────────────────────────
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

  // ── Voice state ───────────────────────────────────────────────────────────
  const [speechSupported, setSpeechSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const interimRef = useRef<string>('')       // current interim transcript
  const baseContentRef = useRef<string>('')   // content before interim was appended
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null)
  }, [])

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    interimRef.current = ''
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
  }, [])

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return
    setMicError(null)

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = navigator.language || 'en-US'

    // Snapshot the current textarea content so we can append to it cleanly
    baseContentRef.current = content
    interimRef.current = ''

    rec.onresult = (e: SpeechRecognitionEvent) => {
      // Reset silence timer on every result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(stopListening, VOICE_SILENCE_TIMEOUT_MS)

      let interim = ''
      let finalChunk = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalChunk += transcript
        } else {
          interim += transcript
        }
      }

      if (finalChunk) {
        // Commit the final chunk: append with a space if base doesn't end in whitespace
        const base = baseContentRef.current
        const separator = base.length > 0 && !/\s$/.test(base) ? ' ' : ''
        baseContentRef.current = base + separator + finalChunk
        interimRef.current = ''
      }

      interimRef.current = interim

      // Show base + current interim in the textarea
      const displayed = interimRef.current
        ? baseContentRef.current + (baseContentRef.current.length > 0 && !/\s$/.test(baseContentRef.current) ? ' ' : '') + interimRef.current
        : baseContentRef.current
      setContent(displayed)
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setMicError('Microphone access denied — you can enable it in browser settings.')
      }
      stopListening()
    }

    rec.onend = () => {
      // Flush any remaining interim as content
      if (interimRef.current) {
        const base = baseContentRef.current
        const separator = base.length > 0 && !/\s$/.test(base) ? ' ' : ''
        setContent(base + separator + interimRef.current)
        interimRef.current = ''
      }
      setListening(false)
    }

    recognitionRef.current = rec
    rec.start()
    setListening(true)

    // Auto-stop safety timer
    silenceTimerRef.current = setTimeout(stopListening, VOICE_SILENCE_TIMEOUT_MS)
  }, [content, stopListening])

  // Keep baseContentRef in sync when user types manually (not during recognition)
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    if (!listening) baseContentRef.current = val
  }

  const toggleListening = () => {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  // ── Tags ──────────────────────────────────────────────────────────────────
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
    if (listening) stopListening()
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
        <div className="flex items-center justify-between">
          <label htmlFor="entry" className="text-sm font-medium text-slate-400">
            What&apos;s on your mind?
          </label>
          {/* Mic button — only rendered when browser supports Speech API */}
          {speechSupported && (
            <div className="flex items-center gap-2">
              {listening && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                  </span>
                  Listening…
                </span>
              )}
              <button
                type="button"
                onClick={toggleListening}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                title={listening ? 'Stop voice input' : 'Dictate entry'}
                className={`flex items-center justify-center rounded-lg border p-2 transition-all ${
                  listening
                    ? 'border-rose-700 bg-rose-950 text-rose-400 hover:bg-rose-900'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {listening ? (
                  /* Stop icon */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  /* Mic icon */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          id="entry"
          value={content}
          onChange={handleContentChange}
          placeholder="Write freely — this space is just for you…"
          className="min-h-[60vh] w-full resize-y rounded-xl border border-slate-700 bg-slate-900 p-4 text-base text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />

        {micError && (
          <p className="text-xs text-amber-500">{micError}</p>
        )}

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
