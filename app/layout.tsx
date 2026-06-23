// FILE: app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import PostHogProvider from './posthog-provider'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mydiary.rahulprakash.co.in'

export const metadata: Metadata = {
  title: {
    default: 'DailyJournal — Your private journal with AI insights',
    template: '%s · DailyJournal',
  },
  description: 'Your private journal with AI-powered weekly insights',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'DailyJournal — Your private journal with AI insights',
    description: 'Your private journal with AI-powered weekly insights',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
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
