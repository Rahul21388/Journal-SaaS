// FILE: app/hooks/useUserProfile.ts
'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/userProfile'
import { getFeatures, isPro } from '@/lib/featureFlags'
import type { UserProfile } from '@/lib/types'
import type { Features } from '@/lib/featureFlags'

interface UseUserProfileResult {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isPro: boolean
  features: Features
}

const DEFAULT_FEATURES = getFeatures('free')

export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const p = await getUserProfile(user.uid)
        setProfile(p)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  const plan = profile?.plan ?? 'free'

  return {
    profile,
    loading,
    error,
    isPro: isPro(plan),
    features: getFeatures(plan),
  }
}
