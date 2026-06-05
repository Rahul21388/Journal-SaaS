// FILE: app/dashboard/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getEntry, getEntries, saveEntry } from '@/lib/firestore'
import type { Entry, Mood } from '@/lib/types'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import EntryEditor from '@/components/EntryEditor'
import MoodChart from '@/components/MoodChart'
import StatsBar from '@/components/StatsBar'
import { useUserProfile } from '@/app/hooks/useUserProfile'
import Link from 'next/link'
import { format } from 'date-fns'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}

function ProGate({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
      <span className="text-3xl">🔒</span>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Link
        href="/pricing"
        className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Upgrade to Pro
      </Link>
      <p className="text-xs text-slate-600">₹199/month · cancel anytime</p>
    </div>
  )
}

function Dashboard() {
  const [uid, setUid] = useState<string | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const { features } = useUserProfile()

  const today = todayString()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })
    return unsub
  }, [])

  const fetchData = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    const [e, all] = await Promise.all([
      getEntry(uid, today),
      getEntries(uid, 30),
    ])
    setEntry(e)
    setAllEntries(all)
    if (e?.updatedAt) setLastSavedAt(e.updatedAt.toDate())
    setLoading(false)
  }, [uid, today])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (content: string, mood: Mood) => {
    if (!uid) return
    setSaving(true)
    await saveEntry(uid, today, content, mood)
    await fetchData()
    setLastSavedAt(new Date())
    setSaving(false)
  }

  const dateLabel = format(new Date(), 'EEEE, d MMMM yyyy')

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-500">{dateLabel}</p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            {entry ? "Edit today's entry" : "Today's journal"}
          </h1>
          {entry && (
            <p className="mt-1 text-sm text-slate-500">
              You already wrote today — keep editing below.
            </p>
          )}
        </header>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700 border-t-slate-300" />
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <EntryEditor
              initialContent={entry?.content ?? ''}
              initialMood={entry?.mood ?? 'neutral'}
              isEdit={!!entry}
              lastSavedAt={lastSavedAt}
              onSave={handleSave}
              saving={saving}
            />

            {/* StatsBar — available to all users */}
            <StatsBar entries={allEntries} />

            {/* MoodChart — Pro only */}
            {features.moodChart ? (
              <MoodChart entries={allEntries} />
            ) : (
              <ProGate
                title="Mood Chart"
                description="Track your emotional patterns over time. Available on Pro."
              />
            )}
          </div>
        )}
      </main>
    </>
  )
}
