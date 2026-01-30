'use client';

import { useEffect, useRef } from 'react';
import { supabase, subscribeToTable } from '@/lib/supabase/client';

export function useRealtime(
  table: string,
  onUpdate: () => void,
  filter?: { column: string; value: string | number }
) {
  const subscriptionRef = useRef<ReturnType<typeof subscribeToTable> | null>(null);

  useEffect(() => {
    // Subscribe to table changes
    subscriptionRef.current = subscribeToTable(
      table,
      (payload) => {
        console.log('Real-time update received:', payload);
        onUpdate();
      },
      filter
    );

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [table, onUpdate, filter]);
}
