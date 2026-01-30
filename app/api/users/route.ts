// User API Routes
// POST /api/users - Create new user by email

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidEmail, sanitizeEmail, createErrorResponse } from '@/lib/utils/validation';
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
      // User exists, return existing user
      return NextResponse.json({
        user: existingUser,
      } as CreateUserResponse);
    }

    // Create new user with 0 bonus credits
    const { data: newUser, error: createError } = await supabaseServer
      .from('users')
      .insert({
        email: sanitizedEmail,
        bonus_credits: 0,
      })
      .select()
      .single();

    if (createError || !newUser) {
      return NextResponse.json(
        handleDatabaseError(createError),
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        user: newUser,
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
