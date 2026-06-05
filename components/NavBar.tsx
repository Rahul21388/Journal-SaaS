// FILE: components/NavBar.tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history',   label: 'History'   },
  { href: '/digest',    label: 'Digest'    },
]

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null)
    })
    return unsub
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

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

  const mobileLinkClass = (href: string) =>
    `block px-4 py-3 text-sm font-medium transition-colors border-b border-slate-800 ${
      pathname === href
        ? 'bg-slate-800 text-white'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
          📓 DailyJournal
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {label}
            </Link>
          ))}
          {email && (
            <span className="ml-2 text-xs text-slate-500">{email}</span>
          )}
          <button
            onClick={handleSignOut}
            className="ml-2 rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col justify-center gap-1.5 rounded-md p-2 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-5 bg-slate-400 transition-transform duration-200 ${
              menuOpen ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-slate-400 transition-opacity duration-200 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-slate-400 transition-transform duration-200 ${
              menuOpen ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-slate-800 bg-slate-900 md:hidden">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={mobileLinkClass(href)}>
              {label}
            </Link>
          ))}
          {email && (
            <p className="px-4 py-2 text-xs text-slate-600 border-b border-slate-800">
              {email}
            </p>
          )}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
