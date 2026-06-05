import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fromAddress,
  isTestSender,
  resolveFromAddress,
  resetDomainCacheForTests,
  emailSendFailureMessage,
} from '../lib/email.js';

describe('email fromAddress', () => {
  let savedFrom;
  let savedKey;

  beforeEach(() => {
    savedFrom = process.env.EMAIL_FROM;
    savedKey = process.env.RESEND_API_KEY;
    resetDomainCacheForTests();
  });

  afterEach(() => {
    if (savedFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = savedFrom;
    if (savedKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = savedKey;
    vi.unstubAllGlobals();
    resetDomainCacheForTests();
  });

  it('defaults to Resend test sender when EMAIL_FROM is unset', () => {
    delete process.env.EMAIL_FROM;
    expect(fromAddress()).toBe('Memora <onboarding@resend.dev>');
  });

  it('wraps bare email addresses', () => {
    process.env.EMAIL_FROM = 'onboarding@resend.dev';
    expect(fromAddress()).toBe('Memora <onboarding@resend.dev>');
  });

  it('detects test sender', () => {
    expect(isTestSender('Memora <onboarding@resend.dev>')).toBe(true);
    expect(isTestSender('Memora <noreply@memora.cards>')).toBe(false);
  });

  it('uses custom domain when Resend reports memora.cards verified', async () => {
    process.env.EMAIL_FROM = 'Memora <onboarding@resend.dev>';
    process.env.RESEND_API_KEY = 're_test_key';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes('/domains')) {
          return {
            ok: true,
            json: async () => ({
              data: [{ name: 'memora.cards', status: 'verified' }],
            }),
          };
        }
        return { ok: true, json: async () => ({}) };
      })
    );

    await expect(resolveFromAddress()).resolves.toBe('Memora <noreply@memora.cards>');
  });

  it('uses test sender when domain is not verified and EMAIL_FROM is custom', async () => {
    process.env.EMAIL_FROM = 'Memora <noreply@memora.cards>';
    process.env.RESEND_API_KEY = 're_test_key';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: [{ name: 'memora.cards', status: 'pending' }],
        }),
      }))
    );

    await expect(resolveFromAddress()).resolves.toBe('Memora <onboarding@resend.dev>');
  });
});

describe('emailSendFailureMessage', () => {
  it('points to domain verification instead of blaming the recipient', () => {
    const message = emailSendFailureMessage({
      ok: false,
      status: 403,
      error: 'You can only send testing emails to your own email address.',
      testModeLimited: true,
    });
    expect(message).toMatch(/Verify memora\.cards/);
    expect(message).not.toMatch(/Sign up with that address/);
  });
});

describe('sendVerificationEmail', () => {
  let savedFrom;
  let savedKey;

  beforeEach(() => {
    savedFrom = process.env.EMAIL_FROM;
    savedKey = process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = 'Memora <onboarding@resend.dev>';
    process.env.RESEND_API_KEY = 're_test_key';
    resetDomainCacheForTests();
  });

  afterEach(() => {
    if (savedFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = savedFrom;
    if (savedKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = savedKey;
    vi.unstubAllGlobals();
    resetDomainCacheForTests();
  });

  it('sends from noreply@memora.cards when domain is verified', async () => {
    const calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, options) => {
        if (String(url).includes('/domains')) {
          return {
            ok: true,
            json: async () => ({
              data: [{ name: 'memora.cards', status: 'verified' }],
            }),
          };
        }
        calls.push(JSON.parse(options.body).from);
        return { ok: true, text: async () => '{}' };
      })
    );

    const { sendVerificationEmail } = await import('../lib/email.js');
    const result = await sendVerificationEmail('user@example.com', 'token123');
    expect(result.ok).toBe(true);
    expect(calls).toEqual(['Memora <noreply@memora.cards>']);
  });
});
