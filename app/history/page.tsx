// FILE: app/history/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getEntries } from '@/lib/firestore'
import type { Entry } from '@/lib/types'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import EntryCard from '@/components/EntryCard'
import Skeleton from '@/components/Skeleton'
import Link from 'next/link'

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

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

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
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
            <p className="text-4xl">📝</p>
            <p className="mt-3 text-slate-400">No entries yet. Start writing today.</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              Write now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <EntryCard key={entry.date} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
