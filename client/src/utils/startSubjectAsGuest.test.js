import { describe, expect, it, vi } from 'vitest';
import {
  startSubjectAsGuest,
  START_SUBJECT_ERRORS,
} from './startSubjectAsGuest';

const catalog = [
  { id: 'sub-1', name: 'Math', topicCount: 5 },
  { id: 'sub-2', name: 'Science', topicCount: 3 },
];

const learner = { id: 'u1', role: 'USER', emailVerified: true };
const guest = { id: 'g1', role: 'USER', email: 'x@guest.memora.local', isGuest: true };
const admin = { id: 'a1', role: 'ADMIN', emailVerified: true };

function mockApi(handlers = {}) {
  return vi.fn(async (path, opts) => {
    if (handlers[path]) return handlers[path](opts);
    if (path === '/subjects/catalog') return catalog;
    if (path === '/subjects') return handlers.enrolled ?? [];
    if (path === '/subjects/enroll') return { ok: true };
    throw new Error(`Unexpected api call: ${path}`);
  });
}

describe('startSubjectAsGuest', () => {
  it('rejects unknown subject ids', async () => {
    const result = await startSubjectAsGuest('missing', {
      user: learner,
      api: mockApi(),
      catalog,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe(START_SUBJECT_ERRORS.INVALID_SUBJECT);
  });

  it('creates guest session, enrolls, and returns subject path', async () => {
    const continueAsGuest = vi.fn().mockResolvedValue(guest);
    const api = mockApi({ enrolled: [] });

    const result = await startSubjectAsGuest('sub-1', {
      continueAsGuest,
      api,
      catalog,
    });

    expect(continueAsGuest).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledWith('/subjects/enroll', expect.any(Object));
    expect(result.ok).toBe(true);
    expect(result.path).toBe('/subjects/sub-1');
  });

  it('skips enroll when already enrolled', async () => {
    const api = mockApi({ enrolled: [{ id: 'sub-1', name: 'Math', progressPercent: 10 }] });

    const result = await startSubjectAsGuest('sub-1', {
      user: learner,
      api,
      catalog,
    });

    expect(api).not.toHaveBeenCalledWith('/subjects/enroll', expect.any(Object));
    expect(result.ok).toBe(true);
    expect(result.path).toBe('/subjects/sub-1');
  });

  it('returns enrollment limit when guest is at cap', async () => {
    const enrolled = [
      { id: 'a', progressPercent: 20, totalCards: 10 },
      { id: 'b', progressPercent: 30, totalCards: 10 },
      { id: 'c', progressPercent: 40, totalCards: 10 },
    ];
    const api = mockApi({ enrolled });

    const result = await startSubjectAsGuest('sub-1', {
      user: guest,
      api,
      catalog,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe(START_SUBJECT_ERRORS.ENROLLMENT_LIMIT);
    expect(result.message).toMatch(/Sign up/i);
    expect(api).not.toHaveBeenCalledWith('/subjects/enroll', expect.any(Object));
  });

  it('returns enrollment limit when registered learner is at cap', async () => {
    const enrolled = [
      { id: 'a', progressPercent: 20, totalCards: 10 },
      { id: 'b', progressPercent: 30, totalCards: 10 },
      { id: 'c', progressPercent: 40, totalCards: 10 },
      { id: 'd', progressPercent: 50, totalCards: 10 },
      { id: 'e', progressPercent: 60, totalCards: 10 },
    ];
    const api = mockApi({ enrolled });

    const result = await startSubjectAsGuest('sub-1', {
      user: learner,
      api,
      catalog,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe(START_SUBJECT_ERRORS.ENROLLMENT_LIMIT);
    expect(api).not.toHaveBeenCalledWith('/subjects/enroll', expect.any(Object));
  });

  it('blocks unverified registered users', async () => {
    const result = await startSubjectAsGuest('sub-1', {
      user: { ...learner, emailVerified: false },
      api: mockApi({ enrolled: [] }),
      catalog,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe(START_SUBJECT_ERRORS.EMAIL_UNVERIFIED);
    expect(result.path).toBe('/verify-email');
  });

  it('enables learner preview for staff and adds preview query', async () => {
    const storage = new Map();
    vi.stubGlobal('sessionStorage', {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });

    const api = mockApi({ enrolled: [] });

    const result = await startSubjectAsGuest('sub-1', {
      user: admin,
      api,
      catalog,
    });

    expect(storage.get('memora_student_view')).toBe('1');
    expect(result.ok).toBe(true);
    expect(result.path).toContain('/subjects/sub-1');
    expect(result.path).toContain('preview=1');

    vi.unstubAllGlobals();
  });
});
