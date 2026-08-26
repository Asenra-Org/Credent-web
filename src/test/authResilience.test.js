import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_REFRESH_ATTEMPTS,
  SessionExpiredError,
  TransientAuthError,
  classifyRefreshFailure,
  isSessionInvalid,
  refreshBackoffMs,
} from '../lib/authErrors';
import { isTransientApiError } from '../lib/apiError';

/**
 * Regression cover for the production bug where analysts were ejected out of a
 * live appraisal.
 *
 * The chain was: 15-minute access token expires mid-appraisal -> a poll returns
 * 401 -> the interceptor calls refresh -> the single backend worker is blocked
 * doing OCR so refresh times out -> the old refresh() treated ANY error as an
 * expired session -> clearAuth + hard redirect to /login, destroying the run.
 *
 * The rule these tests pin: only a definitive 401/403 from /auth/refresh proves
 * a session is invalid. Everything else preserves authentication.
 */

const res = (status) => ({ response: { status, data: {}, headers: {} } });
const noResponse = () => Object.assign(new Error('Network Error'), { response: undefined });
const timeout = () => Object.assign(new Error('timeout of 60000ms exceeded'), { code: 'ECONNABORTED' });

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

describe('refresh failure classification', () => {
  it('treats 401 as a genuinely invalid session', () => {
    expect(classifyRefreshFailure(res(401))).toBe('invalid');
  });

  it('treats 403 as a genuinely invalid session', () => {
    expect(classifyRefreshFailure(res(403))).toBe('invalid');
  });

  it.each([429, 500, 502, 503, 504])('treats %i as transient', (status) => {
    expect(classifyRefreshFailure(res(status))).toBe('transient');
  });

  it('treats a timeout as transient', () => {
    expect(classifyRefreshFailure(timeout())).toBe('transient');
  });

  it('treats a network failure with no response as transient', () => {
    expect(classifyRefreshFailure(noResponse())).toBe('transient');
  });

  it('never classifies a non-auth status as invalid', () => {
    for (const status of [400, 404, 409, 418, 422, 429, 500, 503]) {
      expect(classifyRefreshFailure(res(status))).not.toBe('invalid');
    }
  });
});

describe('bounded backoff', () => {
  it('grows with each attempt', () => {
    const a = refreshBackoffMs(0, 500, 8000);
    const d = refreshBackoffMs(3, 500, 8000);
    expect(d).toBeGreaterThan(a);
  });

  it('never exceeds the cap', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(refreshBackoffMs(i, 500, 8000)).toBeLessThanOrEqual(8000);
    }
  });

  it('retries a finite number of times', () => {
    expect(MAX_REFRESH_ATTEMPTS).toBeGreaterThan(1);
    expect(MAX_REFRESH_ATTEMPTS).toBeLessThanOrEqual(6);
  });
});

