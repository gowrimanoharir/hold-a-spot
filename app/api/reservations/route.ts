// Reservations API
// GET /api/reservations - Query reservations
// POST /api/reservations - Create new reservation

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import {
  isValidUUID,
  createErrorResponse,
  validateRequiredFields,
  validateNotInPast,
} from '@/lib/utils/validation';
import {
  calculateCredits,
  validateBookingDuration,
  hasSufficientCredits,
} from '@/lib/utils/credits';
import type { CreateReservationRequest, CreateReservationResponse } from '@/lib/types';

// GET - Query reservations with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facility_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status') || 'confirmed';

    // Build query
    let query = supabaseServer
      .from('reservations')
      .select(`
        *,
        user:users (
          id,
          email
        ),
        facility:facilities (
          id,
          name,
          type
        )
      `)
      .eq('status', status);

    // Filter by facility
    if (facilityId) {
      if (!isValidUUID(facilityId)) {
        return NextResponse.json(
          createErrorResponse('Invalid facility ID format'),
          { status: 400 }
        );
      }
      query = query.eq('facility_id', facilityId);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    query = query.order('start_time', { ascending: true });

    const { data: reservations, error } = await query;

    if (error) {
      return NextResponse.json(
        handleDatabaseError(error),
        { status: 500 }
      );
    }

    return NextResponse.json(reservations || []);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch reservations'),
      { status: 500 }
    );
  }
}

// POST - Create new reservation
export async function POST(request: NextRequest) {
  try {
    const body: CreateReservationRequest = await request.json();
    const { user_id, facility_id, start_time, end_time } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, [
      'user_id',
      'facility_id',
      'start_time',
      'end_time',
    ]);

    if (!validation.valid) {
      return NextResponse.json(
        createErrorResponse(
          `Missing required fields: ${validation.missing.join(', ')}`
        ),
        { status: 400 }
      );
    }

    // Validate UUIDs
    if (!isValidUUID(user_id)) {
      return NextResponse.json(
        createErrorResponse('Invalid user ID format'),
        { status: 400 }
      );
    }

    if (!isValidUUID(facility_id)) {
      return NextResponse.json(
        createErrorResponse('Invalid facility ID format'),
        { status: 400 }
      );
    }

    // Validate not in past
    const pastCheck = validateNotInPast(start_time);
    if (!pastCheck.valid) {
      return NextResponse.json(
        createErrorResponse(pastCheck.error || 'Cannot book in the past'),
        { status: 400 }
      );
    }

    // Get facility and sport info for validation
    const { data: facility, error: facilityError } = await supabaseServer
      .from('facilities')
      .select(`
        *,
        sport:sports (
          id,
          name,
          max_booking_hours
        )
      `)
      .eq('id', facility_id)
      .single();

    if (facilityError || !facility) {
      return NextResponse.json(
        createErrorResponse('Facility not found'),
        { status: 404 }
      );
    }

    // Validate booking duration
    const maxBookingHours = facility.sport?.max_booking_hours || 4.0;
    const durationValidation = validateBookingDuration(
      start_time,
      end_time,
      maxBookingHours
    );

    if (!durationValidation.valid) {
      return NextResponse.json(
        createErrorResponse(durationValidation.error || 'Invalid booking duration'),
        { status: 400 }
      );
    }

    // Calculate credits needed
    const creditsNeeded = calculateCredits(start_time, end_time);

    // Get user's current credit balance
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, credits_reset_date')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      );
    }

    // Get credit transactions
    const { data: transactions } = await supabaseServer
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user_id)
      .gte('created_at', user.credits_reset_date);

    const currentBalance = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    // Check sufficient credits
    if (!hasSufficientCredits(currentBalance, creditsNeeded)) {
      return NextResponse.json(
        createErrorResponse(
          'Insufficient credits',
          `You need ${creditsNeeded} credits but only have ${currentBalance}`
        ),
        { status: 400 }
      );
    }

    // Create reservation (database will check for overlaps via exclusion constraint)
    const { data: reservation, error: createError } = await supabaseServer
      .from('reservations')
      .insert({
        user_id,
        facility_id,
        start_time,
        end_time,
        credits_used: creditsNeeded,
        status: 'confirmed',
      })
      .select()
      .single();

    if (createError) {
      // Check if it's an overlap error
      if (createError.code === '23P01') {
        return NextResponse.json(
          createErrorResponse(
            'Time slot unavailable',
            'This time slot is already booked'
          ),
          { status: 409 }
        );
      }

      return NextResponse.json(
        handleDatabaseError(createError),
        { status: 500 }
      );
    }

    // Deduct credits
    const { error: creditError } = await supabaseServer
      .from('credit_transactions')
      .insert({
        user_id,
        amount: -creditsNeeded,
        transaction_type: 'reservation',
        reservation_id: reservation.id,
        notes: `Booking ${facility.name}`,
      });

    if (creditError) {
      console.error('Failed to deduct credits:', creditError);
      // Rollback reservation
      await supabaseServer
        .from('reservations')
        .delete()
        .eq('id', reservation.id);

      return NextResponse.json(
        createErrorResponse('Failed to process booking'),
        { status: 500 }
      );
    }

    const remainingCredits = currentBalance - creditsNeeded;

    return NextResponse.json(
      {
        reservation,
        remaining_credits: remainingCredits,
      } as CreateReservationResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      createErrorResponse('Failed to create reservation'),
      { status: 500 }
    );
  }
}
