// Reservation Management API
// DELETE /api/reservations/[id] - Cancel a reservation

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, handleDatabaseError } from '@/lib/supabase/server';
import { isValidUUID, createErrorResponse } from '@/lib/utils/validation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
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

    // Refund credits
    const { error: refundError } = await supabaseServer
      .from('credit_transactions')
      .insert({
        user_id: reservation.user_id,
        amount: reservation.credits_used,
        transaction_type: 'refund',
        reservation_id: reservationId,
        notes: `Refund for cancelled reservation`,
      });

    if (refundError) {
      console.error('Failed to refund credits:', refundError);
      // Don't fail the request, just log the error
      // The reservation is still cancelled
    }

    // Get updated credit balance
    const { data: user } = await supabaseServer
      .from('users')
      .select('credits_reset_date')
      .eq('id', reservation.user_id)
      .single();

    let newBalance = 0;
    if (user) {
      const { data: transactions } = await supabaseServer
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', reservation.user_id)
        .gte('created_at', user.credits_reset_date);

      newBalance = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
    }

    return NextResponse.json({
      message: 'Reservation cancelled successfully',
      refunded_credits: reservation.credits_used,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      createErrorResponse('Failed to cancel reservation'),
      { status: 500 }
    );
  }
}
