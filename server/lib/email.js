function appUrl() {
  return (process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
}

function fromAddress() {
  return process.env.EMAIL_FROM || 'Memora <onboarding@resend.dev>';
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
    console.error('[email] Resend error:', res.status, text);
    return { ok: false, error: text };
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

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

module.exports = {
  appUrl,
  isEmailConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
