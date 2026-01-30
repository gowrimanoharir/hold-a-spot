'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GetCreditsResponse } from '@/lib/types';

export function useCredits(userId?: string) {
  const [credits, setCredits] = useState<GetCreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/credits`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCredits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    balance: credits?.balance ?? 0,
    resetDate: credits?.reset_date,
    transactions: credits?.transactions ?? [],
    loading,
    error,
    refetch: fetchCredits,
  };
}
