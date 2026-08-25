import { describe, expect, it } from 'vitest';
import { describeError, isForbidden, isRateLimited, isUnauthorized } from '../lib/apiError';

const res = (status, data = {}, headers = {}) => ({ response: { status, data, headers } });

describe('describeError', () => {
  it('gives 401 a session-expired message and a sign-in action', () => {
    const d = describeError(res(401, { detail: 'Invalid token payload' }));
    expect(d.status).toBe(401);
    expect(d.title).toMatch(/session/i);
    expect(d.action).toBe('signin');
  });

  it('gives 403 a permissions message with no retry', () => {
    const d = describeError(res(403, { detail: 'Insufficient permissions' }));
    expect(d.title).toMatch(/not permitted/i);
    expect(d.action).toBeNull();
  });

  it('gives 429 a rate-limit message and surfaces Retry-After', () => {
    const d = describeError(res(429, {}, { 'retry-after': '30' }));
    expect(d.title).toMatch(/rate limit/i);
    expect(d.retryAfter).toBe(30);
    expect(d.action).toBe('retry-after');
  });

  it('surfaces the correlation id so a user can quote it', () => {
    const d = describeError(res(500, {}, { 'x-correlation-id': 'abc123' }));
    expect(d.correlationId).toBe('abc123');
  });

  it('handles a request that never reached the API', () => {
    const d = describeError(new Error('boom'));
    expect(d.status).toBe(0);
    expect(d.action).toBe('retry');
  });
});

describe('server detail is never leaked from a 500', () => {
  it('does not put the raw exception string on screen', () => {
    // The API's global handler echoes str(exc), which can contain fragments of
    // whatever borrower payload was being processed.
    const leaky =
      'Internal server error: KeyError on {"borrower":"Acme Steel","revenue":50000000}';
    const d = describeError(res(500, { detail: leaky, message: leaky }));

    expect(d.message).not.toContain('Acme Steel');
    expect(d.message).not.toContain('50000000');
    expect(d.message).toMatch(/could not complete/i);
  });

  it('does leak nothing for 502/503/504 either', () => {
    for (const status of [502, 503, 504]) {
      const d = describeError(res(status, { detail: 'borrower payload 12345' }));
      expect(d.message).not.toContain('12345');
    }
  });

  it('shows short human-authored detail for 400 and 404', () => {
    expect(describeError(res(400, { detail: 'Unknown status filter' })).message).toBe(
      'Unknown status filter'
    );
    expect(describeError(res(404, { detail: 'Case not found' })).message).toBe('Case not found');
  });

  it('reads the message field out of a structured 400 detail', () => {
    const d = describeError(res(400, { detail: { message: 'Bad filter', invalid: ['X'] } }));
    expect(d.message).toBe('Bad filter');
  });
});

describe('status predicates', () => {
  it('classify the codes the UI branches on', () => {
    expect(isUnauthorized(res(401))).toBe(true);
    expect(isForbidden(res(403))).toBe(true);
    expect(isRateLimited(res(429))).toBe(true);
    expect(isForbidden(res(401))).toBe(false);
  });
});
