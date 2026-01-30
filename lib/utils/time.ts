// Time and date utility functions

import { FACILITY_HOURS } from '../types';
import type { WeekDay } from '../types';

/**
 * Generate 30-minute time slots for a given date
 * @param date - Date to generate slots for
 * @param facilityHours - Opening and closing hours (default: 6 AM - 10 PM)
 * @returns Array of time slots with start and end times
 */
export function generateTimeSlots(
  date: Date,
  facilityHours = FACILITY_HOURS
): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = [];
  
  // Create a new date object to avoid mutation
  const baseDate = new Date(date);
  
  // Ensure we're working with the correct date at the start of day
  const startOfDay = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    facilityHours.OPEN,
    0,
    0,
    0
  );
  
  const endOfDay = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    facilityHours.CLOSE,
    0,
    0,
    0
  );
  
  let currentTime = new Date(startOfDay);
  
  while (currentTime < endOfDay) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime.getTime() + 30 * 60 * 1000); // +30 minutes
    
    slots.push({
      start: slotStart,
      end: slotEnd,
    });
    
    currentTime = slotEnd;
  }
  
  return slots;
}

/**
 * Get array of 7 dates for the week starting from Monday
 * @param referenceDate - Any date in the week (defaults to today)
 * @returns Array of 7 dates starting from Monday
 */
export function getWeekDates(referenceDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  
  // Find Monday of the week
  const monday = getMonday(referenceDate);
  
  // Generate 7 days starting from Monday
  for (let i = 0; i < 7; i++) {
    const date = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i,
      0,
      0,
      0,
      0
    );
    dates.push(date);
  }
  
  return dates;
}

/**
 * Get Monday of the week for a given date
 * @param date - Reference date
 * @returns Monday of that week at midnight
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  // Create a new date object to avoid mutation issues
  return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
}

/**
 * Get week dates with metadata for UI display
 * @param referenceDate - Any date in the week
 * @returns Array of WeekDay objects with formatted data
 */
export function getWeekDaysWithMetadata(referenceDate: Date = new Date()): WeekDay[] {
  const dates = getWeekDates(referenceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return dates.map((date) => {
    const dayDate = new Date(date);
    dayDate.setHours(0, 0, 0, 0);
    
    return {
      date: date,
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      isToday: dayDate.getTime() === today.getTime(),
    };
  });
}

/**
 * Check if a time slot is in the past
 * @param slotTime - Time slot to check
 * @returns true if slot is in the past
 */
export function isPastTimeSlot(slotTime: Date): boolean {
  return slotTime < new Date();
}

/**
 * Check if two time ranges overlap
 * @param start1 - Start of first range
 * @param end1 - End of first range
 * @param start2 - Start of second range
 * @param end2 - End of second range
 * @returns true if ranges overlap
 */
export function timeRangesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2;
  
  return s1 < e2 && s2 < e1;
}

/**
 * Format date for display
 * @param date - Date to format
 * @returns Formatted string (e.g., "Mon, Jan 15")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 * @param date - Date/time to format
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date and time for display
 * @param date - Date/time to format
 * @returns Formatted string (e.g., "Mon, Jan 15 at 2:30 PM")
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Format time range for display
 * @param start - Start time
 * @param end - End time
 * @returns Formatted string (e.g., "2:30 PM - 4:00 PM")
 */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Parse ISO date string to Date object safely
 * @param dateString - ISO date string
 * @returns Date object or null if invalid
 */
export function parseISODate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Get start and end of day for a date
 * @param date - Reference date
 * @returns Object with startOfDay and endOfDay
 */
export function getDayBoundaries(date: Date): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
}

/**
 * Check if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
