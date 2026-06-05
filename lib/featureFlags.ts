// FILE: lib/featureFlags.ts
import type { Plan } from './types'

export interface Features {
  aiDigest: boolean
  moodChart: boolean
  fullTextSearch: boolean
  unlimitedHistory: boolean
  emailDigest: boolean
  pushNotifications: boolean
}

const FREE_FEATURES: Features = {
  aiDigest: false,
  moodChart: false,
  fullTextSearch: false,
  unlimitedHistory: false,
  emailDigest: false,
  pushNotifications: false,
}

const PRO_FEATURES: Features = {
  aiDigest: true,
  moodChart: true,
  fullTextSearch: true,
  unlimitedHistory: true,
  emailDigest: true,
  pushNotifications: true,
}

export function getFeatures(plan: Plan): Features {
  return plan === 'pro' ? PRO_FEATURES : FREE_FEATURES
}

export function isPro(plan: Plan): boolean {
  return plan === 'pro'
}
