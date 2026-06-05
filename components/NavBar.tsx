// FILE: components/NavBar.tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useEffect, useState } from 'react'

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null)
    })
    return unsub
  }, [])

  const handleSignOut = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  const linkClass = (href: string) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-slate-700 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
          📓 DailyJournal
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/dashboard" className={linkClass('/dashboard')}>
            Dashboard
          </Link>
          <Link href="/history" className={linkClass('/history')}>
            History
          </Link>
          <Link href="/digest" className={linkClass('/digest')}>
            Digest
          </Link>
          {email && (
            <span className="hidden text-xs text-slate-500 md:block ml-2">{email}</span>
          )}
          <button
            onClick={handleSignOut}
            className="ml-2 rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
