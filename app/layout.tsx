// FILE: app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import PostHogProvider from './posthog-provider'

export const metadata: Metadata = {
  title: 'Daily Journal + AI Insights',
  description: 'Your personal journaling space with AI-powered weekly digests.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
