// FILE: pages/api/razorpay-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// Raw body required for signature verification
export const config = { api: { bodyParser: false } }

function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function updateUser(uid: string, data: Record<string, unknown>) {
  await adminDb.collection('users').doc(uid).set(
    { ...data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await readRawBody(req)
  const signature = req.headers['x-razorpay-signature'] as string | undefined

  if (!signature) return res.status(400).json({ error: 'Missing signature' })

  // Verify webhook signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody.toString('utf-8'))
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const event = payload.event as string
  const entity = (payload.payload as Record<string, unknown>)

  try {
    if (event === 'subscription.activated') {
      const sub = (entity.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
      const uid = (sub?.notes as Record<string, string>)?.uid
      if (uid) {
        await updateUser(uid, {
          plan: 'pro',
          subscriptionStatus: 'active',
          subscriptionId: sub.id,
          billingRegion: 'india',
        })
      }
    } else if (event === 'subscription.charged') {
      const sub = (entity.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
      const uid = (sub?.notes as Record<string, string>)?.uid
      if (uid && sub?.current_end) {
        // current_end is a Unix timestamp (seconds)
        const endDate = new Date((sub.current_end as number) * 1000)
        await updateUser(uid, {
          subscriptionStatus: 'active',
          currentPeriodEnd: endDate,
        })
      }
    } else if (event === 'subscription.cancelled') {
      const sub = (entity.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
      const uid = (sub?.notes as Record<string, string>)?.uid
      if (uid) {
        await updateUser(uid, { subscriptionStatus: 'cancelled' })
      }
    } else if (event === 'subscription.completed') {
      const sub = (entity.subscription as Record<string, unknown>)?.entity as Record<string, unknown>
      const uid = (sub?.notes as Record<string, string>)?.uid
      if (uid) {
        await updateUser(uid, { plan: 'free', subscriptionStatus: 'expired' })
      }
    } else if (event === 'payment.failed') {
      // Log only — do not change plan
      const payment = (entity.payment as Record<string, unknown>)?.entity as Record<string, unknown>
      console.error('Razorpay payment.failed:', payment?.id, payment?.error_description)
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event}:`, err)
    // Still return 200 so Razorpay doesn't retry endlessly for internal errors
  }

  return res.status(200).json({ received: true })
}
