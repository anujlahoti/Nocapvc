/**
 * ORB1T — Firebase Cloud Functions
 *
 * onWaitlistApproved: fires when admin sets waitlist doc status → 'approved'
 * Sends a personalised "You're in orbit" email via Resend.
 *
 * Setup (one-time):
 *   firebase functions:secrets:set RESEND_API_KEY
 *   (paste your Resend API key when prompted)
 *
 * Deploy:
 *   firebase deploy --only functions --project nocapvc-school
 *
 * Requires Firebase Blaze (pay-as-you-go) plan.
 */

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret }      = require('firebase-functions/params');
const { initializeApp }     = require('firebase-admin/app');
const { Resend }            = require('resend');

initializeApp();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

// ─────────────────────────────────────────────
//  Email template
// ─────────────────────────────────────────────

function buildWelcomeEmail(name) {
  const onboardingUrl = 'https://nocapvc.in/founder-space/onboarding';

  return {
    subject: `You're in orbit, ${name.split(' ')[0]}.`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're in ORB1T</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:900;letter-spacing:0.06em;color:#e8e8f0;">
                ORB<span style="color:#f5c842;">1</span>T
              </div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#13131f;border:1px solid rgba(245,200,66,0.15);border-radius:16px;padding:40px 36px;">

              <!-- Orbit ring decoration -->
              <div style="text-align:center;margin-bottom:32px;">
                <div style="display:inline-block;width:64px;height:64px;border-radius:50%;border:2px solid rgba(245,200,66,0.3);position:relative;">
                  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:radial-gradient(circle,#fff9e0,#f5c842);"></div>
                </div>
              </div>

              <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#e8e8f0;line-height:1.2;text-align:center;">
                You're in orbit, ${name.split(' ')[0]}.
              </h1>

              <p style="margin:0 0 24px;font-size:15px;color:rgba(232,232,240,0.6);line-height:1.7;text-align:center;">
                Your application to ORB1T has been approved.<br/>
                The orbit is now yours to create.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${onboardingUrl}"
                   style="display:inline-block;background:#f5c842;color:#0a0a0f;text-decoration:none;
                          padding:14px 32px;border-radius:8px;font-weight:800;font-size:14px;
                          letter-spacing:0.08em;text-transform:uppercase;font-family:'Courier New',monospace;">
                  Create your orbit →
                </a>
              </div>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(245,200,66,0.2),transparent);margin:28px 0;"></div>

              <!-- What's next -->
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(245,200,66,0.6);font-family:'Courier New',monospace;">
                What happens next
              </p>
              <ul style="margin:0;padding:0 0 0 16px;color:rgba(232,232,240,0.5);font-size:13px;line-height:2;">
                <li>Set up your builder profile (takes 3 minutes)</li>
                <li>Post your first signal — an idea, a journey, or a project</li>
                <li>Find people building things that pull you into orbit</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(232,232,240,0.25);font-family:'Courier New',monospace;letter-spacing:0.1em;">
                ORB1T · nocapvc.in/orb1t<br/>
                You're receiving this because you applied to join ORB1T.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

// ─────────────────────────────────────────────
//  Cloud Function
// ─────────────────────────────────────────────

exports.onWaitlistApproved = onDocumentUpdated(
  {
    document: 'waitlist/{applicationId}',
    secrets:  [RESEND_API_KEY],
  },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();

    // Only fire when status transitions to 'approved'
    if (before.status === after.status || after.status !== 'approved') return null;

    const { name, email } = after;
    if (!email) {
      console.warn('onWaitlistApproved: no email on doc', event.params.applicationId);
      return null;
    }

    const resend  = new Resend(RESEND_API_KEY.value());
    const { subject, html } = buildWelcomeEmail(name || 'Builder');

    try {
      const result = await resend.emails.send({
        from:    'ORB1T <noreply@nocapvc.in>',
        to:      email,
        subject,
        html,
      });
      console.log('Welcome email sent:', result.id, '→', email);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    return null;
  }
);
