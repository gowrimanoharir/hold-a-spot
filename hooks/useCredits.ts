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

      const data: GetCreditsResponse = await response.json();
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
    weeklyAllowance: credits?.weekly_allowance ?? 10,
    usedThisWeek: credits?.used_this_week ?? 0,
    weeklyRemaining: credits?.weekly_remaining ?? 10,
    bonusCredits: credits?.bonus_credits ?? 0,
    totalAvailable: credits?.total_available ?? 10,
    weekStart: credits?.week_start,
    // Legacy field for backward compatibility
    balance: credits?.total_available ?? 10,
    loading,
    error,
    refetch: fetchCredits,
  };
}
