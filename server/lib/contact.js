const { sendContactEmail } = require('./email');

function validateContactBody(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const company = typeof body?.company === 'string' ? body.company.trim() : '';

  if (company) {
    return { ok: false, status: 400, body: { error: 'Invalid submission' } };
  }
  if (!name || name.length > 100) {
    return { ok: false, status: 400, body: { error: 'Name is required (max 100 characters)' } };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, body: { error: 'Valid email is required' } };
  }
  if (!message || message.length < 10) {
    return { ok: false, status: 400, body: { error: 'Message must be at least 10 characters' } };
  }
  if (message.length > 2000) {
    return { ok: false, status: 400, body: { error: 'Message must be at most 2000 characters' } };
  }

  return { ok: true, data: { name, email, message } };
}

async function submitContact(body) {
  const validated = validateContactBody(body);
  if (!validated.ok) return validated;

  const contactEmail = process.env.CONTACT_EMAIL?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey || !contactEmail) {
    const missing = [
      !resendKey && 'RESEND_API_KEY',
      !contactEmail && 'CONTACT_EMAIL',
    ].filter(Boolean);
    const devHint =
      process.env.NODE_ENV !== 'production' && !process.env.VERCEL
        ? ` Add ${missing.join(' and ')} to server/.env (see server/.env.example).`
        : '';
    return {
      ok: false,
      status: 503,
      body: {
        error: `Contact form is not configured on the server yet.${devHint}`,
      },
    };
  }

  const result = await sendContactEmail(validated.data);
  if (!result.ok) {
    if (result.skipped) {
      return {
        ok: false,
        status: 503,
        body: { error: 'Contact form is not configured on the server yet' },
      };
    }
    return {
      ok: false,
      status: 502,
      body: { error: 'Could not send your message. Try again later.' },
    };
  }

  return {
    ok: true,
    status: 200,
    body: { message: 'Thanks — we received your message.' },
  };
}

module.exports = { validateContactBody, submitContact };
