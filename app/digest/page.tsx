// FILE: app/digest/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { getCurrentWeekId, formatWeekLabel } from '@/lib/weekId'

interface Digest {
  uid: string
  weekId: string
  content: string
  entryCount: number
  moodSummary: string[]
  createdAt: { toDate: () => Date } | null
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
  const [digest, setDigest] = useState<Digest | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
    return unsub
  }, [])

  const fetchLatestDigest = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const ref = collection(db, 'users', uid, 'digests')
      const q = query(ref, orderBy('createdAt', 'desc'), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) {
        setDigest(snap.docs[0].data() as Digest)
      }
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { fetchLatestDigest() }, [fetchLatestDigest])

  const handleGenerate = async () => {
    if (!uid) return
    setGenerating(true)
    setError(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const weekId = getCurrentWeekId()
      const res = await fetch('/api/generate-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weekId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      await fetchLatestDigest()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">AI Weekly Digest</h1>
          <p className="mt-1 text-sm text-slate-500">
            An AI-generated reflection on your week&apos;s entries.
          </p>
        </header>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700 border-t-slate-300" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Digest card */}
            {digest ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Week of
                    </p>
                    <p className="text-sm font-semibold text-slate-300">
                      {formatWeekLabel(digest.weekId)}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-500">
                    Based on {digest.entryCount} {digest.entryCount === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                <div className="prose prose-invert prose-sm max-w-none">
                  {digest.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 leading-7 text-slate-300 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
                <p className="text-4xl">✨</p>
                <p className="mt-3 text-slate-300 font-medium">No digest yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Your first AI digest will arrive this Sunday at 8 PM. Keep writing!
                </p>
              </div>
            )}

            {/* Generate button */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-900" />
                    Generating your digest…
                  </span>
                ) : (
                  '✨ Generate digest for this week'
                )}
              </button>
              <p className="text-center text-xs text-slate-600">
                Uses the entries you&apos;ve written this week (Mon–Sun)
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
