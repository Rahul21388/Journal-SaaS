import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onRequest } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'
import { generateDigest, type Entry } from './claude'
import { getCurrentWeekId, getWeekRange, formatDateYMD, getWeekIdForDate } from './weekId'

// ── Firebase Admin init (singleton) ──────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp()
}
const db = admin.firestore()
const auth = admin.auth()

// ── Shared digest-save logic ─────────────────────────────────────────────────
async function buildAndSaveDigest(uid: string, weekId: string): Promise<string> {
  const { monday, sunday } = getWeekRange(weekId)
  const mondayStr = formatDateYMD(monday)
  const sundayStr = formatDateYMD(sunday)

  const snap = await db
    .collection('users').doc(uid)
    .collection('entries')
    .where('date', '>=', mondayStr)
    .where('date', '<=', sundayStr)
    .orderBy('date', 'asc')
    .get()

  const entries: Entry[] = snap.docs
    .map((d) => d.data() as Entry)
    .filter((e) => !e.deleted)

  if (entries.length === 0) {
    throw new Error('no_entries')
  }

  const content = await generateDigest(entries)

  await db
    .collection('users').doc(uid)
    .collection('digests').doc(weekId)
    .set({
      uid,
      weekId,
      content,
      entryCount: entries.length,
      moodSummary: entries.map((e) => e.mood),
      createdAt: FieldValue.serverTimestamp(),
    })

  return content
}

// ── Function 1: Weekly scheduled cron ────────────────────────────────────────
// Runs every Sunday at 8:00 PM IST (14:30 UTC)
export const weeklyDigestCron = onSchedule(
  {
    schedule: '30 14 * * 0',   // cron: Sunday 14:30 UTC = 20:00 IST
    timeZone: 'Asia/Kolkata',
    secrets: ['ANTHROPIC_API_KEY'],
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const weekId = getCurrentWeekId()
    console.log(`[weeklyDigestCron] Starting for weekId=${weekId}`)

    // Fetch all user UIDs
    let userIds: string[] = []
    try {
      const usersSnap = await db.collection('users').get()
      userIds = usersSnap.docs.map((d) => d.id)
      console.log(`[weeklyDigestCron] Found ${userIds.length} users`)
    } catch (err) {
      console.error('[weeklyDigestCron] Failed to fetch users:', err)
      return
    }

    let succeeded = 0
    let failed = 0
    let skipped = 0

    const results = await Promise.allSettled(
      userIds.map(async (uid) => {
        // Skip if digest already exists for this week
        const existingSnap = await db
          .collection('users').doc(uid)
          .collection('digests').doc(weekId)
          .get()

        if (existingSnap.exists) {
          console.log(`[weeklyDigestCron] uid=${uid} already has digest for ${weekId}, skipping`)
          return 'skipped'
        }

        await buildAndSaveDigest(uid, weekId)
        console.log(`[weeklyDigestCron] uid=${uid} digest saved`)
        return 'success'
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'skipped') skipped++
        else succeeded++
      } else {
        failed++
        const reason = result.reason as Error
        if (reason?.message !== 'no_entries') {
          console.error('[weeklyDigestCron] user failed:', reason?.message ?? reason)
        } else {
          skipped++ // no entries = skip, not failure
          failed--
        }
      }
    }

    console.log(
      `[weeklyDigestCron] Complete: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped`
    )
  }
)

// ── Function 2: HTTP callable — manual trigger / testing ─────────────────────
export const generateDigestHttp = onRequest(
  {
    secrets: ['ANTHROPIC_API_KEY'],
    memory: '512MiB',
    timeoutSeconds: 120,
    cors: ['https://mydiary.rahulprakash.co.in', 'http://localhost:3000'],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    // ── Verify Firebase Auth token ──────────────────────────────────────────
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Missing Authorization header' })
      return
    }

    let uid: string
    try {
      const decoded = await auth.verifyIdToken(authHeader.slice(7))
      uid = decoded.uid
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' })
      return
    }

    // ── Determine weekId ────────────────────────────────────────────────────
    const body = req.body as { weekId?: string }
    const weekId = body.weekId ?? getCurrentWeekId()

    const WEEK_ID_RE = /^\d{4}-W\d{2}$/
    if (!WEEK_ID_RE.test(weekId)) {
      res.status(400).json({ success: false, error: 'Invalid weekId format (expected YYYY-WXX)' })
      return
    }

    // ── Rate limiting ───────────────────────────────────────────────────────
    const today = formatDateYMD(new Date())
    const rateLimitRef = db
      .collection('users').doc(uid)
      .collection('meta').doc('digestRateLimit')

    try {
      const snap = await rateLimitRef.get()
      const data = snap.data() as { date: string; count: number } | undefined

      if (data && data.date === today && data.count >= 3) {
        res.status(429).json({
          success: false,
          error: 'Daily limit reached. You can generate up to 3 digests per day.',
        })
        return
      }

      // ── Generate ──────────────────────────────────────────────────────────
      const digest = await buildAndSaveDigest(uid, weekId)

      // ── Update rate limit ─────────────────────────────────────────────────
      if (data && data.date === today) {
        await rateLimitRef.update({ count: FieldValue.increment(1) })
      } else {
        await rateLimitRef.set({ date: today, count: 1 })
      }

      console.log(`[generateDigestHttp] uid=${uid} weekId=${weekId} digest generated`)
      res.status(200).json({ success: true, digest, weekId })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal error'
      if (message === 'no_entries') {
        res.status(200).json({
          success: true,
          digest: 'No entries found for this week.',
          weekId,
        })
        return
      }
      console.error('[generateDigestHttp] error:', err)
      res.status(500).json({ success: false, error: message })
    }
  }
)
