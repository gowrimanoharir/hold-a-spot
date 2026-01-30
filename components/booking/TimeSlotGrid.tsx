'use client';

import { useMemo } from 'react';
import { generateTimeSlots, formatTime, isPastTimeSlot } from '@/lib/utils/time';
import type { FacilityWithSport, ReservationWithDetails } from '@/lib/types';

interface TimeSlotGridProps {
  selectedDate: Date;
  facilities: FacilityWithSport[];
  reservations: ReservationWithDetails[];
  onSlotClick: (facility: FacilityWithSport, startTime: Date, endTime: Date) => void;
}

export default function TimeSlotGrid({
  selectedDate,
  facilities,
  reservations,
  onSlotClick,
}: TimeSlotGridProps) {
  const slots = useMemo(() => generateTimeSlots(selectedDate), [selectedDate]);

  // Check if a slot is reserved
  const isSlotReserved = (facilityId: string, slotStart: Date, slotEnd: Date) => {
    return reservations.some((res) => {
      if (res.facility_id !== facilityId) return false;
      
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      
      // Check overlap
      return slotStart < resEnd && slotEnd > resStart;
    });
  };

  const getSlotStatus = (facility: FacilityWithSport, slotStart: Date, slotEnd: Date) => {
    if (isPastTimeSlot(slotStart)) {
      return 'past';
    }
    if (isSlotReserved(facility.id, slotStart, slotEnd)) {
      return 'reserved';
    }
    return 'available';
  };

  if (facilities.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-md text-center">
        <div className="text-gray-400 text-lg">
          No facilities selected. Please select facilities from the filter.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md overflow-hidden">
      <h3 className="text-lg font-bold text-almost-black mb-4">
        Available Time Slots
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header with facility names */}
          <div className="flex border-b-2 border-cool-gray pb-4 mb-4">
            <div className="w-24 flex-shrink-0 font-semibold text-almost-black">
              Time
            </div>
            {facilities.map((facility) => (
              <div
                key={facility.id}
                className="flex-1 min-w-[120px] text-center px-2"
              >
                <div className="font-bold text-almost-black">{facility.name}</div>
                <div className="text-xs text-ocean-teal capitalize">{facility.type}</div>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="space-y-2">
            {slots.map((slot) => (
              <div key={slot.start.toISOString()} className="flex items-stretch gap-2">
                {/* Time label */}
                <div className="w-24 flex-shrink-0 flex items-center">
                  <span className="text-sm font-semibold text-ocean-teal font-display">
                    {formatTime(slot.start)}
                  </span>
                </div>

                {/* Facility slots */}
                {facilities.map((facility) => {
                  const status = getSlotStatus(facility, slot.start, slot.end);
                  
                  return (
                    <button
                      key={`${facility.id}-${slot.start.toISOString()}`}
                      onClick={() => {
                        if (status === 'available') {
                          onSlotClick(facility, slot.start, slot.end);
                        }
                      }}
                      disabled={status !== 'available'}
                      className={`
                        flex-1 min-w-[120px] h-12 rounded-lg transition-all duration-200 font-semibold text-sm
                        ${
                          status === 'available'
                            ? 'border-2 border-dashed border-mint-green bg-white hover:bg-mint-green/10 cursor-pointer hover:scale-105'
                            : status === 'reserved'
                            ? 'bg-gradient-to-br from-electric-cyan/15 to-deep-purple/15 text-almost-black cursor-not-allowed relative overflow-hidden'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {status === 'available' && (
                        <span className="text-mint-green">Available</span>
                      )}
                      {status === 'reserved' && (
                        <>
                          <span className="relative z-10">Booked</span>
                          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,217,232,0.1)_10px,rgba(0,217,232,0.1)_20px)]" />
                        </>
                      )}
                      {status === 'past' && <span>Past</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
