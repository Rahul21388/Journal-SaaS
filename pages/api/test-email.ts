// FILE: pages/api/test-email.ts
//
// TODO: Remove this route before going to production.
// It is intentionally unauthenticated for easy local template testing.

import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const SAMPLE_DIGEST = `This week you showed up consistently and wrote with real honesty. From Monday's reflections on work pressure to Thursday's quiet moment of gratitude in the garden, there was a clear arc of moving through difficulty toward something steadier. You gave yourself permission to feel the hard things without getting stuck in them.

Your mood shifted noticeably as the week progressed — starting with a couple of tougher days marked by frustration and fatigue, then lifting toward the middle and end of the week. That shift didn't seem accidental. It tracked closely with the moments you described stepping away from screens, spending time outside, and reconnecting with people you care about. Your body and mind seem to respond well to those small resets.

Two themes ran through almost every entry this week: the tension between wanting to do more and needing to rest, and a quiet but recurring question about whether the work you're doing still feels meaningful. These aren't new themes for you, but you wrote about them with more curiosity this week than frustration, which feels significant.

What would it look like to treat rest not as something you earn after productivity, but as a practice that makes everything else possible?`

type SuccessResponse = { success: true; id: string }
type ErrorResponse = { success: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { to } = req.body as { to?: string }
  if (!to || !to.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid "to" email address is required' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY is not configured' })
  }

  const resend = new Resend(apiKey)
  const weekLabel = 'Week of 2 June – 8 June 2026'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mydiary.rahulprakash.co.in'

  const paragraphs = SAMPLE_DIGEST.split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 20px 0;font-size:17px;line-height:1.8;color:#cbd5e1;">${p}</p>`
    )
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Your Weekly Journal Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020617;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          <tr>
            <td style="padding-bottom:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">📓 DailyJournal</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Weekly Digest</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding-bottom:32px;"><div style="height:1px;background-color:#1e293b;"></div></td></tr>
          <tr><td style="padding-bottom:8px;"><p style="margin:0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6366f1;">Your Weekly AI Digest</p></td></tr>
          <tr><td style="padding-bottom:6px;"><h1 style="margin:0;font-size:26px;font-weight:700;color:#f1f5f9;line-height:1.3;">${weekLabel}</h1></td></tr>
          <tr><td style="padding-bottom:36px;"><p style="margin:0;font-size:14px;color:#475569;">Based on 5 entries this week</p></td></tr>
          <tr>
            <td style="padding-bottom:36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:32px;">
                <tr><td>${paragraphs}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <a href="${appUrl}/digest" style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;">View Full Digest →</a>
            </td>
          </tr>
          <tr><td style="padding-bottom:24px;"><div style="height:1px;background-color:#1e293b;"></div></td></tr>
          <tr>
            <td>
              <p style="margin:0;font-size:12px;color:#334155;text-align:center;line-height:1.7;">
                You're receiving this because you use Daily Journal.<br />Unsubscribe coming soon.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const result = await resend.emails.send({
      from: 'digest@mydiary.rahulprakash.co.in',
      to,
      subject: `[TEST] Your Weekly Journal Digest — ${weekLabel}`,
      html,
      text: SAMPLE_DIGEST,
    })

    if (result.error) {
      return res.status(500).json({ success: false, error: result.error.message })
    }

    return res.status(200).json({ success: true, id: result.data?.id ?? 'sent' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ success: false, error: message })
  }
}
