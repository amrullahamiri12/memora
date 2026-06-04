const { checkAuthRateLimit, clientIp } = require('../lib/rateLimitFast');

describe('rateLimitFast', () => {
  it('extracts client IP from x-forwarded-for', () => {
    const ip = clientIp({
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    });
    expect(ip).toBe('203.0.113.1');
  });

  it('blocks after max auth attempts', () => {
    const req = { headers: {}, socket: { remoteAddress: 'test-rate-limit-ip-1' } };
    let last;
    for (let i = 0; i < 41; i++) {
      last = checkAuthRateLimit(req);
    }
    expect(last.allowed).toBe(false);
    expect(last.body.error).toMatch(/Too many/);
  });
});
