// FILE: app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import PostHogProvider from './posthog-provider'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://daily-journal-ai.vercel.app'

export const metadata: Metadata = {
  title: 'Daily Journal + AI Insights',
  description: 'Your private journal with AI-powered weekly insights',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Daily Journal + AI Insights',
    description: 'Your private journal with AI-powered weekly insights',
    type: 'website',
  },
  themeColor: '#0f172a',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
