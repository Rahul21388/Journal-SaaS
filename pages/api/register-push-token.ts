// FILE: pages/api/register-push-token.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// Expo push token format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxx]
const EXPO_TOKEN_RE = /^ExponentPushToken\[.+\]$/

type SuccessResponse = { success: true }
type ErrorResponse = { success: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing Authorization header' })
  }

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7))
    uid = decoded.uid
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  const { token, platform } = req.body as {
    token?: string
    platform?: string
  }

  if (!token || !EXPO_TOKEN_RE.test(token)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing Expo push token',
    })
  }

  if (platform !== 'android' && platform !== 'ios') {
    return res.status(400).json({
      success: false,
      error: 'platform must be "android" or "ios"',
    })
  }

  // ── Save to Firestore ─────────────────────────────────────────────────────
  try {
    await adminDb
      .collection('users')
      .doc(uid)
      .collection('meta')
      .doc('pushToken')
      .set({
        token,
        platform,
        updatedAt: FieldValue.serverTimestamp(),
      })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[register-push-token] Firestore write failed:', err)
    return res.status(500).json({ success: false, error: 'Failed to save push token' })
  }
}
