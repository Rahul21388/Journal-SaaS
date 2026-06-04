// FILE: lib/firestore.ts
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible'

export interface Entry {
  uid: string
  date: string
  content: string
  mood: Mood
  createdAt: Timestamp
  updatedAt: Timestamp
}

export async function saveEntry(
  uid: string,
  date: string,
  content: string,
  mood: Mood
): Promise<void> {
  const ref = doc(db, 'users', uid, 'entries', date)
  const existing = await getDoc(ref)

  const now = Timestamp.now()

  if (existing.exists()) {
    await setDoc(
      ref,
      {
        content,
        mood,
        updatedAt: now,
      },
      { merge: true }
    )
  } else {
    await setDoc(
      ref,
      {
        uid,
        date,
        content,
        mood,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    )
  }
}

export async function getEntry(uid: string, date: string): Promise<Entry | null> {
  const ref = doc(db, 'users', uid, 'entries', date)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as Entry
}

export async function getEntries(uid: string): Promise<Entry[]> {
  const ref = collection(db, 'users', uid, 'entries')
  const q = query(ref, orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Entry)
}
