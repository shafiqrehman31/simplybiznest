import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

export interface QuoteEmailPayload {
  trackingCode: string;
  fullName: string;
  email: string;
  phone: string;
  setupLabel: string;
  jurisdiction: string;
  activity: string;
  visaCount: number;
  estimatedAed: number;
  estimatedUsd: number;
  year2RenewalAed?: number;
  appUrl?: string;
}

export interface QuoteEmailResult {
  delivered: boolean;
  mode: 'smtp' | 'preview';
  trackingCode: string;
  subject: string;
  message: string;
}

function escapeHtml(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHeaderValue(raw: string): string {
  return String(raw).replace(/[\r\n]+/g, ' ').trim();
}

function resolvePublicBaseUrl(appUrl?: string): string {
  const candidate = (appUrl || process.env.APP_URL || 'https://simplybiznest.com').trim();
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.origin;
    }
  } catch {
    // ignore malformed URL
  }
  return 'https://simplybiznest.com';
}

export function buildQuoteEmailTemplate(
  payload: QuoteEmailPayload,
  useCidLogos: boolean
): { subject: string; html: string; text: string } {
  const baseUrl = resolvePublicBaseUrl(payload.appUrl);
  const trackerUrl = `${baseUrl}/#tracker`;

  const headerLogoSrc = useCidLogos
    ? 'cid:sbn-header-logo'
    : `${baseUrl}/assets/aistudio/Simply-Biz-Nest-Logo_466db8b5.png`;
  const footerLogoSrc = useCidLogos
    ? 'cid:sbn-footer-logo'
    : `${baseUrl}/assets/aistudio/Simply-Biz-Nest-Logo-white_388cc198.png`;

  const safeTracking = escapeHtml(payload.trackingCode);
  const safeName = escapeHtml(payload.fullName);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone);
  const safeSetup = escapeHtml(payload.setupLabel);
  const safeJurisdiction = escapeHtml(payload.jurisdiction);
  const safeActivity = escapeHtml(payload.activity);
  const visaText = `${payload.visaCount} ${payload.visaCount === 1 ? 'Residence Visa' : 'Residence Visas'}`;
  const safeAed = `AED ${Number(payload.estimatedAed).toLocaleString()}`;
  const safeUsd = `$${Number(payload.estimatedUsd).toLocaleString()} USD`;
  const safeRenewal =
    payload.year2RenewalAed && payload.year2RenewalAed > 0
      ? `AED ${Number(payload.year2RenewalAed).toLocaleString()} / yr`
      : 'Disclosed prior to authority filing';

  const subject = sanitizeHeaderValue(
    `SimplyBizNest Quote & Tracking ID ${payload.trackingCode} — ${payload.setupLabel}`
  );

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Roboto,Arial,Helvetica,sans-serif;color:#1E293B;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
            <!-- Header with Website Logo -->
            <tr>
              <td style="background-color:#FFFFFF;padding:24px 32px;border-bottom:3px solid #1F65ED;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" valign="middle">
                      <img src="${headerLogoSrc}" alt="simplybiznest.com" height="54" style="display:block;height:54px;width:auto;border:0;" />
                    </td>
                    <td align="right" valign="middle">
                      <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1F65ED;">VIP EXPRESS DESK</span><br />
                      <span style="font-family:'JetBrains Mono',Consolas,monospace;font-size:13px;font-weight:700;color:#0C1A38;">${safeTracking}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Navy Hero & Tracking ID Callout -->
            <tr>
              <td style="background-color:#0C1A38;padding:30px 32px;color:#FFFFFF;">
                <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#93C5FD;">
                  Form Submitted · Application Registered
                </p>
                <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:900;color:#FFFFFF;">
                  Your UAE Company Setup Cost Breakdown
                </h1>
                <p style="margin:0 0 22px 0;font-size:14px;line-height:1.6;color:#CBD5E1;">
                  Dear ${safeName}, thank you for submitting your UAE company formation request with simplybiznest.com. Below is your unique tracking ID and itemized setup estimate.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#13264F;border:1px solid #1F65ED;border-radius:8px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#93C5FD;font-weight:700;">Live Tracking Reference ID</span>
                      <span style="display:block;margin-top:4px;font-family:'JetBrains Mono',Consolas,monospace;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;">${safeTracking}</span>
                      <span style="display:block;margin-top:6px;font-size:12px;color:#CBD5E1;">Current Milestone: <strong style="color:#FFFFFF;">01 · Form Submitted</strong></span>
                    </td>
                    <td align="right" valign="middle" style="padding:16px 20px;">
                      <a href="${escapeHtml(trackerUrl)}" style="display:inline-block;background-color:#1F65ED;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:700;padding:11px 18px;border-radius:6px;">
                        Track Progress Live
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Itemized Request Details -->
            <tr>
              <td style="padding:28px 32px;">
                <h2 style="margin:0 0 14px 0;font-size:16px;font-weight:700;color:#0C1A38;">
                  Submitted Formation Specification
                </h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E2E8F0;border-radius:8px;border-collapse:collapse;">
                  <tr style="background-color:#F8FAFC;">
                    <td style="padding:11px 16px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8F0;width:42%;">Applicant Name</td>
                    <td style="padding:11px 16px;font-size:13px;font-weight:700;color:#0C1A38;border-bottom:1px solid #E2E8F0;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 16px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8F0;">Email Address</td>
                    <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#0C1A38;border-bottom:1px solid #E2E8F0;">${safeEmail}</td>
                  </tr>
                  <tr style="background-color:#F8FAFC;">
                    <td style="padding:11px 16px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8F0;">WhatsApp Contact</td>
                    <td style="padding:11px 16px;font-size:13px;font-family:'JetBrains Mono',Consolas,monospace;color:#0C1A38;border-bottom:1px solid #E2E8F0;">${safePhone}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 16px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8F0;">Selected Setup Package</td>
                    <td style="padding:11px 16px;font-size:13px;font-weight:700;color:#1F65ED;border-bottom:1px solid #E2E8F0;">${safeSetup}</td>
                  </tr>
                  <tr style="background-color:#F8FAFC;">
                    <td style="padding:11px 16px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8F0;">Jurisdiction &amp; Visas</td>
                    <td style="padding:11px 16px;font-size:13px;color:#0C1A38;border-bottom:1px solid #E2E8F0;">${safeJurisdiction} · ${escapeHtml(visaText)}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 16px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8F0;">Primary Activity</td>
                    <td style="padding:11px 16px;font-size:13px;color:#0C1A38;border-bottom:1px solid #E2E8F0;">${safeActivity}</td>
                  </tr>
                  <tr style="background-color:#F8FAFC;">
                    <td style="padding:11px 16px;font-size:13px;color:#475569;border-bottom:1px solid #E2E8F0;">Estimated Year 1 Total</td>
                    <td style="padding:11px 16px;font-size:14px;font-family:'JetBrains Mono',Consolas,monospace;font-weight:700;color:#0C1A38;border-bottom:1px solid #E2E8F0;">${safeAed} <span style="font-weight:400;color:#475569;">(${safeUsd})</span></td>
                  </tr>
                  <tr>
                    <td style="padding:11px 16px;font-size:13px;color:#475569;">Year 2 Renewal Cap</td>
                    <td style="padding:11px 16px;font-size:13px;font-family:'JetBrains Mono',Consolas,monospace;font-weight:600;color:#0C1A38;">${escapeHtml(safeRenewal)}</td>
                  </tr>
                </table>

                <!-- Next Steps -->
                <div style="margin-top:22px;padding:18px 20px;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
                  <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#0C1A38;">Next Steps on Your Application</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                    1. <strong>Form Submitted (Completed):</strong> Your details and Tracking ID (${safeTracking}) are active in our desk.<br />
                    2. <strong>Quote Locked:</strong> A senior formation specialist verifies authority availability and locks your official fee sheet.<br />
                    3. <strong>Passport KYC &amp; 48h E-License:</strong> Once approved, trade name filing, digital license issuance, and banking KYC prep begin.
                  </p>
                </div>

                <p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#475569;">
                  Need to adjust visa counts or business activities? Reply directly to <a href="mailto:info@simplybiznest.com" style="color:#1F65ED;text-decoration:none;font-weight:600;">info@simplybiznest.com</a> with reference <strong>${safeTracking}</strong>.
                </p>
              </td>
            </tr>

            <!-- Dark Navy Footer with White Website Logo -->
            <tr>
              <td style="background-color:#0C1A38;padding:28px 32px;color:#CBD5E1;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" valign="top">
                      <img src="${footerLogoSrc}" alt="simplybiznest.com" height="60" style="display:block;height:60px;width:auto;border:0;margin-bottom:14px;" />
                      <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#FFFFFF;">
                        simplybiznest.com — UAE Company Formation &amp; Corporate Banking Desk
                      </p>
                      <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#CBD5E1;">
                        Official Desk: <a href="mailto:info@simplybiznest.com" style="color:#93C5FD;text-decoration:none;">info@simplybiznest.com</a> &nbsp;|&nbsp; Web: <a href="https://simplybiznest.com" style="color:#93C5FD;text-decoration:none;">https://simplybiznest.com</a>
                      </p>
                      <p style="margin:0;font-size:11px;line-height:1.5;color:#94A3B8;">
                        Regulatory Notice: Trade licenses and residency visas are issued solely by competent UAE authorities. Corporate bank account approval remains subject to independent bank KYC/AML compliance under CBUAE regulations.
                      </p>
                      <p style="margin:12px 0 0 0;font-size:11px;color:#94A3B8;">
                        &copy; ${new Date().getFullYear()} simplybiznest.com. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `simplybiznest.com — UAE Company Setup Cost Breakdown`,
    ``,
    `Tracking ID: ${payload.trackingCode}`,
    `Current Milestone: 01 - Form Submitted`,
    ``,
    `Applicant: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `WhatsApp: ${payload.phone}`,
    `Package: ${payload.setupLabel}`,
    `Jurisdiction & Visas: ${payload.jurisdiction} (${visaText})`,
    `Activity: ${payload.activity}`,
    `Estimated Year 1 Total: AED ${payload.estimatedAed.toLocaleString()} ($${payload.estimatedUsd.toLocaleString()} USD)`,
    `Year 2 Renewal Cap: ${payload.year2RenewalAed ? `AED ${payload.year2RenewalAed.toLocaleString()} / yr` : 'Disclosed prior to authority filing'}`,
    ``,
    `Track your progress live: ${trackerUrl}`,
    `Support: info@simplybiznest.com | https://simplybiznest.com`,
  ].join('\n');

  return { subject, html, text };
}

