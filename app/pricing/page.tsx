// FILE: app/pricing/page.tsx
import Link from 'next/link'
import NavBar from '@/components/NavBar'

const FREE_FEATURES = [
  'Unlimited journal entries',
  'Mood tracking',
  'Basic stats',
  'Export your data',
]

const PRO_FEATURES = [
  'Everything in Free',
  'AI Weekly Digest (Claude AI)',
  'Mood chart & trends',
  '28-day calendar heatmap',
  'Full-text search',
  'Weekly email digest',
  'Push notifications',
  'Priority support',
]

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings at any time. You keep Pro access until the end of your billing period.',
  },
  {
    q: 'Is my journal data private?',
    a: 'Absolutely. Your entries are stored securely in Firestore, protected by your account credentials. AI digests are generated on-demand and never stored by third parties.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major credit and debit cards, UPI, and net banking via Razorpay (India) or Stripe (global).',
  },
]

export default function PricingPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-16">
        {/* Heading */}
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-bold text-white">Simple, honest pricing</h1>
          <p className="mt-3 text-slate-400">Start free. Upgrade when you want more insight.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Free</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold text-white">₹0</span>
              <span className="mb-1 text-sm text-slate-500">/ forever</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Everything you need to build a journaling habit.</p>

            <ul className="mt-8 flex flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="text-slate-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="mt-10 rounded-xl border border-slate-700 py-2.5 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl border-2 border-indigo-600 bg-slate-900 p-8">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Most Popular
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-400">Pro</p>
            <div className="mt-4">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-white">₹199</span>
                <span className="mb-1 text-sm text-slate-500">/ month</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">or $3.99 / month · cancel anytime</p>
            </div>
            <p className="mt-2 text-sm text-slate-500">Full AI-powered journaling with deep insights.</p>

            <ul className="mt-8 flex flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="text-indigo-400">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="mt-10 rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Frequently asked questions</h2>
          <div className="flex flex-col gap-6">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-5">
                <p className="font-semibold text-white">{q}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-center text-xs text-slate-600">
          Questions? Email us at{' '}
          <a href="mailto:support@mydiary.rahulprakash.co.in" className="text-slate-400 hover:text-white">
            support@mydiary.rahulprakash.co.in
          </a>
        </p>
      </main>
    </>
  )
}
