import { useState, useCallback } from "react";
import { TrendsResponse, fetchTrends as apiFetchTrends } from "@/lib/api";

export interface UseFetchTrendsReturn {
  data: TrendsResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetchTrends(): UseFetchTrendsReturn {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFetchTrends();
      setData(result);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error("Error fetching trends:", errorObj);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch };
}
