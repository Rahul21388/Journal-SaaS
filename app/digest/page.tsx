// FILE: app/digest/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { getCurrentWeekId } from '@/lib/weekId'
import {
  formatDigestToParagraphs,
  shortWeekLabel,
  fullWeekLabel,
  summariseMoods,
} from '@/lib/formatDigest'
import { format } from 'date-fns'

interface Digest {
  uid: string
  weekId: string
  content: string
  entryCount: number
  moodSummary: string[]
  createdAt: { toDate: () => Date } | null
}

const MOOD_PILL: Record<string, string> = {
  great:    'bg-emerald-950 text-emerald-400 border-emerald-800',
  good:     'bg-teal-950 text-teal-400 border-teal-800',
  neutral:  'bg-slate-800 text-slate-400 border-slate-700',
  bad:      'bg-orange-950 text-orange-400 border-orange-800',
  terrible: 'bg-red-950 text-red-400 border-red-800',
}

export default function DigestPage() {
  return (
    <AuthGuard>
      <DigestView />
    </AuthGuard>
  )
}

function DigestView() {
  const [uid, setUid] = useState<string | null>(null)
  const [digests, setDigests] = useState<Digest[]>([])
  const [active, setActive] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const currentWeekId = getCurrentWeekId()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
    return unsub
  }, [])

  const fetchDigests = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const ref = collection(db, 'users', uid, 'digests')
      const q = query(ref, orderBy('createdAt', 'desc'), limit(8))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => d.data() as Digest)
      setDigests(data)
      if (data.length > 0) setActive(data[0])
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { fetchDigests() }, [fetchDigests])

  const handleGenerate = async (skipConfirm = false) => {
    if (!uid) return

    const alreadyHasThisWeek = digests.some((d) => d.weekId === currentWeekId)
    if (alreadyHasThisWeek && !skipConfirm) {
      const ok = window.confirm(
        'This will replace your current digest for this week. Continue?'
      )
      if (!ok) return
    }

    setGenerating(true)
    setError(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/generate-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weekId: currentWeekId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      await fetchDigests()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!active) return
    await navigator.clipboard.writeText(active.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const alreadyHasThisWeek = digests.some((d) => d.weekId === currentWeekId)

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">AI Weekly Digest</h1>
          <p className="mt-1 text-sm text-slate-500">Your week, reflected back to you.</p>
        </header>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700 border-t-slate-300" />
          </div>
        ) : digests.length === 0 ? (
          /* ── Empty state ───────────────────────────────────────────────── */
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <span className="text-6xl">✨</span>
            <div>
              <p className="text-xl font-semibold text-white">Your first digest is on its way</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Write entries throughout the week and generate your first AI reflection.
              </p>
            </div>
            <GenerateButton
              generating={generating}
              alreadyHasThisWeek={false}
              onGenerate={() => handleGenerate(true)}
            />
            {error && <ErrorBanner message={error} />}
          </div>
        ) : (
          /* ── Two-column layout ─────────────────────────────────────────── */
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            {/* Left: active digest */}
            <div className="flex flex-col gap-6 lg:flex-1">
              {active && <DigestCard digest={active} onCopy={handleCopy} copied={copied} />}

              <div className="flex flex-col gap-2">
                <GenerateButton
                  generating={generating}
                  alreadyHasThisWeek={alreadyHasThisWeek}
                  onGenerate={() => handleGenerate(false)}
                />
                {alreadyHasThisWeek && !generating && (
                  <p className="text-center text-xs text-slate-600">
                    You already have a digest for this week. Regenerating will replace it.
                  </p>
                )}
              </div>

              {error && <ErrorBanner message={error} />}
            </div>

            {/* Right: sidebar */}
            <aside className="lg:w-72 xl:w-80">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Past Digests
              </p>
              {digests.length <= 1 ? (
                <p className="text-sm text-slate-600">
                  Past digests will appear here as you build your journal habit.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {digests.map((d) => (
                    <button
                      key={d.weekId}
                      onClick={() => setActive(d)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        active?.weekId === d.weekId
                          ? 'border-slate-600 bg-slate-800'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-300">
                        {shortWeekLabel(d.weekId)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {d.entryCount} {d.entryCount === 1 ? 'entry' : 'entries'}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                        {d.content.slice(0, 80)}…
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DigestCard({
  digest,
  onCopy,
  copied,
}: {
  digest: Digest
  onCopy: () => void
  copied: boolean
}) {
  const paragraphs = formatDigestToParagraphs(digest.content)
  const moodCounts = summariseMoods(digest.moodSummary ?? [])
  const generatedAt = digest.createdAt?.toDate()

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
      {/* Week header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fullWeekLabel(digest.weekId)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Based on {digest.entryCount} {digest.entryCount === 1 ? 'entry' : 'entries'}
            {moodCounts.length > 0 ? ` · ${digest.moodSummary?.length ?? 0} moods tracked` : ''}
          </p>
        </div>

        {/* Copy button */}
        <button
          onClick={onCopy}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      {/* Mood pills */}
      {moodCounts.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {moodCounts.map(({ mood, count, emoji, label }) => (
            <span
              key={mood}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${MOOD_PILL[mood]}`}
            >
              {emoji} {label} × {count}
            </span>
          ))}
        </div>
      )}

      {/* Prose */}
      <div className="space-y-5">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-lg leading-[1.8] text-slate-300"
            style={{ maxWidth: '65ch' }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* Footer */}
      {generatedAt && (
        <p className="mt-6 text-xs text-slate-600">
          Generated on {format(generatedAt, 'EEEE, d MMMM yyyy · h:mm a')}
        </p>
      )}
    </article>
  )
}

function GenerateButton({
  generating,
  alreadyHasThisWeek,
  onGenerate,
}: {
  generating: boolean
  alreadyHasThisWeek: boolean
  onGenerate: () => void
}) {
  return (
    <button
      onClick={onGenerate}
      disabled={generating}
      className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {generating ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          Claude is reading your entries…
        </span>
      ) : alreadyHasThisWeek ? (
        '🔄 Regenerate this week\'s digest'
      ) : (
        '✨ Generate digest for this week'
      )}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  )
}
