// FILE: pages/api/search-entries.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

interface SearchResult {
  date: string
  content: string
  mood: string
  excerpt: string
}

interface ResponseBody {
  results: SearchResult[]
}

interface ErrorBody {
  error: string
}

function buildExcerpt(content: string, query: string): string {
  const lower = content.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, 150) + (content.length > 150 ? '…' : '')

  const RADIUS = 75
  const start = Math.max(0, idx - RADIUS)
  const end = Math.min(content.length, idx + query.length + RADIUS)

  const snippet = content.slice(start, end)
  return (start > 0 ? '…' : '') + snippet + (end < content.length ? '…' : '')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody | ErrorBody>
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify Firebase ID token
  const authHeader = req.headers.authorization ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Missing auth token' })

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' })
  }

  const { query } = req.body as { query?: string }
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({ error: 'Query must be at least 3 characters' })
  }

  const q = query.trim()

  // Check user plan
  const userSnap = await adminDb.collection('users').doc(uid).get()
  if (userSnap.data()?.plan !== 'pro') {
    return res.status(403).json({ error: 'Full-text search is a Pro feature' })
  }

  // Fetch all entries — filter deleted in JS to avoid composite index requirement
  const snap = await adminDb
    .collection('users')
    .doc(uid)
    .collection('entries')
    .get()

  const results: SearchResult[] = []

  for (const doc of snap.docs) {
    const data = doc.data() as {
      content?: string
      mood?: string
      date?: string
      deleted?: boolean
    }

    if (data.deleted === true) continue
    if (!data.content) continue
    if (!data.content.toLowerCase().includes(q.toLowerCase())) continue

    results.push({
      date: data.date ?? doc.id,
      content: data.content,
      mood: data.mood ?? 'neutral',
      excerpt: buildExcerpt(data.content, q),
    })
  }

  // Sort by date descending, cap at 20
  results.sort((a, b) => (a.date < b.date ? 1 : -1))
  const trimmed = results.slice(0, 20)

  return res.status(200).json({ results: trimmed })
}
