// Weekly Credit Reset API (Cron Job)
// POST /api/credits/reset - Reset credits for all users (runs weekly)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { createErrorResponse } from '@/lib/utils/validation';
import { getNextMondayMidnight } from '@/lib/utils/credits';
import { CREDITS_PER_WEEK } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        createErrorResponse('Server configuration error'),
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        createErrorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    // Get all users whose reset date has passed
    const now = new Date().toISOString();
    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('id, email, credits_reset_date')
      .lte('credits_reset_date', now);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        createErrorResponse('Failed to fetch users'),
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: 'No users need credit reset',
        reset_count: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Reset credits for each user
    for (const user of users) {
      try {
        const nextResetDate = getNextMondayMidnight();

        // Update user's reset date
        const { error: updateError } = await supabaseServer
          .from('users')
          .update({ credits_reset_date: nextResetDate.toISOString() })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Failed to update reset date for user ${user.id}:`, updateError);
          errorCount++;
          continue;
        }

        // Add credit transaction
        const { error: creditError } = await supabaseServer
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            amount: CREDITS_PER_WEEK,
            transaction_type: 'weekly_reset',
            notes: 'Weekly credit reset',
          });

        if (creditError) {
          console.error(`Failed to add credits for user ${user.id}:`, creditError);
          errorCount++;
          continue;
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Credit reset complete: ${successCount} successful, ${errorCount} errors`);

    return NextResponse.json({
      message: 'Credit reset completed',
      reset_count: successCount,
      error_count: errorCount,
      total_users: users.length,
    });
  } catch (error) {
    console.error('Error in credit reset:', error);
    return NextResponse.json(
      createErrorResponse('Credit reset failed'),
      { status: 500 }
    );
  }
}
