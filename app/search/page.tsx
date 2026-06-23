// FILE: app/search/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { auth } from '@/lib/firebase'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useUserProfile } from '@/app/hooks/useUserProfile'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

interface SearchResult {
  date: string
  content: string
  mood: string
  excerpt: string
}

const MOOD_BADGE: Record<string, string> = {
  great:    'bg-emerald-950 text-emerald-400 border border-emerald-800',
  good:     'bg-teal-950 text-teal-400 border border-teal-800',
  neutral:  'bg-slate-800 text-slate-400 border border-slate-700',
  bad:      'bg-orange-950 text-orange-400 border border-orange-800',
  terrible: 'bg-red-950 text-red-400 border border-red-800',
}

const MOOD_EMOJI: Record<string, string> = {
  great: '😄', good: '🙂', neutral: '😐', bad: '😔', terrible: '😢',
}

export default function SearchPage() {
  return (
    <AuthGuard>
      <SearchView />
    </AuthGuard>
  )
}

function SearchView() {
  const { features, loading: profileLoading } = useUserProfile()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 3) {
      setResults([])
      setSearched(false)
      setError(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      runSearch(query.trim())
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const runSearch = async (q: string) => {
    setSearching(true)
    setError(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/search-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: q }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? `Error ${res.status}`)
      }

      const data = await res.json() as { results: SearchResult[] }
      setResults(data.results)
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  // Show loading while profile resolves
  if (profileLoading) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700 border-t-slate-300" />
          </div>
        </main>
      </>
    )
  }

  // Free plan gate
  if (!features.fullTextSearch) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white">Search</h1>
            <p className="mt-1 text-sm text-slate-500">Find any moment in your journal.</p>
          </header>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <span className="text-5xl">🔍</span>
            <div>
              <p className="text-xl font-semibold text-white">Full-text search is a Pro feature</p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Search across all your journal entries instantly. Find any memory, mood, or moment.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><span className="text-indigo-400">✓</span> Search by word or phrase</li>
              <li className="flex items-center gap-2"><span className="text-indigo-400">✓</span> Highlighted excerpts around matches</li>
              <li className="flex items-center gap-2"><span className="text-indigo-400">✓</span> Results sorted newest first</li>
            </ul>
            <p className="text-sm text-slate-500">Available on Pro — ₹199/month or $3.99/month</p>
            <Link
              href="/upgrade"
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Upgrade to Pro
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Search</h1>
          <p className="mt-1 text-sm text-slate-500">Find any moment in your journal.</p>
        </header>

        {/* Search input */}
        <div className="relative mb-8">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your entries… (min. 3 characters)"
            autoFocus
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
          {searching && (
            <span className="absolute inset-y-0 right-4 flex items-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300" />
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Hint */}
        {!searched && !searching && query.length === 0 && (
          <p className="text-center text-sm text-slate-600">
            Type at least 3 characters to search your journal.
          </p>
        )}

        {query.trim().length > 0 && query.trim().length < 3 && (
          <p className="text-center text-sm text-slate-600">
            Keep typing… ({3 - query.trim().length} more character{3 - query.trim().length !== 1 ? 's' : ''})
          </p>
        )}

        {/* No results */}
        {searched && !searching && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-3 text-slate-400">No entries found for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-600">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>
            {results.map((r) => (
              <ResultCard key={r.date} result={r} query={query.trim()} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  let dateLabel = result.date
  try {
    dateLabel = format(parseISO(result.date), 'EEEE, d MMMM yyyy')
  } catch { /* keep raw date */ }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-300">{dateLabel}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${MOOD_BADGE[result.mood] ?? MOOD_BADGE.neutral}`}
        >
          {MOOD_EMOJI[result.mood] ?? '😐'} {result.mood}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-400">
        <HighlightedExcerpt excerpt={result.excerpt} query={query} />
      </p>
    </div>
  )
}

function HighlightedExcerpt({ excerpt, query }: { excerpt: string; query: string }) {
  if (!query) return <>{excerpt}</>

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = excerpt.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded bg-yellow-400/20 px-0.5 text-yellow-300 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
