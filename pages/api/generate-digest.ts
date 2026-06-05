// FILE: pages/api/generate-digest.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { generateDigest } from '@/lib/claude'
import { getWeekRange, getWeekIdForDate } from '@/lib/weekId'
import { format } from 'date-fns'
import { FieldValue } from 'firebase-admin/firestore'
import type { Entry, Mood } from '@/lib/types'

const WEEK_ID_RE = /^\d{4}-W\d{2}$/

type SuccessResponse = { digest: string; weekId: string; entryCount: number }
type ErrorResponse = { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }
  const idToken = authHeader.slice(7)

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    uid = decoded.uid
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  const { weekId } = req.body as { weekId?: string }
  if (!weekId || !WEEK_ID_RE.test(weekId)) {
    return res.status(400).json({ error: 'weekId is required and must be in YYYY-WXX format' })
  }

  try {
    // ── Fetch entries for the week ──────────────────────────────────────────
    const { monday, sunday } = getWeekRange(weekId)
    const mondayStr = format(monday, 'yyyy-MM-dd')
    const sundayStr = format(sunday, 'yyyy-MM-dd')

    const snapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('entries')
      .where('date', '>=', mondayStr)
      .where('date', '<=', sundayStr)
      .orderBy('date', 'asc')
      .get()

    // Filter deleted entries client-side to avoid composite index requirement
    const entries: Entry[] = snapshot.docs
      .map((d) => d.data() as Entry)
      .filter((e) => !e.deleted)

    // ── Generate digest via Claude ──────────────────────────────────────────
    const content = await generateDigest(entries)

    // ── Persist digest to Firestore ─────────────────────────────────────────
    const moodSummary: Mood[] = entries.map((e) => e.mood)

    await adminDb
      .collection('users')
      .doc(uid)
      .collection('digests')
      .doc(weekId)
      .set({
        uid,
        weekId,
        content,
        entryCount: entries.length,
        moodSummary,
        createdAt: FieldValue.serverTimestamp(),
      })

    return res.status(200).json({ digest: content, weekId, entryCount: entries.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[generate-digest]', err)
    return res.status(500).json({ error: message })
  }
}
