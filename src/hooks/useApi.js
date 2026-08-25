/**
 * Data fetching with first-class loading / error / empty states.
 *
 * Every screen in the product needs the same four-way branch, and getting it
 * wrong is how a dashboard ends up rendering zeros for data it never loaded.
 * This hook makes the four states explicit and mutually exclusive.
 *
 * 401 is deliberately NOT handled here: the axios interceptor in lib/api.js
 * already performs the silent refresh and redirects to /login when that fails.
 * Duplicating it would race with the interceptor.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { describeError } from '../lib/apiError';

export function useApi(path, { params, enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));

  // Guards against a slow response from an earlier render overwriting a newer
  // one when filters change quickly.
  const requestSeq = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(path, { params });
      if (mounted.current && seq === requestSeq.current) {
        setData(res.data);
        setLoading(false);
      }
    } catch (err) {
      if (mounted.current && seq === requestSeq.current) {
        setError(describeError(err));
        setData(null);
        setLoading(false);
      }
    }
    // params is serialised by the caller through deps; including the object
    // itself would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, loading, refetch: run };
}

/**
 * Poll while a predicate holds. Used by case views that are watching a
 * pipeline run, so the UI reflects real backend state rather than a guess.
 */
export function usePolling(refetch, shouldPoll, intervalMs = 5000) {
  useEffect(() => {
    if (!shouldPoll) return undefined;
    const id = setInterval(refetch, intervalMs);
    return () => clearInterval(id);
  }, [refetch, shouldPoll, intervalMs]);
}
