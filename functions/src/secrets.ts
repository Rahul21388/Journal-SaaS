// FILE: functions/src/secrets.ts
//
// Required Firebase Secrets (set via Google Cloud Secret Manager):
//   firebase secrets:set ANTHROPIC_API_KEY
//   firebase secrets:set RESEND_API_KEY
//
// For local emulator, create functions/.env:
//   ANTHROPIC_API_KEY=sk-ant-...
//   RESEND_API_KEY=re_...
//   APP_URL=http://localhost:3000

export const APP_URL = process.env.APP_URL ?? 'https://mydiary.rahulprakash.co.in'
