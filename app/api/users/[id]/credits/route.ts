// User Credits API
// GET /api/users/[id]/credits - Get user's current credit balance

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidUUID, createErrorResponse } from '@/lib/utils/validation';
import type { GetCreditsResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Validate user ID
    if (!isValidUUID(userId)) {
      return NextResponse.json(
        createErrorResponse('Invalid user ID format'),
        { status: 400 }
      );
    }

    // Get user and their reset date
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, credits_reset_date')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      );
    }

    // Get all transactions since last reset
    const { data: transactions, error: txError } = await supabaseServer
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', user.credits_reset_date)
      .order('created_at', { ascending: false });

    if (txError) {
      return NextResponse.json(
        handleDatabaseError(txError),
        { status: 500 }
      );
    }

    // Calculate current balance
    const balance = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    return NextResponse.json({
      balance,
      reset_date: user.credits_reset_date,
      transactions: transactions || [],
    } as GetCreditsResponse);
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch credits'),
      { status: 500 }
    );
  }
}
