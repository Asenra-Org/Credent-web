/**
 * Exact case counts per lifecycle status.
 *
 * The obvious implementation - fetch a page of cases and count them client
 * side - produces a number that silently means "of the 200 I happened to
 * load". On a KPI tile that reads as a total, which would be a fabricated
 * metric.
 *
 * Instead this issues one `limit=1` request per status and reads the `total`
 * the API reports for that filter. Each number is therefore the real count for
 * the tenant, and the payload stays tiny.
 *
 * There is no aggregation endpoint yet (it is Phase 8/9 work). When one exists
 * this hook becomes a single call and nothing that consumes it has to change.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { describeError } from '../lib/apiError';
import { ALL_STATUSES } from '../lib/caseStatus';

export function useCaseCounts(statuses = ALL_STATUSES) {
  const [counts, setCounts] = useState(null);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const mounted = useRef(true);
  const key = statuses.join(',');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [totalRes, ...perStatus] = await Promise.all([
        api.get('/cases', { params: { limit: 1 } }),
        ...statuses.map((status) => api.get('/cases', { params: { limit: 1, status: [status] } })),
      ]);

      if (!mounted.current) return;

      const next = {};
      statuses.forEach((status, i) => {
        next[status] = perStatus[i]?.data?.total ?? 0;
      });
      setCounts(next);
      setTotal(totalRes.data?.total ?? 0);
      setLoading(false);
    } catch (err) {
      if (!mounted.current) return;
      setError(describeError(err));
      setCounts(null);
      setTotal(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    run();
  }, [run]);

  return { counts, total, error, loading, refetch: run };
}
