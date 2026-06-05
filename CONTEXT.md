# Daily Journal + AI Insights — Build Context

## Current Status
- Phase: Phase 1 — Foundation + Phase 2 — AI & Monetisation
- Last completed task: Day 11 code complete — Razorpay KYC pending
- Next task: Day 11 finish — Complete Razorpay Video KYC → create plan + keys → test upgrade flow
- Start date: 4th June 2026

---

## Build Progress

| Day | Task | Status | Completed On |
|-----|------|--------|--------------|
| 1 | Emergent scaffold | ✅ Done | 5th June 2026 |
| 2 | Firestore schema + CRUD | ✅ Done | 5th June 2026 |
| 3 | Entry history + mood tag | ✅ Done | 5th June 2026 |
| 4 | Deploy to Vercel + Android shell | ✅ Done | 5th June 2026 |
| 5 | Claude API digest route | ✅ Done | 5th June 2026 |
| 6 | Digest UI in app | ✅ Done | 5th June 2026 |
| 7 | Weekly cron (Firebase) | ✅ Done | 5th June 2026 |
| 8 | Email digest via Resend | ✅ Done | 5th June 2026 |
| 9 | Push notifications (Android) | ✅ Done | 5th June 2026 |
| 10 | Subscription schema + feature gating | ✅ Done | 5th June 2026 |
| 11 | Razorpay INR billing | 🔄 In Progress | Code done, KYC pending |
| 12 | Stripe USD billing | Not Started | |
| 13 | Full-text search (Pro) | Not Started | |
| 14 | End-to-end QA | Not Started | |
| 15 | Landing page | Not Started | |
| 16 | Play Store submission | Not Started | |
| 17 | Launch channels (ProductHunt, Reddit, YouTube) | Not Started | |
| 18 | First users + feedback loop | Not Started | |

---

## Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| ✅ Milestone 1 (Day 4) | Core app live on web + Android shell | ✅ Reached — 5th June 2026 |
| ✅ Milestone 2 (Day 9) | AI digest working end-to-end, email + push delivered | ✅ Reached — 5th June 2026 |
| ✅ Milestone 3 (Day 14) | Billing live, app ready for real users | 🔄 In Progress |
| ✅ Milestone 4 (Day 18) | App public, first users onboarding | Not Reached |

---

## Product Decisions (Locked)

- **Product name:** Daily Journal + AI Insights (final name TBD)
- **Platform:** Web (Next.js) + Android (React Native Expo)
- **Monetisation:** Free tier + Pro subscription
- **Pricing — India:** ₹199/month via Razorpay
- **Pricing — Global:** $3.99/month or $34.99/year via Stripe
- **AI engine:** Anthropic Claude API (model: claude-sonnet-4-20250514)
- **Database:** Firestore — schema: users/{uid}/entries/{date}, users/{uid}/digests/{weekId}
- **Auth:** Firebase Auth (email/password)
- **Email:** Resend (free tier — 3,000 emails/month)
- **Push notifications:** Expo Push + FCM (API ready, EAS build deferred to Day 16)
- **Hosting:** Vercel (Next.js), Expo EAS (Android)
- **Search:** Client-side at MVP scale — no Algolia
- **Entry rule:** One entry per calendar day, enforced at DB level
- **AI digest schedule:** Cloud Function cron — every Sunday 8 PM IST
- **Feature gate:** plan field on user doc — "free" | "pro"
- **Pro features:** AI weekly digest, mood chart, full-text search, unlimited history

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Web frontend | Next.js + Tailwind CSS |
| Mobile | React Native Expo (WebView shell → native screens later) |
| Auth | Firebase Auth (email/password) |
| Database | Firestore |
| AI | Anthropic Claude API |
| AI trigger | Firebase Cloud Functions (scheduled cron) |
| INR billing | Razorpay Subscriptions |
| USD billing | Stripe Checkout |
| Email | Resend |
| Hosting | Vercel |
| Push notifications | Expo Push + FCM |
| Analytics | PostHog (free tier) |
| Build tool | EAS (Expo Application Services) |

---

## Repo & Services Registry

| Service | URL / ID | Status |
|---------|----------|--------|
| GitHub repo | https://github.com/Rahul21388/Journal-SaaS | ✅ Live |
| Firebase project ID | daily-journal-ai-3b3c4 | ✅ Active |
| Vercel URL | https://mydiary.rahulprakash.co.in | ✅ Live |
| Custom domain | https://mydiary.rahulprakash.co.in | ✅ Live |
| Razorpay dashboard | rzp_test keys obtained | 🔄 KYC pending |
| Stripe dashboard | [ADD] | Not Set Up |
| Resend domain | mydiary.rahulprakash.co.in | ✅ Active |
| Anthropic API key | Set in Vercel + Firebase Secret Manager | ✅ Active |
| Firebase Functions | weeklyDigestCron + generateDigestHttp | ✅ Deployed |
| Play Console app | [ADD] | Not Created |
| PostHog project | Project ID: 454043 | ✅ Active |

