/**
 * useLiveData — polls a fetcher function on an interval.
 * Automatically refreshes data every `intervalMs` milliseconds.
 *
 * Usage:
 *   const { data, loading, error, refresh } = useLiveData(fetchStats, 3000);
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useLiveData(fetcher, intervalMs = 4000) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh(); // immediate first load
    timerRef.current = setInterval(refresh, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}
