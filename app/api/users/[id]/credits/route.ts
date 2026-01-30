// User Credits API
// GET /api/users/[id]/credits?week_start=2026-02-10 - Get user's credits for a specific week

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidUUID, createErrorResponse } from '@/lib/utils/validation';
import { getWeekStart } from '@/lib/utils/time';
import { CREDITS_PER_WEEK } from '@/lib/types';
import type { GetCreditsResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get week_start from query params (defaults to current week)
    const weekStartParam = searchParams.get('week_start');
    const weekStart = weekStartParam ? new Date(weekStartParam) : getWeekStart(new Date());

    // Validate user ID
    if (!isValidUUID(userId)) {
      return NextResponse.json(
        createErrorResponse('Invalid user ID format'),
        { status: 400 }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, bonus_credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      );
    }

    // Calculate week end (next Monday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get credits used for this specific week
    const { data: reservations, error: resError } = await supabaseServer
      .from('reservations')
      .select('credits_used')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', weekEnd.toISOString());

    if (resError) {
      return NextResponse.json(
        handleDatabaseError(resError),
        { status: 500 }
      );
    }

    // Calculate credits used this week
    const usedThisWeek = reservations?.reduce((sum, res) => sum + Number(res.credits_used), 0) || 0;
    const weeklyAllowanceLeft = Math.max(0, CREDITS_PER_WEEK - usedThisWeek);
    const totalAvailable = weeklyAllowanceLeft + user.bonus_credits;

    return NextResponse.json({
      weekly_allowance: CREDITS_PER_WEEK,
      used_this_week: usedThisWeek,
      weekly_remaining: weeklyAllowanceLeft,
      bonus_credits: user.bonus_credits,
      total_available: totalAvailable,
      week_start: weekStart.toISOString(),
    } as GetCreditsResponse);
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch credits'),
      { status: 500 }
    );
  }
}
