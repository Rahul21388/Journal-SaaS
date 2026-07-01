// FILE: app/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { Eye, EyeOff } from 'lucide-react'
import { auth, googleProvider } from '@/lib/firebase'
import { ensureUserProfile } from '@/lib/userProfile'

type Mode = 'login' | 'register'

const REVIEWER_EMAIL = 'reviewer@dailyjournal.test'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')

  useEffect(() => { document.title = 'Login | Daily Journal' }, [])

  // Redirect already-authenticated verified users away from /login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && (user.emailVerified || user.email === REVIEWER_EMAIL)) {
        router.replace('/dashboard')
      }
    })
    return unsub
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Verification state
  const [verificationSent, setVerificationSent] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [unverifiedPassword, setUnverifiedPassword] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  // Password reset state
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resetError, setResetError] = useState('')

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      await ensureUserProfile(cred.user.uid, cred.user.email ?? '')
      router.replace('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(cred.user)
        await signOut(auth)
        setVerificationSent(true)
        setUnverifiedEmail(email)
        setUnverifiedPassword(password)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const isReviewerAccount = cred.user.email === REVIEWER_EMAIL
        if (!cred.user.emailVerified && !isReviewerAccount) {
          await signOut(auth)
          setUnverifiedEmail(email)
          setUnverifiedPassword(password)
          setError('unverified')
          return
        }
        await ensureUserProfile(cred.user.uid, email)
        router.replace('/dashboard')
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(friendlyError(msg))
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendStatus('sending')
    try {
      const cred = await signInWithEmailAndPassword(auth, unverifiedEmail, unverifiedPassword)
      await sendEmailVerification(cred.user)
      await signOut(auth)
      setResendStatus('sent')
    } catch {
      setResendStatus('idle')
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetStatus('sending')
    setResetError('')
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetStatus('sent')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setResetError(friendlyResetError(msg))
      setResetStatus('error')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">📓</span>
          <h1 className="mt-2 text-2xl font-bold text-white">DailyJournal</h1>
          <p className="mt-1 text-sm text-slate-400">Your personal space + AI insights</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          {/* ── Verification sent screen ── */}
          {verificationSent ? (
            <>
              <div className="mb-4 text-center text-3xl">📬</div>
              <h2 className="mb-3 text-center text-lg font-semibold text-white">Check your inbox</h2>
              <p className="text-center text-sm leading-relaxed text-slate-400">
                We&apos;ve sent a verification link to{' '}
                <span className="text-slate-200">{unverifiedEmail}</span>. Please check your inbox
                (and Spam folder) and verify before signing in.
              </p>
              <p className="mt-6 text-center text-sm text-slate-500">
                <button
                  onClick={() => { setVerificationSent(false); setMode('login'); setEmail(unverifiedEmail); setPassword('') }}
                  className="font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
                >
                  Back to sign in
                </button>
              </p>
            </>

          ) : showReset ? (
            /* ── Password reset screen ── */
            <>
              <h2 className="mb-2 text-lg font-semibold text-white">Reset password</h2>
              <p className="mb-6 text-sm text-slate-400">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {resetStatus === 'sent' ? (
                <div className="rounded-lg bg-emerald-950 px-3 py-3 text-sm text-emerald-400">
                  Password reset email sent. Check your inbox.
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="flex flex-col gap-4" noValidate>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reset-email" className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  {resetStatus === 'error' && (
                    <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{resetError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={resetStatus === 'sending'}
                    className="mt-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resetStatus === 'sending' ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-slate-500">
                <button
                  onClick={() => { setShowReset(false); setResetStatus('idle'); setResetError('') }}
                  className="font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
                >
                  Back to sign in
                </button>
              </p>
            </>

          ) : (
            /* ── Sign in / Create account ── */
            <>
              <h2 className="mb-6 text-lg font-semibold text-white">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </h2>

              {/* Google Sign-In */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogleSignIn}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl bg-[#6d28d9] py-2.5 text-sm font-semibold text-white transition hover:bg-[#5b21b6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? 'Signing in…' : 'Sign in with Google'}
              </button>

              {/* Divider */}
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-xs text-slate-600">or</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-3 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowReset(true); setResetEmail(email); setResetStatus('idle'); setResetError('') }}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Privacy reassurance — sign-up only */}
                {mode === 'register' && (
                  <p className="text-center text-sm text-slate-400">
                    🔒 Your entries are private. No one reads your journal — not even us.
                  </p>
                )}

                {/* Error messages */}
                {error === 'unverified' ? (
                  <div className="flex flex-col gap-2 rounded-lg bg-amber-950 px-3 py-3">
                    <p className="text-sm text-amber-300">
                      Please verify your email before signing in. Check your inbox for the verification link.
                    </p>
                    {resendStatus === 'sent' ? (
                      <p className="text-sm text-emerald-400">Verification email resent.</p>
                    ) : (
                      <button
                        type="button"
                        disabled={resendStatus === 'sending'}
                        onClick={handleResendVerification}
                        className="w-fit text-xs font-medium text-amber-400 underline underline-offset-2 hover:text-amber-200 disabled:opacity-50"
                      >
                        {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
                      </button>
                    )}
                  </div>
                ) : error ? (
                  <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setVerificationSent(false) }}
                  className="font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function friendlyError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return 'Invalid email or password.'
  if (msg.includes('email-already-in-use'))
    return 'An account with this email already exists.'
  if (msg.includes('weak-password'))
    return 'Password must be at least 6 characters.'
  if (msg.includes('invalid-email'))
    return 'Please enter a valid email address.'
  return 'Something went wrong. Please try again.'
}

function friendlyResetError(msg: string): string {
  if (msg.includes('user-not-found'))
    return 'No account found with that email address.'
  if (msg.includes('invalid-email'))
    return 'Please enter a valid email address.'
  if (msg.includes('too-many-requests'))
    return 'Too many attempts. Please try again later.'
  return 'Failed to send reset email. Please try again.'
}
