// User API Routes
// POST /api/users - Create new user by email

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidEmail, sanitizeEmail, createErrorResponse } from '@/lib/utils/validation';
import { getNextMondayMidnight } from '@/lib/utils/credits';
import { CREDITS_PER_WEEK } from '@/lib/types';
import type { CreateUserRequest, CreateUserResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        createErrorResponse('Email is required'),
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        createErrorResponse('Invalid email format'),
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', sanitizedEmail)
      .single();

    if (existingUser) {
      // User exists, return existing user with current credits
      const { data: creditData } = await supabaseServer
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', existingUser.id)
        .gte('created_at', existingUser.credits_reset_date);

      const currentBalance = creditData?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

      return NextResponse.json({
        user: existingUser,
        credits: currentBalance,
      } as CreateUserResponse);
    }

    // Create new user
    const nextResetDate = getNextMondayMidnight();

    const { data: newUser, error: createError } = await supabaseServer
      .from('users')
      .insert({
        email: sanitizedEmail,
        credits_reset_date: nextResetDate.toISOString(),
      })
      .select()
      .single();

    if (createError || !newUser) {
      return NextResponse.json(
        handleDatabaseError(createError),
        { status: 500 }
      );
    }

    // Give initial credits
    const { error: creditsError } = await supabaseServer
      .from('credit_transactions')
      .insert({
        user_id: newUser.id,
        amount: CREDITS_PER_WEEK,
        transaction_type: 'weekly_reset',
        notes: 'Initial credits',
      });

    if (creditsError) {
      console.error('Failed to create initial credits:', creditsError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      {
        user: newUser,
        credits: CREDITS_PER_WEEK,
      } as CreateUserResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create user'),
      { status: 500 }
    );
  }
}
