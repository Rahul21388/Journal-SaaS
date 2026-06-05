// FILE: app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    })
    return unsub
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-slate-200" />
    </div>
  )
}
