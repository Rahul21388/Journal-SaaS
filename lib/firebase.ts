// FILE: lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Guard: only initialise Firebase in the browser.
// During Next.js SSR/prerender, this module is imported server-side where
// env vars may be absent. All actual Firebase calls are inside useEffect /
// event handlers so the null placeholder is never used at runtime.
const app =
  typeof window !== 'undefined'
    ? getApps().length
      ? getApp()
      : initializeApp(firebaseConfig)
    : null

export const auth = app
  ? getAuth(app)
  : (null as unknown as ReturnType<typeof getAuth>)

export const db = app
  ? getFirestore(app)
  : (null as unknown as ReturnType<typeof getFirestore>)
