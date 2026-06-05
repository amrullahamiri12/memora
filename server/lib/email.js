function appUrl() {
  return (process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
}

const RESEND_TEST_FROM = 'Memora <onboarding@resend.dev>';

function normalizeEnvValue(value) {
  let v = (value ?? '').trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function resendApiKey() {
  return normalizeEnvValue(process.env.RESEND_API_KEY);
}

function fromAddress() {
  const configured = normalizeEnvValue(process.env.EMAIL_FROM);
  if (!configured) return RESEND_TEST_FROM;
  if (configured.includes('@') && !configured.includes('<')) {
    return `Memora <${configured}>`;
  }
  return configured;
}

function isTestSender(from) {
  return /onboarding@resend\.dev/i.test(from || '');
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

function isDomainVerificationError(result) {
  return (
    result?.status === 403 && /domain|verify|not verified/i.test(result.error || '')
  );
}

function isTestModeRecipientError(result) {
  return /only send.*your own email|testing emails|not allowed to send/i.test(
    result?.error || ''
  );
}

async function postResendEmail(key, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'User-Agent': 'memora/1.0',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    const message = formatResendError(text);
    return { ok: false, status: res.status, error: message, from: payload.from };
  }
  return { ok: true, from: payload.from };
}

async function sendWithResend({ to, subject, html, replyTo }) {
  const key = resendApiKey();
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — email not sent:', subject, '→', to);
    return { ok: false, skipped: true };
  }

  const primaryFrom = fromAddress();
  const payload = {
    from: primaryFrom,
    to: [to],
    subject,
    html,
    ...(replyTo ? { reply_to: [replyTo] } : {}),
  };

  let result = await postResendEmail(key, payload);

  if (!result.ok && isDomainVerificationError(result) && !isTestSender(primaryFrom)) {
    console.warn(
      `[email] Domain rejection for "${primaryFrom}" — retrying with ${RESEND_TEST_FROM}`
    );
    result = await postResendEmail(key, { ...payload, from: RESEND_TEST_FROM });
    if (result.ok) {
      result.usedTestSenderFallback = true;
    }
  }

  if (!result.ok) {
    console.error(
      '[email] Resend error:',
      result.status,
      result.error,
      `(from: ${result.from || primaryFrom})`
    );
    if (isTestModeRecipientError(result)) {
      result.testModeLimited = true;
    }
  }
  return result;
}

async function sendEmail({ to, subject, html }) {
  return sendWithResend({ to, subject, html });
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
  const to = normalizeEnvValue(process.env.CONTACT_EMAIL);
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

  return sendWithResend({
    to,
    subject: `Memora contact: ${name}`.slice(0, 120),
    html,
    replyTo: email,
  });
}

function isEmailConfigured() {
  return Boolean(resendApiKey());
}

function emailSendFailureMessage(emailResult) {
  if (!emailResult) return 'Could not send email. Try again later.';
  if (emailResult.skipped) return 'Email delivery is not configured on the server';

  const msg = emailResult.error || '';

  if (emailResult.testModeLimited || isTestModeRecipientError(emailResult)) {
    return (
      'Resend test mode only delivers to the email on your Resend account. ' +
      'Sign up with that address, or verify memora.cards in Resend to email anyone.'
    );
  }

  if (isDomainVerificationError(emailResult)) {
    return (
      'Resend rejected the sender domain. Set EMAIL_FROM to Memora <onboarding@resend.dev> ' +
      'on Vercel and redeploy, or verify memora.cards in Resend. ' +
      `(Resend: ${msg})`
    );
  }

  return msg || 'Could not send email. Try again later.';
}

module.exports = {
  appUrl,
  isEmailConfigured,
  fromAddress,
  isTestSender,
  formatResendError,
  emailSendFailureMessage,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactEmail,
};