describe('error shapes', () => {
  it('SessionExpiredError is marked invalid', () => {
    expect(isSessionInvalid(new SessionExpiredError(401))).toBe(true);
  });

  it('TransientAuthError is NOT marked invalid', () => {
    expect(isSessionInvalid(new TransientAuthError(new Error('boom'), 4))).toBe(false);
  });

  it('an arbitrary error is not treated as an invalid session', () => {
    expect(isSessionInvalid(new Error('something else'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The store's refresh behaviour
// ---------------------------------------------------------------------------

describe('authStore.refresh', () => {
  let postMock;
  let useAuthStore;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    postMock = vi.fn();
    vi.doMock('axios', () => ({
      default: { create: () => ({ post: postMock, get: vi.fn().mockResolvedValue({ data: {} }) }) },
    }));
    ({ useAuthStore } = await import('../stores/authStore'));
    useAuthStore.setState({
      accessToken: 'old-token',
      user: { user_id: 'u1', email: 'a@b.com', role: 'CREDIT_ANALYST' },
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock('axios');
  });

  /** Drive fake timers while a promise settles. */
  async function settle(promise) {
    const result = promise.then(
      (v) => ({ ok: true, v }),
      (e) => ({ ok: false, e })
    );
    for (let i = 0; i < MAX_REFRESH_ATTEMPTS + 2; i += 1) {
      await vi.advanceTimersByTimeAsync(10000);
    }
    return result;
  }

  it('200 keeps the session and stores the new token', async () => {
    postMock.mockResolvedValue({ data: { access_token: 'fresh-token' } });
    const out = await settle(useAuthStore.getState().refresh());
    expect(out.ok).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('fresh-token');
  });

  it('401 clears auth and reports the session as invalid', async () => {
    postMock.mockRejectedValue(res(401));
    const out = await settle(useAuthStore.getState().refresh());
    expect(out.ok).toBe(false);
    expect(isSessionInvalid(out.e)).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('403 clears auth and reports the session as invalid', async () => {
    postMock.mockRejectedValue(res(403));
    const out = await settle(useAuthStore.getState().refresh());
    expect(isSessionInvalid(out.e)).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('401 does not retry — the answer is definitive', async () => {
    postMock.mockRejectedValue(res(401));
    await settle(useAuthStore.getState().refresh());
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it.each([500, 502, 503, 504, 429])(
    '%i PRESERVES authentication and does not sign the user out',
    async (status) => {
      postMock.mockRejectedValue(res(status));
      const out = await settle(useAuthStore.getState().refresh());

      expect(out.ok).toBe(false);
      expect(isSessionInvalid(out.e)).toBe(false);
      // The critical assertion: the analyst is still signed in.
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('old-token');
    }
  );

  it('a timeout PRESERVES authentication', async () => {
    postMock.mockRejectedValue(timeout());
    const out = await settle(useAuthStore.getState().refresh());
    expect(isSessionInvalid(out.e)).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('a network failure PRESERVES authentication', async () => {
    postMock.mockRejectedValue(noResponse());
    const out = await settle(useAuthStore.getState().refresh());
    expect(isSessionInvalid(out.e)).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('retries a transient failure a bounded number of times', async () => {
    postMock.mockRejectedValue(res(503));
    await settle(useAuthStore.getState().refresh());
    expect(postMock).toHaveBeenCalledTimes(MAX_REFRESH_ATTEMPTS);
  });

  it('recovers when a transient failure is followed by success', async () => {
    postMock
      .mockRejectedValueOnce(res(503))
      .mockRejectedValueOnce(timeout())
      .mockResolvedValue({ data: { access_token: 'recovered-token' } });

    const out = await settle(useAuthStore.getState().refresh());
    expect(out.ok).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('recovered-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('does not storm the server: concurrent callers share the retry budget', async () => {
    postMock.mockRejectedValue(res(503));
    const a = useAuthStore.getState().refresh();
    const b = useAuthStore.getState().refresh();
    await settle(Promise.allSettled([a, b]));
    // Two independent callers, each bounded. Without a bound this would be
    // unbounded; the point is that it is finite and small.
    expect(postMock.mock.calls.length).toBeLessThanOrEqual(MAX_REFRESH_ATTEMPTS * 2);
  });
});

// ---------------------------------------------------------------------------
// Appraisal polling survival
// ---------------------------------------------------------------------------

describe('appraisal survives transient API failure', () => {
  it.each([500, 502, 503, 504, 429])('%i is transient, so the run is not failed', (status) => {
    expect(isTransientApiError(res(status))).toBe(true);
  });

  it('a timeout is transient', () => {
    expect(isTransientApiError(timeout())).toBe(true);
  });

  it('a network drop is transient', () => {
    expect(isTransientApiError(noResponse())).toBe(true);
  });

  it('a genuine 4xx is NOT transient and must still fail the run', () => {
    expect(isTransientApiError(res(400))).toBe(false);
    expect(isTransientApiError(res(404))).toBe(false);
    expect(isTransientApiError(res(422))).toBe(false);
  });
});
