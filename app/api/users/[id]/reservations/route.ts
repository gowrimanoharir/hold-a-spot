// User Reservations API
// GET /api/users/[id]/reservations - Get all user's reservations

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidUUID, createErrorResponse } from '@/lib/utils/validation';
import type { ReservationWithDetails } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter by status

    // Validate user ID
    if (!isValidUUID(userId)) {
      return NextResponse.json(
        createErrorResponse('Invalid user ID format'),
        { status: 400 }
      );
    }

    // Build query
    let query = supabaseServer
      .from('reservations')
      .select(`
        *,
        facility:facilities (
          id,
          name,
          type,
          sport:sports (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservations, error } = await query;

    if (error) {
      return NextResponse.json(
        handleDatabaseError(error),
        { status: 500 }
      );
    }

    // Transform data to include flattened facility info
    const transformedReservations: ReservationWithDetails[] = (reservations || []).map((res) => ({
      ...res,
      facility_name: res.facility?.name,
      facility_type: res.facility?.type,
      sport_name: res.facility?.sport?.name,
    }));

    return NextResponse.json(transformedReservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch reservations'),
      { status: 500 }
    );
  }
}
