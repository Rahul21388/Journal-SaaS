// FILE: lib/firestore.ts
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Entry, Mood } from './types'

export type { Entry, Mood }

export async function saveEntry(
  uid: string,
  date: string,
  content: string,
  mood: Mood,
  tags?: string[]
): Promise<void> {
  const ref = doc(db, 'users', uid, 'entries', date)
  const existing = await getDoc(ref)
  const now = Timestamp.now()
  const tagData = tags !== undefined ? { tags } : {}

  if (existing.exists()) {
    await setDoc(ref, { content, mood, updatedAt: now, ...tagData }, { merge: true })
  } else {
    await setDoc(
      ref,
      { uid, date, content, mood, createdAt: now, updatedAt: now, ...tagData },
      { merge: true }
    )
  }
}

export async function saveAnchorNote(uid: string, anchorNote: string): Promise<void> {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { anchorNote: anchorNote.trim() })
}

export async function getEntry(uid: string, date: string): Promise<Entry | null> {
  const ref = doc(db, 'users', uid, 'entries', date)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as Entry
  if (data.deleted) return null
  return data
}

export async function getEntries(uid: string, limitCount = 50): Promise<Entry[]> {
  const ref = collection(db, 'users', uid, 'entries')
  const q = query(ref, orderBy('date', 'desc'), firestoreLimit(limitCount))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => d.data() as Entry)
    .filter((e) => !e.deleted)
}

export async function deleteEntry(uid: string, date: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'entries', date)
  await setDoc(ref, { deleted: true, updatedAt: Timestamp.now() }, { merge: true })
}
