// FILE: pages/api/razorpay-create-subscription.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

const RAZORPAY_API = 'https://api.razorpay.com/v1'

function razorpayAuth(): string {
  const key = process.env.RAZORPAY_KEY_ID ?? ''
  const secret = process.env.RAZORPAY_KEY_SECRET ?? ''
  return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify Firebase ID token
  const auth_header = req.headers.authorization ?? ''
  const token = auth_header.startsWith('Bearer ') ? auth_header.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Missing auth token' })

  let uid: string
  let email: string
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
    email = decoded.email ?? ''
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' })
  }

  // Check user isn't already Pro
  const userRef = adminDb.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const profile = userSnap.data()
  if (profile?.plan === 'pro') {
    return res.status(400).json({ error: 'Already a Pro subscriber' })
  }

  const planId = process.env.RAZORPAY_PLAN_ID_INR
  if (!planId) return res.status(500).json({ error: 'Razorpay plan not configured' })

  // Create subscription via Razorpay API
  try {
    const response = await fetch(`${RAZORPAY_API}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: razorpayAuth(),
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: { uid, email },
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Razorpay create subscription error:', err)
      return res.status(502).json({ error: 'Failed to create subscription' })
    }

    const data = await response.json()
    return res.status(200).json({ subscriptionId: data.id })
  } catch (err) {
    console.error('Razorpay API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