---

## Known Issues / Blockers

| Issue | Status |
|-------|--------|
| Android shell — Expo SDK version conflicts on Windows | Deferred to Day 16 (EAS build) |
| Razorpay Video KYC required before live keys | Complete tomorrow before Day 11 finish |
| Push token registration — requires EAS build, not Expo Go | Deferred to Day 16 |
| Node.js 22 vs Firebase Functions Node 20 engine warning | Non-blocking — functions deploy and run fine |

---

## Feature Gating (Implemented Day 10)

| Feature | Free | Pro |
|---------|------|-----|
| Daily journal entries | ✅ | ✅ |
| Entry history | ✅ | ✅ |
| Basic stats (StatsBar) | ✅ | ✅ |
| AI Weekly Digest | ❌ | ✅ |
| Mood trend chart | ❌ | ✅ |
| Calendar heatmap | ❌ | ✅ |
| Full-text search | ❌ | ✅ |
| Email digest | ❌ | ✅ |
| Push notifications | ❌ | ✅ |

---

## File Structure

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── history/page.tsx
│   ├── digest/page.tsx
│   ├── pricing/page.tsx
│   ├── upgrade/page.tsx
│   ├── hooks/
│   │   ├── useUserProfile.ts
│   │   └── usePushNotifications.ts
│   └── posthog-provider.tsx
├── components/
│   ├── AuthGuard.tsx
│   ├── EntryEditor.tsx
│   ├── EntryCard.tsx
│   ├── NavBar.tsx
│   ├── Skeleton.tsx
│   ├── MoodChart.tsx
│   ├── CalendarHeatmap.tsx
│   └── StatsBar.tsx
├── lib/
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── firestore.ts
│   ├── claude.ts
│   ├── razorpay.ts
│   ├── types.ts
│   ├── userProfile.ts
│   ├── featureFlags.ts
│   ├── weekId.ts
│   └── formatDigest.ts
├── pages/api/
│   ├── generate-digest.ts
│   ├── razorpay-create-subscription.ts
│   ├── razorpay-webhook.ts
│   ├── verify-razorpay-payment.ts
│   ├── register-push-token.ts
│   ├── test-email.ts
│   └── test-push.ts
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts              # weeklyDigestCron + generateDigestHttp
│   │   ├── claude.ts
│   │   ├── email.ts
│   │   ├── push.ts
│   │   ├── weekId.ts
│   │   └── secrets.ts
│   ├── package.json
│   └── tsconfig.json
├── mobile/                       # Expo app
│   ├── App.tsx
│   ├── app.json
│   └── package.json
├── firestore.rules
├── firebase.json
├── .firebaserc
├── vercel.json
├── .vercelignore
└── CONTEXT.md
```

---

## Session Log

| Date | Session Summary | Left Incomplete |
|------|----------------|-----------------|
| 5th June 2026 | Days 1–10 fully complete. Day 11 code complete. Web app live at mydiary.rahulprakash.co.in. Firebase Functions deployed (cron + email + push). Razorpay billing code ready — blocked on Video KYC. Android shell deferred to Day 16. | Razorpay KYC + plan creation + webhook setup. Day 12 Stripe not started. |
| 4th June 2026 | Build plan finalised. Excel + CONTEXT.md created. Project Instructions drafted. Ready for Day 1. | Emergent scaffold prompt not yet run. |

---

## Tomorrow's Plan (6th June 2026)

1. Complete Razorpay Video KYC
2. Create Razorpay plan (₹199/month) + generate API keys + set up webhook
3. Add all 5 Razorpay env vars to `.env.local` and Vercel
4. Deploy and test upgrade flow at `/upgrade` with test card `4111 1111 1111 1111`
5. Mark Day 11 complete
6. Start Day 12 — Stripe USD billing

---

## Pre-Launch Checklist
- [ ] Razorpay KYC complete + live keys
- [ ] Stripe account created + live keys
- [ ] Razorpay plan created (₹199/month)
- [ ] Stripe product created ($3.99/month + $34.99/year)
- [ ] Webhooks tested end-to-end
- [ ] Pro upgrade flow tested (INR + USD)
- [ ] Full-text search implemented (Day 13)
- [ ] End-to-end QA complete (Day 14)
- [ ] Landing page live (Day 15)
- [ ] Android EAS build + Play Store submission (Day 16)
- [ ] ProductHunt + Reddit launch (Day 17)
- [ ] Domain email set up (digest@mydiary.rahulprakash.co.in)
- [ ] Remove test API routes (test-email.ts, test-push.ts) before launch
- [ ] Razorpay webhook URL updated to production
- [ ] Stripe webhook URL updated to production

---

_Last updated: 5th June 2026 — End of Day 10, Day 11 in progress_
