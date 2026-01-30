'use client';

import { useMemo } from 'react';
import { formatTime } from '@/lib/utils/time';
import type { FacilityWithSport, ReservationWithDetails } from '@/lib/types';

interface CalendarGridProps {
  selectedDate: Date;
  facilities: FacilityWithSport[];
  reservations: ReservationWithDetails[];
  onSlotClick: (date: Date, time: string) => void;
}

export default function CalendarGrid({
  selectedDate,
  facilities,
  reservations,
  onSlotClick,
}: CalendarGridProps) {
  // Generate week starting from selected date's Monday
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const monday = new Date(selectedDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedDate]);

  // Generate time slots (8 AM to 8 PM in 30-min increments)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }, []);

  // Check if a time slot has reservations
  const getSlotReservations = (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

    return reservations.filter(res => {
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      
      // Check if reservation overlaps with this slot
      return resStart < slotEnd && resEnd > slotStart &&
        resStart.toDateString() === date.toDateString();
    });
  };

  // Check if slot is in the past
  const isPastSlot = (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hours, minutes, 0, 0);
    return slotTime < new Date();
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-cool-gray">
        <h2 className="text-xl font-bold text-almost-black">Court / Bay Availability</h2>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Days Header */}
          <div className="flex border-b-2 border-cool-gray sticky top-0 bg-white z-10">
            <div className="w-20 flex-shrink-0 p-2"></div>
            {weekDates.map((date, idx) => {
              const isToday = date.getTime() === today.getTime();
              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-[100px] text-center p-3 ${
                    isToday ? 'bg-electric-cyan/10' : ''
                  }`}
                >
                  <div className="text-xs text-ocean-teal font-medium">{dayNames[idx]}</div>
                  <div
                    className={`text-2xl font-bold ${
                      isToday
                        ? 'w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-electric-cyan to-vibrant-magenta text-white flex items-center justify-center'
                        : 'text-almost-black'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className="relative">
            {timeSlots.map((time) => (
              <div key={time} className="flex border-b border-cool-gray/30">
                {/* Time Label */}
                <div className="w-20 flex-shrink-0 p-2 text-xs font-semibold text-ocean-teal">
                  {formatTime(new Date(`2000-01-01T${time}:00`))}
                </div>

                {/* Day Columns */}
                {weekDates.map((date, idx) => {
                  const slotReservations = getSlotReservations(date, time);
                  const isPast = isPastSlot(date, time);
                  const hasReservations = slotReservations.length > 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => !isPast && onSlotClick(date, time)}
                      className={`
                        flex-1 min-w-[100px] min-h-[60px] p-2 border-r border-cool-gray/30 
                        transition-colors relative
                        ${isPast ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:bg-electric-cyan/5'}
                      `}
                    >
                      {hasReservations && (
                        <div className="text-xs space-y-1">
                          {slotReservations.map((res) => {
                            const facilityNames = facilities
                              .filter(f => f.id === res.facility_id)
                              .map(f => f.name);
                            
                            return (
                              <div
                                key={res.id}
                                className="bg-gradient-to-r from-electric-cyan/20 to-vibrant-magenta/20 border-l-2 border-electric-cyan p-1 rounded text-xs"
                              >
                                <div className="font-semibold truncate">
                                  {facilityNames.join(', ')}
                                </div>
                                <div className="text-gray-600 text-[10px]">Reserved</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isPast && !hasReservations && (
                        <div className="text-gray-400 text-xs">Past</div>
                      )}
                    </div>
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
