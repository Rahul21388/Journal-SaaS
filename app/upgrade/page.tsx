// FILE: app/upgrade/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { loadRazorpayScript } from '@/lib/razorpay'
import type { RazorpayResponse } from '@/lib/razorpay'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import Link from 'next/link'

const PRO_FEATURES = [
  'AI Weekly Digest powered by Claude',
  'Mood chart & 28-day calendar heatmap',
  'Full-text search across all entries',
  'Weekly email digest',
  'Push notifications',
  'Priority support',
]

export default function UpgradePage() {
  return (
    <AuthGuard>
      <UpgradeFlow />
    </AuthGuard>
  )
}

type Step = 'idle' | 'creating' | 'checkout' | 'verifying' | 'success' | 'error' | 'cancelled'

function UpgradeFlow() {
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { document.title = 'Upgrade to Pro | Daily Journal' }, [])

  const handleUpgrade = async () => {
    setStep('creating')
    setErrorMsg('')

    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('Not authenticated')

      // 1. Create Razorpay subscription
      const subRes = await fetch('/api/razorpay-create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plan: 'monthly' }),
      })

      if (!subRes.ok) {
        const err = await subRes.json()
        throw new Error(err.error ?? 'Failed to create subscription')
      }

      const { subscriptionId } = await subRes.json() as { subscriptionId: string }

      // 2. Load Razorpay script
      setStep('checkout')
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load payment gateway. Please try again.')

      // 3. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const user = auth.currentUser
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
          subscription_id: subscriptionId,
          name: 'DailyJournal',
          description: 'Pro Monthly — ₹199/month',
          prefill: {
            email: user?.email ?? '',
          },
          theme: { color: '#6366f1' },
          handler: async (response: RazorpayResponse) => {
            // 4. Verify payment on server
            setStep('verifying')
            try {
              const freshToken = await auth.currentUser?.getIdToken()
              const verifyRes = await fetch('/api/verify-razorpay-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${freshToken}`,
                },
                body: JSON.stringify(response),
              })
              if (!verifyRes.ok) {
                const err = await verifyRes.json()
                throw new Error(err.error ?? 'Payment verification failed')
              }
              setStep('success')
              resolve()
            } catch (e) {
              reject(e)
            }
          },
          modal: {
            ondismiss: () => {
              setStep('cancelled')
              resolve()
            },
          },
        })
        rzp.open()
      })
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStep('error')
    }
  }

  if (step === 'success') {
    return (
      <>
        <NavBar />
        <SuccessScreen />
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border-2 border-indigo-600 bg-slate-900 p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="text-4xl">✨</span>
            <h1 className="mt-3 text-2xl font-bold text-white">Upgrade to Pro</h1>
            <div className="mt-3 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-white">₹199</span>
              <span className="text-slate-500">/ month</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">Cancel anytime</p>
          </div>

          {/* Features */}
          <ul className="mb-8 flex flex-col gap-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="text-indigo-400">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          {step === 'cancelled' ? (
            <div className="flex flex-col gap-3">
              <p className="rounded-lg bg-slate-800 px-4 py-3 text-center text-sm text-slate-400">
                Payment cancelled. You can try again whenever you&apos;re ready.
              </p>
              <button
                onClick={handleUpgrade}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Try again
              </button>
            </div>
          ) : step === 'error' ? (
            <div className="flex flex-col gap-3">
              <p className="rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-400">
                {errorMsg}
              </p>
              <button
                onClick={handleUpgrade}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Retry
              </button>
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={step !== 'idle'}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step === 'creating' && 'Preparing checkout…'}
              {step === 'checkout' && 'Opening payment…'}
              {step === 'verifying' && 'Verifying payment…'}
              {step === 'idle' && 'Pay with Razorpay'}
            </button>
          )}

          <p className="mt-4 text-center text-xs text-slate-600">
            Secure payment via Razorpay · UPI, cards &amp; net banking accepted
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/pricing" className="hover:text-slate-400">
            ← Back to pricing
          </Link>
        </p>
      </main>
    </>
  )
}

function SuccessScreen() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      {/* CSS-only confetti burst */}
      <div className="relative mx-auto mb-8 h-24 w-24">
        <span className="text-6xl">🎉</span>
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full confetti-dot"
            style={{
              background: ['#6366f1','#34d399','#f59e0b','#f472b6','#38bdf8','#a78bfa','#fb923c','#4ade80'][i],
              top: '50%',
              left: '50%',
              // Pass the rotation angle as a CSS custom property used by the keyframe
              ['--r' as string]: `${i * 45}deg`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>

      <style>{`
        .confetti-dot {
          opacity: 0;
          animation: confetti-pop 0.7s ease-out forwards;
        }
        @keyframes confetti-pop {
          0%   { transform: rotate(var(--r)) translate(0px) scale(0); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: rotate(var(--r)) translate(55px) scale(1); opacity: 0; }
        }
      `}</style>

      <h1 className="text-3xl font-bold text-white">You&apos;re now Pro! 🎉</h1>
      <p className="mt-3 text-slate-400">
        All Pro features are unlocked. Your AI Weekly Digest is waiting.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/digest"
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Generate your first digest
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
