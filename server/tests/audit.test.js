const pg = require('../lib/pg');
const {
  sanitizeMetadata,
  userSnapshot,
  recordAuditEvent,
  buildRequestContext,
  AUDIT_ACTIONS,
} = require('../lib/audit');

describe('audit', () => {
  beforeEach(() => {
    vi.spyOn(pg, 'query').mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitizeMetadata', () => {
    it('strips sensitive keys recursively', () => {
      const input = {
        email: 'user@example.com',
        password: 'secret',
        nested: { token: 'abc', role: 'USER' },
      };
      expect(sanitizeMetadata(input)).toEqual({
        email: 'user@example.com',
        nested: { role: 'USER' },
      });
    });
  });

  describe('userSnapshot', () => {
    it('returns denormalized safe user fields', () => {
      const snap = userSnapshot({
        id: 'u1',
        name: 'Test',
        email: 't@example.com',
        role: 'USER',
        email_verified_at: '2026-01-01T00:00:00.000Z',
        password_hash: 'hash',
      });
      expect(snap).toEqual({
        id: 'u1',
        name: 'Test',
        email: 't@example.com',
        role: 'USER',
        emailVerified: true,
        deactivatedAt: null,
      });
    });
  });

  describe('buildRequestContext', () => {
    it('captures IP and user agent from request', () => {
      const ctx = buildRequestContext({
        headers: { 'user-agent': 'TestAgent/1.0' },
        socket: { remoteAddress: '127.0.0.1' },
      });
      expect(ctx.userAgent).toBe('TestAgent/1.0');
      expect(ctx.ipAddress).toBeTruthy();
    });
  });

  describe('recordAuditEvent', () => {
    it('inserts an append-only row with sanitized metadata', async () => {
      await recordAuditEvent({
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        actorEmail: 'attacker@example.com',
        ipAddress: '10.0.0.1',
        metadata: { attemptedEmail: 'attacker@example.com', password: 'nope' },
      });

      expect(pg.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pg.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO audit_events');
      expect(params[2]).toBe('AUTH_LOGIN_FAILED');
      expect(params[4]).toBe('attacker@example.com');
      const metadata = JSON.parse(params[11]);
      expect(metadata.attemptedEmail).toBe('attacker@example.com');
      expect(metadata.password).toBeUndefined();
    });

    it('no-ops when action is missing', async () => {
      await recordAuditEvent({ actorEmail: 'x@y.com' });
      expect(pg.query).not.toHaveBeenCalled();
    });
  });
});
