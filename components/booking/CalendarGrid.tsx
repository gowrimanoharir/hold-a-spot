'use client';

import { useMemo } from 'react';
import { formatTime } from '@/lib/utils/time';
import type { FacilityWithSport, ReservationWithDetails } from '@/lib/types';

interface CalendarGridProps {
  selectedDate: Date;
  facilities: FacilityWithSport[];
  reservations: ReservationWithDetails[];
  onSlotClick: (date: Date, time: string) => void;
  onWeekChange: (direction: 'prev' | 'next' | 'today') => void;
}

export default function CalendarGrid({
  selectedDate,
  facilities,
  reservations,
  onSlotClick,
  onWeekChange,
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

  // Check if a reservation starts in this slot
  const getReservationsStartingInSlot = (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);

    return reservations.filter(res => {
      const resStart = new Date(res.start_time);
      
      // Check if reservation starts in this exact slot
      return resStart.getTime() === slotStart.getTime() &&
        resStart.toDateString() === date.toDateString();
    });
  };

  // Check if this slot is occupied (but not the start)
  const isSlotOccupied = (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

    return reservations.some(res => {
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      
      // Slot is occupied if reservation overlaps but doesn't start here
      return resStart < slotStart && resEnd > slotStart &&
        resStart.toDateString() === date.toDateString();
    });
  };

  // Check if all facilities are booked at this time slot
  const areAllFacilitiesBooked = (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

    // Get all reservations that overlap with this slot
    const overlappingReservations = reservations.filter(res => {
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      
      return resStart < slotEnd && resEnd > slotStart &&
        resStart.toDateString() === date.toDateString();
    });

    // Get unique facility IDs that are booked
    const bookedFacilityIds = new Set(overlappingReservations.map(res => res.facility_id));
    
    // Check if all available facilities are booked
    return facilities.length > 0 && bookedFacilityIds.size >= facilities.length;
  };

  // Calculate height for reservation block
  const getReservationHeight = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
    const slots = durationMinutes / 30;
    return slots * 60; // 60px per slot
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

  // Format week range
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const monthStart = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const monthEnd = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const yearStart = weekStart.getFullYear();
  const yearEnd = weekEnd.getFullYear();
  
  const weekRangeText = 
    monthStart === monthEnd && yearStart === yearEnd
      ? `${monthStart} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${yearStart}`
      : yearStart === yearEnd
      ? `${monthStart} ${weekStart.getDate()} - ${monthEnd} ${weekEnd.getDate()}, ${yearStart}`
      : `${monthStart} ${weekStart.getDate()}, ${yearStart} - ${monthEnd} ${weekEnd.getDate()}, ${yearEnd}`;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Header with Week Navigation */}
      <div className="p-4 border-b-2 border-cool-gray">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-almost-black">Court / Bay Availability</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ocean-teal font-semibold">{weekRangeText}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onWeekChange('prev')}
                className="p-2 rounded-lg hover:bg-cool-gray transition-colors"
                aria-label="Previous week"
              >
                <svg className="w-5 h-5 text-ocean-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => onWeekChange('today')}
                className="px-3 py-1 text-sm font-semibold text-electric-cyan hover:bg-electric-cyan hover:text-white rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => onWeekChange('next')}
                className="p-2 rounded-lg hover:bg-cool-gray transition-colors"
                aria-label="Next week"
              >
                <svg className="w-5 h-5 text-ocean-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
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
                  const reservationsStartingHere = getReservationsStartingInSlot(date, time);
                  const isOccupied = isSlotOccupied(date, time);
                  const allBooked = areAllFacilitiesBooked(date, time);
                  const isPast = isPastSlot(date, time);
                  const isClickable = !isPast && !allBooked;

                  return (
                    <div
                      key={idx}
                      onClick={() => isClickable && onSlotClick(date, time)}
                      className={`
                        flex-1 min-w-[100px] min-h-[60px] p-1 border-r border-cool-gray/30 
                        transition-colors relative
                        ${isPast ? 'bg-gray-50 cursor-not-allowed' : 
                          allBooked ? 'cursor-not-allowed' : 
                          'cursor-pointer hover:bg-electric-cyan/5'}
                      `}
                    >
                      {/* Show reservation blocks that start in this slot */}
                      {reservationsStartingHere.map((res, resIdx) => {
                        const facility = facilities.find(f => f.id === res.facility_id);
                        const facilityName = facility?.name || 'Reserved';
                        const facilityType = facility?.type || '';
                        const height = getReservationHeight(res.start_time, res.end_time);
                        
                        // Calculate width and position for multiple concurrent reservations
                        const totalReservations = reservationsStartingHere.length;
                        const widthPercent = 100 / totalReservations;
                        const leftPercent = (100 / totalReservations) * resIdx;
                        
                        return (
                          <div
                            key={res.id}
                            className="absolute bg-gradient-to-br from-electric-cyan/40 to-vibrant-magenta/40 border-l-4 border-vibrant-magenta rounded-md p-2 shadow-sm z-10"
                            style={{ 
                              height: `${height - 4}px`,
                              width: `${widthPercent}%`,
                              left: `${leftPercent}%`
                            }}
                          >
                            <div className="text-xs font-bold text-almost-black truncate">
                              {facilityName}
                            </div>
                            <div className="text-[10px] text-gray-700 capitalize">
                              {facilityType}
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1">
                              Reserved
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Show "Past" or "Occupied" indicators */}
                      {!reservationsStartingHere.length && (
                        <>
                          {isPast && !isOccupied && (
                            <div className="text-gray-400 text-[10px]">Past</div>
                          )}
                          {isOccupied && (
                            <div className="bg-gradient-to-br from-electric-cyan/20 to-vibrant-magenta/20 h-full w-full rounded"></div>
                          )}
                        </>
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
