// FILE: app/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { saveAnchorNote } from '@/lib/firestore'
import { getUserProfile } from '@/lib/userProfile'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useUserProfile } from '@/app/hooks/useUserProfile'
import Link from 'next/link'

const MAX_CHARS = 300

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Settings />
    </AuthGuard>
  )
}

function Settings() {
  const [uid, setUid] = useState<string | null>(null)
  const [anchorNote, setAnchorNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { isPro } = useUserProfile()

  useEffect(() => { document.title = 'Settings | Daily Journal' }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      setUid(user.uid)
      try {
        const profile = await getUserProfile(user.uid)
        setAnchorNote(profile?.anchorNote ?? '')
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const handleSave = async () => {
    if (!uid) return
    setSaving(true)
    try {
      await saveAnchorNote(uid, anchorNote)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const charsLeft = MAX_CHARS - anchorNote.length

  return (
    <div className="pt-[env(safe-area-inset-top)]">
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Personalise your journaling experience.</p>
        </header>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700 border-t-slate-300" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Anchor Note */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Anchor Note</h2>
                {isPro && (
                  <span className="rounded-full bg-[#6d28d9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Pro
                  </span>
                )}
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Add persistent context about yourself — your goals, current life situation, or anything that helps the AI understand you better. This is included in every weekly digest.
              </p>

              {isPro ? (
                <>
                  <textarea
                    value={anchorNote}
                    onChange={(e) => setAnchorNote(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="e.g. I'm a software engineer going through a career change. I value mindfulness and struggle with work-life balance…"
                    rows={5}
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs ${charsLeft < 30 ? 'text-amber-500' : 'text-slate-600'}`}>
                      {charsLeft} characters remaining
                    </span>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  {saved && (
                    <p className="mt-2 text-sm font-medium text-emerald-400">Saved ✓</p>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-center">
                  <p className="mb-3 text-sm text-slate-500">
                    Anchor Note is a Pro feature. Upgrade to personalise your AI digest.
                  </p>
                  <Link
                    href="/upgrade"
                    className="inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
