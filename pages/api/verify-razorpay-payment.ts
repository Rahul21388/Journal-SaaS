// FILE: pages/api/verify-razorpay-payment.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify Firebase ID token
  const auth_header = req.headers.authorization ?? ''
  const token = auth_header.startsWith('Bearer ') ? auth_header.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Missing auth token' })

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' })
  }

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body as {
    razorpay_payment_id?: string
    razorpay_subscription_id?: string
    razorpay_signature?: string
  }

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields' })
  }

  // Verify signature: HMAC SHA256 of "payment_id|subscription_id"
  const secret = process.env.RAZORPAY_KEY_SECRET ?? ''
  const message = `${razorpay_payment_id}|${razorpay_subscription_id}`
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))) {
    return res.status(400).json({ error: 'Invalid payment signature' })
  }

  // Signature valid — upgrade user to Pro immediately
  await adminDb.collection('users').doc(uid).set(
    {
      plan: 'pro',
      subscriptionStatus: 'active',
      subscriptionId: razorpay_subscription_id,
      billingRegion: 'india',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  return res.status(200).json({ success: true })
}
