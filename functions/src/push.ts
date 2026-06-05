// FILE: functions/src/push.ts
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'

const expo = new Expo({ useFcmV1: true })

export interface PushNotificationParams {
  expoPushToken: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function sendPushNotification(params: PushNotificationParams): Promise<void> {
  const { expoPushToken, title, body, data } = params

  if (!Expo.isExpoPushToken(expoPushToken)) {
    throw new Error(`Invalid Expo push token: ${expoPushToken}`)
  }

  const message: ExpoPushMessage = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data ?? {},
    priority: 'normal',
    channelId: 'digest',
  }

  const [ticket] = await expo.sendPushNotificationsAsync([message])
  logTicket(expoPushToken, ticket)
}

export async function sendPushNotificationBatch(
  notifications: PushNotificationParams[]
): Promise<void> {
  // Filter invalid tokens up-front
  const valid = notifications.filter(({ expoPushToken }) => {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.warn(`[push] Skipping invalid token: ${expoPushToken}`)
      return false
    }
    return true
  })

  if (valid.length === 0) return

  const messages: ExpoPushMessage[] = valid.map(({ expoPushToken, title, body, data }) => ({
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data ?? {},
    priority: 'normal',
    channelId: 'digest',
  }))

  // Expo recommends chunks of ≤ 100
  const chunks = expo.chunkPushNotifications(messages)
  const tickets: ExpoPushTicket[] = []

  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk)
      tickets.push(...chunkTickets)
    } catch (err) {
      console.error('[push] Chunk send failed:', err)
    }
  }

  tickets.forEach((ticket, i) => {
    logTicket(valid[i]?.expoPushToken ?? 'unknown', ticket)
  })
}

function logTicket(token: string, ticket: ExpoPushTicket): void {
  if (ticket.status === 'ok') {
    console.log(`[push] Sent to ${token.slice(-8)} — receipt id: ${ticket.id}`)
  } else {
    console.error(
      `[push] Failed for ${token.slice(-8)} — ${ticket.message}`,
      ticket.details ?? ''
    )
  }
}
