// FILE: app/history/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getEntries } from '@/lib/firestore'
import type { Entry, Mood } from '@/lib/types'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import EntryCard from '@/components/EntryCard'
import Skeleton from '@/components/Skeleton'
import CalendarHeatmap from '@/components/CalendarHeatmap'
import { useUserProfile } from '@/app/hooks/useUserProfile'
import Link from 'next/link'

type Filter = 'all' | Mood

const MOOD_TABS: { value: Filter; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'great',    label: '😄'       },
  { value: 'good',     label: '🙂'       },
  { value: 'neutral',  label: '😐'       },
  { value: 'bad',      label: '😔'       },
  { value: 'terrible', label: '😢'       },
]

export default function HistoryPage() {
  return (
    <AuthGuard>
      <History />
    </AuthGuard>
  )
}

function History() {
  const [uid, setUid] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const { features } = useUserProfile()

  useEffect(() => { document.title = 'History | Daily Journal' }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
    return unsub
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    const data = await getEntries(uid, 50)
    setEntries(data)
    setLoading(false)
  }, [uid])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.mood === filter)

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Journal history</h1>
          <p className="mt-1 text-sm text-slate-500">All your entries, newest first.</p>
        </header>

        {loading ? (
          <Skeleton lines={3} />
        ) : (
          <div className="flex flex-col gap-6">
            {/* CalendarHeatmap — Pro only */}
            {features.moodChart ? (
              <CalendarHeatmap entries={entries} />
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Calendar Heatmap</p>
                    <p className="text-xs text-slate-500">28-day mood overview. Available on Pro.</p>
                  </div>
                </div>
                <Link
                  href="/upgrade"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                >
                  Upgrade
                </Link>
              </div>
            )}

            {/* Mood filter tabs */}
            <div className="flex flex-wrap gap-2">
              {MOOD_TABS.map((tab) => {
                const count =
                  tab.value === 'all'
                    ? entries.length
                    : entries.filter((e) => e.mood === tab.value).length
                const isActive = filter === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}{' '}
                    <span className={`text-xs ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Entry list */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
                <p className="text-4xl">📝</p>
                {entries.length === 0 ? (
                  <>
                    <p className="mt-3 text-slate-400">No entries yet. Start writing today.</p>
                    <Link
                      href="/dashboard"
                      className="mt-4 inline-block rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
                    >
                      Write now
                    </Link>
                  </>
                ) : (
                  <p className="mt-3 text-slate-400">No entries with this mood.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((entry) => (
                  <EntryCard key={entry.date} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
