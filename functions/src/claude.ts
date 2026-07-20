// Standalone copy of lib/claude.ts for Firebase Functions.
// Functions cannot import from the Next.js lib/ directory.
//
// ANTHROPIC_API_KEY must be set as a Firebase secret:
//   firebase functions:secrets:set ANTHROPIC_API_KEY
// Then add `runWith({ secrets: ["ANTHROPIC_API_KEY"] })` to the function (already done in index.ts).
// For local emulation, add it to functions/.env:
//   ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from '@anthropic-ai/sdk'

export interface Entry {
  uid: string
  date: string
  content: string
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  tags?: string[]
  deleted?: boolean
}

type Mood = Entry['mood']

const MOOD_LABEL: Record<Mood, string> = {
  great: 'Great', good: 'Good', neutral: 'Neutral', bad: 'Bad', terrible: 'Terrible',
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey })
}

export async function generateDigest(entries: Entry[], anchorNote?: string): Promise<string> {
  if (entries.length === 0) {
    return 'No entries found for this week.'
  }

  const entryText = entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const d = new Date(e.date)
      const dateLabel = d.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
      const tagLine = e.tags && e.tags.length > 0 ? `\nTags: ${e.tags.join(', ')}` : ''
      return `Date: ${dateLabel}\nMood: ${MOOD_LABEL[e.mood]}${tagLine}\nEntry:\n${e.content}`
    })
    .join('\n\n---\n\n')

  const anchorSection = anchorNote?.trim()
    ? `\nCONTEXT ABOUT THIS PERSON:\n${anchorNote.trim()}\n`
    : ''

  const prompt = `You are a warm, insightful journaling companion. Below are someone's journal entries from the past week. Read them carefully and write a weekly digest for them.
${anchorSection}
JOURNAL ENTRIES:
${entryText}

Write the digest in second person ("You had...", "You seem to..."). Be warm, empathetic, and genuinely insightful — not generic. Keep it between 300 and 400 words total.

Structure the digest exactly in this order, as flowing prose paragraphs (no headers, no bullet points, no markdown):

1. Weekly Summary: A 2-3 sentence overview of how their week went overall.
2. Mood Patterns: What patterns or shifts you notice in their mood across the week.
3. Key Themes: Recurring topics, concerns, or ideas that came up in their writing.
4. Reflection Question: End with one single thoughtful question for them to sit with.

Return plain text only. No headers. No dashes. No asterisks. Just paragraphs.`

  const client = getClient()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude API')
  return block.text.trim()
}
