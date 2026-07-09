import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse } from '@/lib/api';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'))
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
