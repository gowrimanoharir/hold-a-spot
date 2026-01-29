// Browser Supabase Client (Read-only + Real-time)
// Use this in client components ('use client')

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Browser client uses anon key (limited access)
// For reading data and subscribing to real-time updates
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No auth for MVP
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for real-time updates
    },
  },
});

// ============================================
// HELPER FUNCTIONS FOR CLIENT
// ============================================

/**
 * Subscribe to real-time changes on a table
 * @example
 * const subscription = subscribeToTable('reservations', (payload) => {
 *   console.log('Change received!', payload)
 * })
 * 
 * // Cleanup on unmount
 * return () => subscription.unsubscribe()
 */
export function subscribeToTable(
  table: string,
  callback: (payload: unknown) => void,
  filter?: { column: string; value: string | number }
) {
  let channel = supabase.channel(`public:${table}`);
  
  if (filter) {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `${filter.column}=eq.${filter.value}`,
      },
      callback
    );
  } else {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      callback
    );
  }
  
  return channel.subscribe();
}

/**
 * Unsubscribe from real-time channel
 */
export async function unsubscribeFromChannel(subscription: ReturnType<typeof subscribeToTable>) {
  await supabase.removeChannel(subscription);
}
