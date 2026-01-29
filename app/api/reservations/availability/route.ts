// Check Availability API
// GET /api/reservations/availability - Check if a time slot is available

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidUUID, createErrorResponse, validateQueryParam } from '@/lib/utils/validation';
import type { CheckAvailabilityResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facility_id');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');

    // Validate required parameters
    const facilityValidation = validateQueryParam(facilityId, 'facility_id');
    if (!facilityValidation.valid) {
      return NextResponse.json(
        createErrorResponse(facilityValidation.error!),
        { status: 400 }
      );
    }

    const startValidation = validateQueryParam(startTime, 'start_time');
    if (!startValidation.valid) {
      return NextResponse.json(
        createErrorResponse(startValidation.error!),
        { status: 400 }
      );
    }

    const endValidation = validateQueryParam(endTime, 'end_time');
    if (!endValidation.valid) {
      return NextResponse.json(
        createErrorResponse(endValidation.error!),
        { status: 400 }
      );
    }

    // Validate UUID
    if (!isValidUUID(facilityId!)) {
      return NextResponse.json(
        createErrorResponse('Invalid facility ID format'),
        { status: 400 }
      );
    }

    // Check for overlapping confirmed reservations
    const { data: existingReservations, error } = await supabaseServer
      .from('reservations')
      .select('id, start_time, end_time')
      .eq('facility_id', facilityId!)
      .eq('status', 'confirmed')
      .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

    if (error) {
      return NextResponse.json(
        handleDatabaseError(error),
        { status: 500 }
      );
    }

    // Check if any reservations overlap
    const hasOverlap = existingReservations && existingReservations.length > 0;

    if (hasOverlap) {
      return NextResponse.json({
        available: false,
        reason: 'Time slot is already booked',
      } as CheckAvailabilityResponse);
    }

    return NextResponse.json({
      available: true,
    } as CheckAvailabilityResponse);
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      createErrorResponse('Failed to check availability'),
      { status: 500 }
    );
  }
}
