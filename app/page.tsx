// FILE: app/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ── Fade-in hook using IntersectionObserver ─────────────────────────────── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ── Data ────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '📝',
    title: 'Daily journaling',
    desc: 'One entry per day. Simple, focused, distraction-free.',
    pro: false,
  },
  {
    icon: '🤖',
    title: 'AI weekly digest',
    desc: `Claude reads your week and reflects it back — patterns you'd never notice yourself.`,
    pro: true,
  },
  {
    icon: '📊',
    title: 'Mood trends',
    desc: 'Track how you feel over time with a beautiful mood chart.',
    pro: true,
  },
  {
    icon: '🗓️',
    title: 'Calendar heatmap',
    desc: 'See your journaling streak at a glance across 28 days.',
    pro: true,
  },
  {
    icon: '🔍',
    title: 'Full-text search',
    desc: 'Find any memory, thought, or moment instantly.',
    pro: true,
  },
  {
    icon: '📧',
    title: 'Email + push digest',
    desc: 'Your weekly insight delivered to your inbox and phone.',
    pro: true,
  },
]

const STEPS = [
  {
    icon: '✍️',
    title: 'Write',
    desc: 'Open the app, write about your day. Takes 2 minutes.',
  },
  {
    icon: '🤖',
    title: 'Claude analyses',
    desc: 'Every Sunday, AI reads your entries and finds patterns.',
  },
  {
    icon: '💡',
    title: 'Get insights',
    desc: 'Receive a personal digest with mood trends and reflections.',
  },
]

const FREE_FEATURES = [
  'Unlimited journal entries',
  'Entry history',
  'Basic stats',
]

const PRO_FEATURES = [
  'Everything in Free',
  'AI weekly digest (Claude)',
  'Mood chart + calendar heatmap',
  'Full-text search',
  'Email + push notifications',
  'Priority support',
]

/* ── Public Navbar ───────────────────────────────────────────────────────── */
function PublicNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-800 bg-slate-950/95 backdrop-blur'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white tracking-tight">
          <span className="text-2xl">📓</span>
          Daily Journal
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Mock journal card shown in hero ─────────────────────────────────────── */
function MockJournalCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-2xl shadow-indigo-950/40 backdrop-blur">
      {/* Entry header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sunday, 22 June 2026</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-300">Today's entry</p>
        </div>
        <span className="rounded-full border border-teal-800 bg-teal-950 px-2.5 py-0.5 text-xs font-medium text-teal-400">
          🙂 Good
        </span>
      </div>

      {/* Mock entry text */}
      <p className="text-sm leading-relaxed text-slate-400">
        Had a productive morning — finished the feature I've been stuck on for days.
        Took a walk after lunch which helped clear my head. Feeling more balanced
        than earlier this week…
      </p>

      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-sm">✨</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">AI Insight · Week of 16 Jun</p>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">
          This week you moved from frustration to flow. Physical breaks consistently
          lifted your mood — your body knows what your mind forgets.
        </p>
      </div>
    </div>
  )
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24 pb-16">
      {/* Animated gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139,92,246,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-16 lg:flex-row lg:gap-12">
        {/* Left — text */}
        <div className="flex-1 text-center lg:text-left">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-800/60 bg-indigo-950/50 px-4 py-1.5 text-xs font-medium text-indigo-300"
            style={{ animation: 'fadeUp 0.5s ease 0ms both' }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Powered by Claude AI
          </div>

          <h1
            className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ animation: 'fadeUp 0.5s ease 100ms both' }}
          >
            Your journal.{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Your patterns.
            </span>
            <br />
            Powered by AI.
          </h1>

          <p
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400"
            style={{ animation: 'fadeUp 0.5s ease 200ms both' }}
          >
            Write every day. Every Sunday, Claude AI analyses your week and sends
            you a personal digest — mood trends, patterns, and gentle insights.
          </p>

          <div
            className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start"
            style={{ animation: 'fadeUp 0.5s ease 300ms both' }}
          >
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 hover:shadow-indigo-800/50"
            >
              Start journaling free
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              See how it works
            </a>
          </div>

          <p
            className="mt-5 text-xs text-slate-600"
            style={{ animation: 'fadeUp 0.5s ease 400ms both' }}
          >
            Free forever · No credit card required
          </p>
        </div>

        {/* Right — mock card */}
        <div
          className="flex-1 flex justify-center lg:justify-end"
          style={{ animation: 'fadeUp 0.6s ease 350ms both' }}
        >
          <MockJournalCard />
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}

