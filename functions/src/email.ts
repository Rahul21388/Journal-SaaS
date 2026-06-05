// FILE: functions/src/email.ts
import { Resend } from 'resend'

export interface DigestEmailParams {
  to: string
  weekLabel: string
  digestText: string
  entryCount: number
  weekId: string
  appUrl: string
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

function buildHtml(params: DigestEmailParams): string {
  const { weekLabel, digestText, entryCount, appUrl } = params

  const paragraphs = digestText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 20px 0;font-size:17px;line-height:1.8;color:#cbd5e1;">${escapeHtml(p)}</p>`
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Weekly Journal Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020617;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">
                      📓 DailyJournal
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">
                      Weekly Digest
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="height:1px;background-color:#1e293b;"></div>
            </td>
          </tr>

          <!-- Week label + meta -->
          <tr>
            <td style="padding-bottom:8px;">
              <p style="margin:0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6366f1;">
                Your Weekly AI Digest
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:6px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#f1f5f9;line-height:1.3;">
                ${escapeHtml(weekLabel)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0;font-size:14px;color:#475569;">
                Based on ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} this week
              </p>
            </td>
          </tr>

          <!-- Digest card -->
          <tr>
            <td style="padding-bottom:36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:32px;">
                <tr>
                  <td>
                    ${paragraphs}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <a href="${appUrl}/digest"
                style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;
                       font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;
                       letter-spacing:0.3px;">
                View Full Digest →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="height:1px;background-color:#1e293b;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td>
              <p style="margin:0;font-size:12px;color:#334155;text-align:center;line-height:1.7;">
                You're receiving this because you use Daily Journal.<br />
                Unsubscribe coming soon.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildText(params: DigestEmailParams): string {
  const { weekLabel, digestText, entryCount, appUrl } = params
  return [
    'DAILY JOURNAL — YOUR WEEKLY AI DIGEST',
    '======================================',
    '',
    weekLabel,
    `Based on ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} this week`,
    '',
    '--------------------------------------',
    '',
    digestText,
    '',
    '--------------------------------------',
    '',
    `View your full digest: ${appUrl}/digest`,
    '',
    "You're receiving this because you use Daily Journal. Unsubscribe coming soon.",
  ].join('\n')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendDigestEmail(params: DigestEmailParams): Promise<void> {
  const resend = getResend()

  await resend.emails.send({
    from: 'digest@mydiary.rahulprakash.co.in',
    to: params.to,
    subject: `Your Weekly Journal Digest — ${params.weekLabel}`,
    html: buildHtml(params),
    text: buildText(params),
  })
}
