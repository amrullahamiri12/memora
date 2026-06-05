import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromAddress, isTestSender, emailSendFailureMessage } from '../lib/email.js';

describe('email fromAddress', () => {
  let savedFrom;
  let savedKey;

  beforeEach(() => {
    savedFrom = process.env.EMAIL_FROM;
    savedKey = process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    if (savedFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = savedFrom;
    if (savedKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = savedKey;
    vi.unstubAllGlobals();
  });

  it('defaults to Resend test sender when EMAIL_FROM is unset', () => {
    delete process.env.EMAIL_FROM;
    expect(fromAddress()).toBe('Memora <onboarding@resend.dev>');
  });

  it('wraps bare email addresses', () => {
    process.env.EMAIL_FROM = 'onboarding@resend.dev';
    expect(fromAddress()).toBe('Memora <onboarding@resend.dev>');
  });

  it('strips surrounding quotes from env values', () => {
    process.env.EMAIL_FROM = '"Memora <onboarding@resend.dev>"';
    expect(fromAddress()).toBe('Memora <onboarding@resend.dev>');
  });

  it('detects test sender', () => {
    expect(isTestSender('Memora <onboarding@resend.dev>')).toBe(true);
    expect(isTestSender('Memora <noreply@memora.cards>')).toBe(false);
  });
});

describe('emailSendFailureMessage', () => {
  it('explains test mode recipient limits', () => {
    const message = emailSendFailureMessage({
      ok: false,
      status: 403,
      error: 'You can only send testing emails to your own email address.',
      testModeLimited: true,
    });
    expect(message).toMatch(/Resend test mode/);
  });

  it('includes Resend domain error detail', () => {
    const message = emailSendFailureMessage({
      ok: false,
      status: 403,
      error: 'The memora.cards domain is not verified.',
    });
    expect(message).toMatch(/verify memora.cards/);
    expect(message).toMatch(/memora.cards domain is not verified/);
  });
});

describe('sendEmail domain fallback', () => {
  let savedFrom;
  let savedKey;

  beforeEach(() => {
    savedFrom = process.env.EMAIL_FROM;
    savedKey = process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = 'Memora <noreply@memora.cards>';
    process.env.RESEND_API_KEY = 're_test_key';
  });

  afterEach(() => {
    if (savedFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = savedFrom;
    if (savedKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = savedKey;
    vi.unstubAllGlobals();
  });

  it('retries with test sender after domain rejection', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
      const body = JSON.parse(options.body);
      calls.push(body.from);
      if (body.from.includes('memora.cards')) {
        return {
          ok: false,
          status: 403,
          text: async () =>
            JSON.stringify({ message: 'The memora.cards domain is not verified.' }),
        };
      }
      return { ok: true, text: async () => '{}' };
    }));

    const { sendVerificationEmail } = await import('../lib/email.js');
    const result = await sendVerificationEmail('user@example.com', 'token123');
    expect(result.ok).toBe(true);
    expect(result.usedTestSenderFallback).toBe(true);
    expect(calls).toEqual(['Memora <noreply@memora.cards>', 'Memora <onboarding@resend.dev>']);
  });
});
