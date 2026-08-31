/**
 * ============================================================
 *  CRESEM — Authentication failure classification
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  A refresh request can fail for two completely different reasons, and
 *  conflating them is what ejected analysts out of live appraisals:
 *
 *    * The session is genuinely gone — the refresh token is missing,
 *      revoked, expired, or the account was disabled. The server says so
 *      with 401 or 403. The only correct response is to sign the user out.
 *
 *    * The request did not get a verdict — a timeout, a connection reset,
 *      a 5xx, a rate limit. The session may well still be valid; the
 *      server simply could not answer. Signing the user out here throws
 *      away work on the strength of a network blip.
 *
 *  The old code treated every failure as the first case. During a long
 *  appraisal the single backend worker is busy doing OCR, so refresh times
 *  out — and the user was logged out mid-run despite being authenticated.
 *
 *  Only a definitive 401/403 from the server proves a session is invalid.
 *  Everything else is transient until proven otherwise.
 */

/** The server told us, definitively, that the session is no longer valid. */
export class SessionExpiredError extends Error {
  constructor(status, message = 'Session is no longer valid') {
    super(message);
    this.name = 'SessionExpiredError';
    this.status = status;
    this.sessionInvalid = true;
  }
}

/** The refresh could not be completed. This is NOT proof of an invalid session. */
export class TransientAuthError extends Error {
  constructor(cause, attempts) {
    super('Could not reach the authentication service');
    this.name = 'TransientAuthError';
    this.cause = cause;
    this.attempts = attempts;
    this.sessionInvalid = false;
  }
}

/**
 * Decide what a failed refresh actually means.
 *
 * Returns 'invalid' only for 401/403. Everything else — including a
 * response-less error, which is what a timeout or a reset connection looks
 * like to axios — is 'transient'.
 */
export function classifyRefreshFailure(error) {
  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return 'invalid';
  }

  // No response at all: timeout, connection reset, DNS failure, CORS
  // rejection, or the browser going offline. The server never answered, so
  // it never said the session was bad.
  if (!error?.response) {
    return 'transient';
  }

  // 429 and every 5xx are the server declining to answer right now.
  if (status === 429 || status >= 500) {
    return 'transient';
  }

  // Anything else (a 400, say) is a client-side bug rather than an expired
  // session. Treated as transient so it cannot silently sign anyone out;
  // it will surface as a failed request instead.
  return 'transient';
}

/** True when the error proves the session is gone. */
export function isSessionInvalid(error) {
  return error?.sessionInvalid === true;
}

/** Milliseconds to wait before refresh attempt `attempt` (0-indexed). */
export function refreshBackoffMs(attempt, baseMs = 500, capMs = 8000) {
  const exponential = baseMs * 2 ** attempt;
  // Jitter keeps several tabs or a burst of queued requests from retrying in
  // lockstep and re-creating the storm this is meant to avoid.
  const jitter = Math.random() * baseMs;
  return Math.min(exponential + jitter, capMs);
}

/** How many times a transient refresh failure is retried before giving up. */
export const MAX_REFRESH_ATTEMPTS = 4;
