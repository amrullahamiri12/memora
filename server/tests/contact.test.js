import { describe, expect, it } from 'vitest';
import { validateContactBody } from '../lib/contact.js';

describe('validateContactBody', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    message: 'Hello, I have a question about Memora.',
    company: '',
  };

  it('accepts valid submission', () => {
    const result = validateContactBody(valid);
    expect(result.ok).toBe(true);
    expect(result.data.name).toBe('Jane Doe');
  });

  it('rejects honeypot when filled', () => {
    const result = validateContactBody({ ...valid, company: 'Acme Corp' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('rejects missing name', () => {
    const result = validateContactBody({ ...valid, name: '' });
    expect(result.ok).toBe(false);
    expect(result.body.error).toMatch(/name/i);
  });

  it('rejects invalid email', () => {
    const result = validateContactBody({ ...valid, email: 'not-an-email' });
    expect(result.ok).toBe(false);
    expect(result.body.error).toMatch(/email/i);
  });

  it('rejects short message', () => {
    const result = validateContactBody({ ...valid, message: 'Hi' });
    expect(result.ok).toBe(false);
    expect(result.body.error).toMatch(/10 characters/i);
  });

  it('rejects message over 2000 characters', () => {
    const result = validateContactBody({ ...valid, message: 'x'.repeat(2001) });
    expect(result.ok).toBe(false);
    expect(result.body.error).toMatch(/2000/i);
  });
});
