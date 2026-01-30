'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDateTime, formatTimeRange } from '@/lib/utils/time';
import { calculateCredits, calculateDurationMinutes, creditsToTimeString } from '@/lib/utils/credits';
import type { FacilityWithSport } from '@/lib/types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: FacilityWithSport | null;
  startTime: Date | null;
  endTime: Date | null;
  userId: string;
  currentCredits: number;
  onBookingSuccess: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  facility,
  startTime,
  endTime,
  userId,
  currentCredits,
  onBookingSuccess,
}: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creditsNeeded = startTime && endTime ? calculateCredits(startTime, endTime) : 0;
  const duration = startTime && endTime ? calculateDurationMinutes(startTime, endTime) : 0;
  const remainingCredits = currentCredits - creditsNeeded;
  const hasEnoughCredits = remainingCredits >= 0;

  const handleBooking = async () => {
    if (!facility || !startTime || !endTime || !hasEnoughCredits) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          facility_id: facility.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      onBookingSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!facility || !startTime || !endTime) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Booking"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBooking}
            disabled={!hasEnoughCredits || loading}
            isLoading={loading}
          >
            {hasEnoughCredits ? 'Confirm Booking' : 'Insufficient Credits'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Facility Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl gradient-sport flex items-center justify-center flex-shrink-0">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-almost-black mb-1">{facility.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                {facility.type}
              </Badge>
              <Badge variant="success" size="sm">
                {facility.sport.name}
              </Badge>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-cool-gray rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-electric-cyan flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <div className="text-sm text-ocean-teal font-semibold">Date & Time</div>
              <div className="text-almost-black font-semibold">{formatDateTime(startTime)}</div>
              <div className="text-sm text-ocean-teal">{formatTimeRange(startTime, endTime)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-electric-cyan flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <div className="text-sm text-ocean-teal font-semibold">Duration</div>
              <div className="text-almost-black font-semibold">
                {duration} minutes ({creditsToTimeString(creditsNeeded)})
              </div>
            </div>
          </div>
        </div>

        {/* Credits Summary */}
        <div className="bg-gradient-to-br from-electric-cyan/10 to-vibrant-magenta/10 rounded-xl p-4 border-2 border-electric-cyan/20">
          <h4 className="font-bold text-almost-black mb-3">Credit Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-ocean-teal">Current Balance</span>
              <span className="font-bold font-display text-almost-black">{currentCredits} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ocean-teal">Booking Cost</span>
              <span className="font-bold font-display text-vibrant-magenta">-{creditsNeeded} credits</span>
            </div>
            <div className="border-t border-electric-cyan/20 pt-2 flex justify-between">
              <span className="font-semibold text-almost-black">Remaining Balance</span>
              <span className={`font-bold font-display text-xl ${
                hasEnoughCredits ? 'text-mint-green' : 'text-red-500'
              }`}>
                {remainingCredits} credits
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-red-700">Booking Failed</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          </div>
        )}

        {/* Insufficient Credits Warning */}
        {!hasEnoughCredits && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-yellow-800">Insufficient Credits</div>
              <div className="text-sm text-yellow-700">
                You need {creditsNeeded} credits but only have {currentCredits}. Credits reset every Monday.
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
