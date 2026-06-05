// FILE: lib/userProfile.ts
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { UserProfile, Plan } from './types'

export async function ensureUserProfile(
  uid: string,
  email: string
): Promise<UserProfile> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    // Update email + updatedAt in case email changed
    await setDoc(
      ref,
      { email, updatedAt: Timestamp.now() },
      { merge: true }
    )
    return snap.data() as UserProfile
  }

  // First login — create profile with free plan
  const now = Timestamp.now()
  const profile: UserProfile = {
    uid,
    email,
    plan: 'free',
    createdAt: now,
    updatedAt: now,
  }
  await setDoc(ref, profile, { merge: true })
  return profile
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

export async function updateUserPlan(
  uid: string,
  plan: Plan,
  subscriptionData?: Partial<UserProfile>
): Promise<void> {
  const ref = doc(db, 'users', uid)
  await setDoc(
    ref,
    { plan, updatedAt: Timestamp.now(), ...subscriptionData },
    { merge: true }
  )
}
