// FILE: app/upgrade-global/page.tsx
import Link from 'next/link'
import NavBar from '@/components/NavBar'

export default function UpgradeGlobalPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <span className="text-5xl">🌍</span>
        <h1 className="mt-6 text-2xl font-bold text-white">Global billing coming soon</h1>
        <p className="mt-3 text-slate-400">
          Stripe payments for global subscribers are on the way.
          India-based users can subscribe now via Razorpay.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/upgrade"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Pay in ₹ with Razorpay
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            ← Back to pricing
          </Link>
        </div>
      </main>
    </>
  )
}
