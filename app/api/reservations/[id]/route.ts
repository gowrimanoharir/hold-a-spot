// Reservation Management API
// DELETE /api/reservations/[id] - Cancel a reservation

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidUUID, createErrorResponse } from '@/lib/utils/validation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params;
    const { searchParams } = new URL(request.url);
    const cancelledBy = searchParams.get('cancelled_by') || 'user'; // 'user' or 'admin'

    // Validate reservation ID
    if (!isValidUUID(reservationId)) {
      return NextResponse.json(
        createErrorResponse('Invalid reservation ID format'),
        { status: 400 }
      );
    }

    // Get reservation details
    const { data: reservation, error: fetchError } = await supabaseServer
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        createErrorResponse('Reservation not found'),
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (reservation.status === 'cancelled') {
      return NextResponse.json(
        createErrorResponse('Reservation is already cancelled'),
        { status: 400 }
      );
    }

    // Check if reservation is in the past
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    if (startTime < now) {
      return NextResponse.json(
        createErrorResponse('Cannot cancel past reservations'),
        { status: 400 }
      );
    }

    // Update reservation status
    const { error: updateError } = await supabaseServer
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_by: cancelledBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId);

    if (updateError) {
      return NextResponse.json(
        handleDatabaseError(updateError),
        { status: 500 }
      );
    }

    // Calculate if bonus credits need to be refunded
    // Get week start for the cancelled booking
    const bookingDate = new Date(reservation.start_time);
    const weekStart = new Date(bookingDate);
    weekStart.setDate(bookingDate.getDate() - ((bookingDate.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Get other confirmed reservations for this week (excluding this one)
    const { data: weekReservations } = await supabaseServer
      .from('reservations')
      .select('credits_used')
      .eq('user_id', reservation.user_id)
      .eq('status', 'confirmed')
      .neq('id', reservationId)
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', weekEnd.toISOString());

    const otherCreditsUsedThisWeek = weekReservations?.reduce((sum, res) => sum + Number(res.credits_used), 0) || 0;
    
    // If other bookings + this booking exceed 10, bonus credits were used
    const totalCreditsUsed = otherCreditsUsedThisWeek + Number(reservation.credits_used);
    const bonusUsed = Math.max(0, totalCreditsUsed - 10);
    
    // Refund bonus credits if they were used
    if (bonusUsed > 0) {
      const { data: user } = await supabaseServer
        .from('users')
        .select('bonus_credits')
        .eq('id', reservation.user_id)
        .single();
        
      if (user) {
        await supabaseServer
          .from('users')
          .update({ bonus_credits: user.bonus_credits + bonusUsed })
          .eq('id', reservation.user_id);
      }
    }

    return NextResponse.json({
      message: 'Reservation cancelled successfully',
      refunded_credits: reservation.credits_used,
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      createErrorResponse('Failed to cancel reservation'),
      { status: 500 }
    );
  }
}
