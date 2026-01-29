// Server Supabase Client (Full access)
// Use this ONLY in API routes (app/api/**/route.ts)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase service role key. This should only be used in API routes.'
  );
}

// Server client uses service role key (full database access)
// NEVER expose this client or key to the browser
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// SERVER-SIDE HELPER FUNCTIONS
// ============================================

/**
 * Safely handle database errors and return user-friendly messages
 */
export function handleDatabaseError(error: any): {
  error: string;
  details?: string;
  code?: string;
} {
  console.error('Database error:', error);

  // PostgreSQL error codes
  const errorCode = error?.code;
  const errorMessage = error?.message || 'An unknown error occurred';

  // Handle specific errors
  if (errorCode === '23505') {
    // Unique violation
    return {
      error: 'This record already exists',
      details: errorMessage,
      code: errorCode,
    };
  }

  if (errorCode === '23503') {
    // Foreign key violation
    return {
      error: 'Referenced record does not exist',
      details: errorMessage,
      code: errorCode,
    };
  }

  if (errorCode === '23514') {
    // Check constraint violation
    return {
      error: 'Invalid data provided',
      details: errorMessage,
      code: errorCode,
    };
  }

  if (errorCode === '23P01') {
    // Exclusion constraint violation (our overlapping bookings)
    return {
      error: 'This time slot is already booked',
      details: 'The selected time conflicts with an existing reservation',
      code: errorCode,
    };
  }

  // Generic error
  return {
    error: 'Database operation failed',
    details: errorMessage,
    code: errorCode,
  };
}

/**
 * Validate that required environment variables are present
 */
export function validateServerEnvironment(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
