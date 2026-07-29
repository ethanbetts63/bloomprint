'use client';

import { useEffect, useMemo, useState } from 'react';
import { errorMessage } from '@/lib/errors';
import type { Paginated } from '@/types';

const emptyPage = <T,>(): Paginated<T> => ({ count: 0, next: null, previous: null, results: [] });

export function usePaginatedDashboardData<T, P>(
  fetchPage: (params: P) => Promise<Paginated<T>>,
  params: P,
  refreshKey = 0,
) {
  const [data, setData] = useState<Paginated<T>>(emptyPage<T>());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const serializedParams = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    let cancelled = false;
    const requestParams = JSON.parse(serializedParams) as P;
    fetchPage(requestParams)
      .then((result) => { if (!cancelled) { setData(result); setError(null); } })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchPage, refreshKey, serializedParams]);

  return { data, loading, error };
}
