/**
 * Turning an axios failure into something safe to put on screen.
 *
 * Two constraints drive this module:
 *
 *   * A borrower's financial payload must never end up in an error message.
 *     Backend 500s echo `str(exc)`, which can contain fragments of whatever was
 *     being processed, so raw server detail is only surfaced for the status
 *     codes where it is known to be a short, safe, human-authored string
 *     (400/404/409/422). Everything else gets a fixed message.
 *   * The user needs to know what to do next, which differs sharply between
 *     401 (session gone), 403 (not your permission level) and 429 (slow down).
 */

const SAFE_DETAIL_STATUSES = new Set([400, 404, 409, 422]);

const GENERIC = {
  401: {
    title: 'Session expired',
    message: 'Your session is no longer valid. Sign in again to continue.',
    action: 'signin',
  },
  403: {
    title: 'Not permitted',
    message: 'Your role does not have access to this resource.',
    action: null,
  },
  404: {
    title: 'Not found',
    message: 'This resource does not exist, or is not available to your organization.',
    action: null,
  },
  429: {
    title: 'Rate limit reached',
    message:
      'Too many requests. This limit protects shared analysis capacity across your organization.',
    action: 'retry-after',
  },
  500: {
    title: 'Server error',
    message: 'The server could not complete this request. The incident has been logged.',
    action: 'retry',
  },
  502: { title: 'Service unavailable', message: 'The API is unreachable.', action: 'retry' },
  503: { title: 'Service unavailable', message: 'The API is temporarily unavailable.', action: 'retry' },
  504: { title: 'Request timed out', message: 'The server took too long to respond.', action: 'retry' },
};

/** Pull a short, human-authored string out of a FastAPI `detail` field. */
function readDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string') return detail.message;
  }
  return null;
}

/**
 * Normalise any thrown value into { status, title, message, action, retryAfter,
 * correlationId }.
 */
export function describeError(error) {
  // No response at all: the request never reached the API.
  if (!error?.response) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return {
      status: 0,
      title: offline ? 'You are offline' : 'Cannot reach the server',
      message: offline
        ? 'Reconnect to the network and try again.'
        : 'The request did not reach the API. Check your connection and try again.',
      action: 'retry',
      retryAfter: null,
      correlationId: null,
    };
  }

  const { status, data, headers } = error.response;
  const base = GENERIC[status] || {
    title: 'Request failed',
    message: 'The request could not be completed.',
    action: 'retry',
  };

  let message = base.message;
  if (SAFE_DETAIL_STATUSES.has(status)) {
    const detail = readDetail(data?.detail);
    if (detail) message = detail;
  }

  const retryAfterRaw = headers?.['retry-after'] ?? headers?.['Retry-After'];
  const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : null;

  return {
    status,
    title: base.title,
    message,
    action: base.action,
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : null,
    // Every response carries X-Correlation-ID from the API middleware. Showing
    // it lets a user quote something an operator can actually search for.
    correlationId:
      headers?.['x-correlation-id'] ?? data?.correlation_id ?? null,
  };
}

/** Convenience predicates used by screens to branch on the outcome. */
export const isUnauthorized = (e) => e?.response?.status === 401;
export const isForbidden = (e) => e?.response?.status === 403;
export const isRateLimited = (e) => e?.response?.status === 429;
export const isNotFound = (e) => e?.response?.status === 404;

/**
 * True when a request failed without the server reaching a verdict.
 *
 * A timeout, a dropped connection, a 429 or any 5xx means the request did not
 * complete - not that the work behind it failed. During an appraisal the
 * backend may still be processing perfectly well, so a caller seeing one of
 * these should retry or keep polling rather than declaring the run dead.
 *
 * A 4xx other than 429 is a real answer and is not transient.
 */
export function isTransientApiError(error) {
  const status = error?.response?.status;
  if (!error?.response) return true;      // timeout, reset, offline, CORS
  if (status === 429) return true;
  if (status >= 500) return true;
  return false;
}
