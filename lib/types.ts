// FILE: lib/types.ts
import type { Timestamp } from 'firebase/firestore'

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible'

export interface Entry {
  uid: string
  date: string
  content: string
  mood: Mood
  createdAt: Timestamp
  updatedAt: Timestamp
  deleted?: boolean
}

export type Plan = 'free' | 'pro'
export type BillingRegion = 'india' | 'global'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing'

export interface UserProfile {
  uid: string
  email: string
  plan: Plan
  billingRegion?: BillingRegion
  subscriptionStatus?: SubscriptionStatus
  subscriptionId?: string
  currentPeriodEnd?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