export async function sendQuoteConfirmationEmail(
  payload: QuoteEmailPayload
): Promise<QuoteEmailResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim() || '';
  const smtpUrl = process.env.SMTP_URL?.trim() || '';
  const smtpHost = process.env.SMTP_HOST?.trim() || '';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER?.trim() || '';
  const smtpPass = process.env.SMTP_PASS?.trim() || '';
  const smtpFrom =
    process.env.SMTP_FROM?.trim() ||
    (smtpUser ? `SimplyBizNest <${smtpUser}>` : 'SimplyBizNest <info@simplybiznest.com>');

  // Option 1: HTTPS Email Delivery via Resend (recommended when cPanel/shared SMTP is blocked)
  if (resendKey) {
    const { subject, html, text } = buildQuoteEmailTemplate(payload, false);
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sanitizeHeaderValue(smtpFrom),
        to: [sanitizeHeaderValue(payload.email)],
        reply_to: 'info@simplybiznest.com',
        subject,
        html,
        text,
      }),
    });
    const resendJson = (await resendRes.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };
    if (!resendRes.ok) {
      throw new Error(resendJson.message || `Resend email API failed (HTTP ${resendRes.status})`);
    }
    return {
      delivered: true,
      mode: 'smtp',
      trackingCode: payload.trackingCode,
      subject,
      message: `Confirmation email with Tracking ID ${payload.trackingCode} sent to ${payload.email}.`,
    };
  }

  const hasSmtp = Boolean(smtpUrl || (smtpHost && smtpUser && smtpPass));
  const { subject, html, text } = buildQuoteEmailTemplate(payload, hasSmtp);

  if (!hasSmtp) {
    return {
      delivered: false,
      mode: 'preview',
      trackingCode: payload.trackingCode,
      subject,
      message:
        'Tracking ID saved. Configure RESEND_API_KEY or SMTP credentials in Secrets for live inbox delivery.',
    };
  }

  const transporter = smtpUrl
    ? nodemailer.createTransport(smtpUrl)
    : nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

  const attachments: Array<{ filename: string; path: string; cid: string }> = [];
  const headerLogoPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/Simply-Biz-Nest-Logo_466db8b5.png'
  );
  const footerLogoPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/Simply-Biz-Nest-Logo-white_388cc198.png'
  );

  if (fs.existsSync(headerLogoPath)) {
    attachments.push({
      filename: 'simplybiznest-logo.png',
      path: headerLogoPath,
      cid: 'sbn-header-logo',
    });
  }
  if (fs.existsSync(footerLogoPath)) {
    attachments.push({
      filename: 'simplybiznest-logo-white.png',
      path: footerLogoPath,
      cid: 'sbn-footer-logo',
    });
  }

  await transporter.sendMail({
    from: sanitizeHeaderValue(smtpFrom),
    to: sanitizeHeaderValue(payload.email),
    replyTo: 'info@simplybiznest.com',
    subject,
    html,
    text,
    attachments,
  });

  return {
    delivered: true,
    mode: 'smtp',
    trackingCode: payload.trackingCode,
    subject,
    message: `Confirmation email with Tracking ID ${payload.trackingCode} sent to ${payload.email}.`,
  };
}
