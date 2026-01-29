// Facilities API
// GET /api/facilities - List all facilities with optional filters

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidFacilityType, isValidUUID, createErrorResponse } from '@/lib/utils/validation';
import type { FacilityWithSport } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'court' or 'bay'
    const sportId = searchParams.get('sport_id');
    const search = searchParams.get('search'); // Search by name

    // Build query
    let query = supabaseServer
      .from('facilities')
      .select(`
        *,
        sport:sports (
          id,
          name,
          max_booking_hours,
          slot_duration_minutes
        )
      `)
      .eq('is_active', true);

    // Filter by type if provided
    if (type) {
      if (!isValidFacilityType(type)) {
        return NextResponse.json(
          createErrorResponse('Invalid facility type. Must be "court" or "bay"'),
          { status: 400 }
        );
      }
      query = query.eq('type', type);
    }

    // Filter by sport if provided
    if (sportId) {
      if (!isValidUUID(sportId)) {
        return NextResponse.json(
          createErrorResponse('Invalid sport ID format'),
          { status: 400 }
        );
      }
      query = query.eq('sport_id', sportId);
    }

    // Search by name if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Order by type (courts first) then by name
    query = query.order('type', { ascending: true }).order('name', { ascending: true });

    const { data: facilities, error } = await query;

    if (error) {
      return NextResponse.json(
        handleDatabaseError(error),
        { status: 500 }
      );
    }

    // Ensure sport data is included
    const facilitiesWithSport: FacilityWithSport[] = (facilities || []).map((facility) => ({
      ...facility,
      sport: facility.sport || {
        id: facility.sport_id,
        name: 'Unknown',
        max_booking_hours: 4.0,
        slot_duration_minutes: 30,
      },
    }));

    return NextResponse.json(facilitiesWithSport);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch facilities'),
      { status: 500 }
    );
  }
}
