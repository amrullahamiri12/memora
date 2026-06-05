function appUrl() {
  return (process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
}

function fromAddress() {
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured) return configured;
  return 'Memora <onboarding@resend.dev>';
}

function formatResendError(text) {
  if (!text) return 'Email provider rejected the request';
  try {
    const data = JSON.parse(text);
    return data.message || data.error || text;
  } catch {
    return text.slice(0, 200);
  }
}

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — email not sent:', subject, '→', to);
    return { ok: false, skipped: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const message = formatResendError(text);
    console.error('[email] Resend error:', res.status, message);
    return { ok: false, status: res.status, error: message };
  }
  return { ok: true };
}

async function sendVerificationEmail(to, token) {
  const link = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Welcome to Memora!</p>
    <p><a href="${link}">Verify your email</a> to start studying (link expires in 24 hours).</p>
    <p>If you did not create an account, you can ignore this email.</p>
  `;
  return sendEmail({ to, subject: 'Verify your Memora email', html });
}

async function sendPasswordResetEmail(to, token) {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `
    <p>You requested a password reset for Memora.</p>
    <p><a href="${link}">Reset your password</a> (link expires in 1 hour).</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;
  return sendEmail({ to, subject: 'Reset your Memora password', html });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendContactEmail({ name, email, message }) {
  const to = process.env.CONTACT_EMAIL?.trim();
  if (!to) {
    return { ok: false, skipped: true, reason: 'contact_not_configured' };
  }

  const html = `
    <p><strong>New contact form submission</strong></p>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, skipped: true, reason: 'email_not_configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      reply_to: [email],
      subject: `Memora contact: ${name}`.slice(0, 120),
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const errMsg = formatResendError(text);
    console.error('[email] Contact Resend error:', res.status, errMsg);
    return { ok: false, status: res.status, error: errMsg };
  }
  return { ok: true };
}

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function emailSendFailureMessage(emailResult) {
  if (!emailResult) return 'Could not send email. Try again later.';
  if (emailResult.skipped) return 'Email delivery is not configured on the server';
  const msg = emailResult.error || '';
  if (emailResult.status === 403 && /domain|verify|not verified/i.test(msg)) {
    return 'Email domain is not verified in Resend yet. Use onboarding@resend.dev or verify memora.cards in Resend.';
  }
  if (/only send.*your own email|testing emails/i.test(msg)) {
    return 'Resend test mode: add and verify memora.cards in Resend, or send to your Resend account email only.';
  }
  return msg || 'Could not send email. Try again later.';
}

module.exports = {
  appUrl,
  isEmailConfigured,
  formatResendError,
  emailSendFailureMessage,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactEmail,
};
