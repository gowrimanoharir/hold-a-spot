'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatTime, formatDate } from '@/lib/utils/time';
import type { FacilityWithSport } from '@/lib/types';

interface EnhancedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  userId: string;
  currentCredits: number;
  facilities: FacilityWithSport[];
  onBookingSuccess: () => void;
}

export default function EnhancedBookingModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  userId,
  currentCredits,
  facilities,
  onBookingSuccess,
}: EnhancedBookingModalProps) {
  const [facilityType, setFacilityType] = useState<'court' | 'bay'>('court');
  const [duration, setDuration] = useState(30);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  // Filter facilities by type
  const availableFacilities = facilities.filter(f => f.type === facilityType);

  // Calculate booking details
  const creditsNeeded = duration / 30; // 1 credit per 30 minutes
  const creditsRemaining = currentCredits - creditsNeeded;

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setFacilityType('court');
      setDuration(30);
      setSelectedFacilityId('');
      setError('');
    }
  }, [isOpen]);

  // Auto-select first facility when type changes
  useEffect(() => {
    if (availableFacilities.length > 0) {
      setSelectedFacilityId(availableFacilities[0].id);
    }
  }, [facilityType, availableFacilities]);

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !selectedFacilityId) {
      setError('Please select all options');
      return;
    }

    if (creditsNeeded > currentCredits) {
      setError('Not enough credits');
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      // Calculate start and end times
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          facility_id: selectedFacilityId,
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
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsBooking(false);
    }
  };

  if (!selectedDate || !selectedTime) {
    return null;
  }

  const [hours, minutes] = selectedTime.split(':').map(Number);
  const startTime = new Date(selectedDate);
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Your Court / Bay"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBook}
            isLoading={isBooking}
            disabled={!selectedFacilityId || creditsNeeded > currentCredits}
          >
            Complete Booking!
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Selected Date/Time Display */}
        <div className="bg-cool-gray p-4 rounded-lg">
          <div className="text-sm text-ocean-teal mb-1">Selected Time</div>
          <div className="font-bold text-almost-black">
            {formatDate(selectedDate)} at {formatTime(startTime)}
          </div>
        </div>

        {/* Court Type Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-almost-black mb-2">
            Court Type
          </label>
          <select
            value={facilityType}
            onChange={(e) => setFacilityType(e.target.value as 'court' | 'bay')}
            className="w-full px-4 py-3 border-2 border-cool-gray rounded-lg focus:outline-none focus:border-electric-cyan transition-colors bg-white font-semibold"
          >
            <option value="court">Court</option>
            <option value="bay">Bay (Solo Practice)</option>
          </select>
        </div>

        {/* Duration Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-almost-black mb-2">
            Length of Time
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-cool-gray rounded-lg focus:outline-none focus:border-electric-cyan transition-colors bg-white font-semibold"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes (1 hour)</option>
            <option value={90}>90 minutes (1.5 hours)</option>
            <option value={120}>120 minutes (2 hours)</option>
            <option value={150}>150 minutes (2.5 hours)</option>
            <option value={180}>180 minutes (3 hours)</option>
            <option value={210}>210 minutes (3.5 hours)</option>
            <option value={240}>240 minutes (4 hours)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            End time: {formatTime(endTime)}
          </div>
        </div>

        {/* Court Selection Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-almost-black mb-2">
            Court Selection
          </label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-cool-gray rounded-lg focus:outline-none focus:border-electric-cyan transition-colors bg-white font-semibold"
          >
            {availableFacilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} ({facility.type})
              </option>
            ))}
          </select>
          {availableFacilities.length === 0 && (
            <div className="text-sm text-red-500 mt-1">
              No {facilityType}s available
            </div>
          )}
        </div>

        {/* Credits Display */}
        <div className="bg-gradient-to-r from-electric-cyan/10 to-vibrant-magenta/10 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-almost-black">Credits</span>
            <span className="text-2xl font-bold font-display text-vibrant-magenta">
              {creditsNeeded} {creditsNeeded === 1 ? 'Credit' : 'Credits'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-almost-black">Credits Remaining</span>
            <span className={`text-lg font-bold ${creditsRemaining < 0 ? 'text-red-500' : 'text-mint-green'}`}>
              {creditsRemaining} {creditsRemaining === 1 ? 'Credit' : 'Credits'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Warning if not enough credits */}
        {creditsNeeded > currentCredits && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
            <p className="text-sm text-yellow-700">
              ⚠️ Not enough credits. You need {creditsNeeded} but only have {currentCredits}.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
