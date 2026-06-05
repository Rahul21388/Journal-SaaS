// FILE: pages/api/test-push.ts
//
// TODO: Remove this route before going to production.
// Unauthenticated by design — for local push template testing only.

import type { NextApiRequest, NextApiResponse } from 'next'
import { Expo } from 'expo-server-sdk'

const expo = new Expo()

type SuccessResponse = { success: true; ticketId: string }
type ErrorResponse = { success: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { token } = req.body as { token?: string }

  if (!token) {
    return res.status(400).json({ success: false, error: '"token" is required' })
  }

  if (!Expo.isExpoPushToken(token)) {
    return res.status(400).json({ success: false, error: 'Invalid Expo push token format' })
  }

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([
      {
        to: token,
        sound: 'default',
        title: '📔 Your Weekly Digest is Ready',
        body: 'Your AI-powered journal reflection for this week is here. (test)',
        data: { screen: 'digest', test: true },
        channelId: 'digest',
      },
    ])

    if (ticket.status === 'error') {
      return res
        .status(500)
        .json({ success: false, error: ticket.message ?? 'Expo push failed' })
    }

    return res.status(200).json({ success: true, ticketId: ticket.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ success: false, error: message })
  }
}
