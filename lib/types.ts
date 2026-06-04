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