/* ── Features ─────────────────────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Everything you need to understand yourself
          </h2>
          <p className="mt-3 text-slate-500">Built around one simple habit: write daily.</p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 80}>
              <div className="group relative flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-700 hover:bg-slate-900">
                <div className="mb-4 flex items-start justify-between">
                  <span className="text-3xl">{f.icon}</span>
                  {f.pro && (
                    <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-800">
                      Pro
                    </span>
                  )}
                </div>
                <p className="mb-2 font-semibold text-white">{f.title}</p>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How it works ─────────────────────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            As simple as keeping a diary
          </h2>
          <p className="mt-3 text-slate-500">Three steps. That's it.</p>
        </FadeIn>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-0">
          {/* Connector line — desktop only */}
          <div
            className="pointer-events-none absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px lg:block"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(99,102,241,0.4) 20%, rgba(99,102,241,0.4) 80%, transparent)',
            }}
          />

          {STEPS.map((step, i) => (
            <FadeIn key={step.title} delay={i * 120} className="flex-1">
              <div className="flex flex-col items-center text-center px-4">
                {/* Circle */}
                <div className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-800/50 bg-indigo-950/60 text-4xl shadow-lg shadow-indigo-950/40">
                  {step.icon}
                  <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <p className="mb-2 text-lg font-semibold text-white">{step.title}</p>
                <p className="text-sm leading-relaxed text-slate-500 max-w-xs">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ──────────────────────────────────────────────────────────────── */
function Pricing() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <FadeIn className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-3 text-slate-500">Start free. Upgrade when you're ready for insights.</p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
          {/* Free */}
          <FadeIn delay={0} className="h-full">
            <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900 p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Free</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="mb-1 text-sm text-slate-500">/ forever</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Everything you need to build the habit.</p>

              <div className="flex-1">
                <ul className="mt-8 flex flex-col gap-3">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <span className="text-slate-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-8">
                <Link
                  href="/login"
                  className="block rounded-xl border border-slate-700 py-2.5 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Get started free
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Pro */}
          <FadeIn delay={100} className="h-full">
            <div className="relative flex flex-col h-full rounded-2xl border-2 border-indigo-600 bg-slate-900 p-8">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Most Popular
              </div>

              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-400">Pro</p>
              <div className="mt-4">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">₹199</span>
                  <span className="mb-1 text-sm text-slate-500">/ month</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">Annual plan coming soon</p>
              </div>
              <p className="mt-2 text-sm text-slate-500">Full AI-powered journaling with deep insights.</p>

              <div className="flex-1">
                <ul className="mt-8 flex flex-col gap-3">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <span className="text-indigo-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-8">
                <Link
                  href="/upgrade"
                  className="block rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Upgrade to Pro
                </Link>
                <p className="mt-3 text-center text-xs text-slate-600">
                  Secure payment via Razorpay · Cancel anytime
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ── CTA banner ───────────────────────────────────────────────────────────── */
function CTABanner() {
  return (
    <section className="px-6 py-20">
      <FadeIn>
        <div
          className="mx-auto max-w-3xl rounded-2xl border border-indigo-800/40 p-12 text-center"
          style={{
            background:
              'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }}
        >
          <p className="text-4xl mb-4">📓</p>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Start your journaling habit today
          </h2>
          <p className="mt-3 text-slate-400">
            Free forever. AI insights when you're ready.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500"
          >
            Get started — it's free
          </Link>
          <p className="mt-3 text-xs text-slate-600">No credit card · No commitment</p>
        </div>
      </FadeIn>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-slate-800 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="flex items-center gap-2 font-semibold text-white">
              <span>📓</span> Daily Journal + AI Insights
            </p>
            <p className="mt-1 text-xs text-slate-600">Built with ❤️ in India</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="transition hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="transition hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-700">
          © 2026 Daily Journal. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useEffect(() => {
    document.title = 'Daily Journal + AI Insights — Your journal. Your patterns. Powered by AI.'
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 pt-[env(safe-area-inset-top)] text-slate-100" style={{ scrollBehavior: 'smooth' }}>
      <PublicNav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTABanner />
      <Footer />
    </div>
  )
}
