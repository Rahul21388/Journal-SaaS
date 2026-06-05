// FILE: app/hooks/usePushNotifications.ts
//
// Note: Actual Expo push token acquisition requires a real EAS build —
// it does NOT work in Expo Go or in a browser context.
// Token registration happens in mobile/App.tsx after the app loads.
// This hook exposes the registration function for web-side use if needed.

'use client'

import { auth } from '@/lib/firebase'

export function usePushNotifications() {
  const registerToken = async (
    token: string,
    platform: 'android' | 'ios'
  ): Promise<void> => {
    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) throw new Error('Not authenticated')

    const res = await fetch('/api/register-push-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ token, platform }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? `Registration failed (${res.status})`)
    }
  }

  return { registerToken }
}
