// Credit calculation and validation utilities

import { MINUTES_PER_CREDIT, MIN_BOOKING_MINUTES } from '../types';

/**
 * Calculate credits required for a time range
 * @param startTime - Start time (Date or ISO string)
 * @param endTime - End time (Date or ISO string)
 * @returns Number of credits required (1 credit = 30 minutes)
 */
export function calculateCredits(
  startTime: Date | string,
  endTime: Date | string
): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  
  return durationMinutes / MINUTES_PER_CREDIT;
}

/**
 * Calculate duration in minutes between two times
 */
export function calculateDurationMinutes(
  startTime: Date | string,
  endTime: Date | string
): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const durationMs = end.getTime() - start.getTime();
  return Math.floor(durationMs / (1000 * 60));
}

/**
 * Validate booking duration meets requirements
 * @param startTime - Start time
 * @param endTime - End time
 * @param maxBookingHours - Maximum hours allowed (from sport settings)
 * @returns Validation result with error message if invalid
 */
export function validateBookingDuration(
  startTime: Date | string,
  endTime: Date | string,
  maxBookingHours: number = 4.0
): { valid: boolean; error?: string } {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // Check if end is after start
  if (end <= start) {
    return { valid: false, error: 'End time must be after start time' };
  }
  
  const durationMinutes = calculateDurationMinutes(start, end);
  
  // Check minimum duration
  if (durationMinutes < MIN_BOOKING_MINUTES) {
    return {
      valid: false,
      error: `Minimum booking duration is ${MIN_BOOKING_MINUTES} minutes`,
    };
  }
  
  // Check if duration is in 30-minute increments
  if (durationMinutes % MINUTES_PER_CREDIT !== 0) {
    return {
      valid: false,
      error: `Booking must be in ${MINUTES_PER_CREDIT}-minute increments`,
    };
  }
  
  // Check maximum duration
  const maxMinutes = maxBookingHours * 60;
  if (durationMinutes > maxMinutes) {
    return {
      valid: false,
      error: `Maximum booking duration is ${maxBookingHours} hours`,
    };
  }
  
  return { valid: true };
}

/**
 * Check if user has sufficient credits
 * @param currentBalance - User's current credit balance
 * @param requiredCredits - Credits needed for booking
 * @returns true if user has enough credits
 */
export function hasSufficientCredits(
  currentBalance: number,
  requiredCredits: number
): boolean {
  return currentBalance >= requiredCredits;
}

/**
 * Calculate next Monday at midnight (for credit reset)
 * @param fromDate - Calculate from this date (defaults to now)
 * @returns Next Monday at 00:00:00
 */
export function getNextMondayMidnight(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  
  const dayOfWeek = date.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday, 1 day; else 8 - dayOfWeek
  
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

/**
 * Check if a credit reset is needed for a user
 * @param lastResetDate - User's last credit reset date
 * @returns true if reset is needed
 */
export function needsCreditReset(lastResetDate: Date | string): boolean {
  const lastReset = typeof lastResetDate === 'string' ? new Date(lastResetDate) : lastResetDate;
  const now = new Date();
  
  return now >= lastReset;
}

/**
 * Format credits for display
 * @param credits - Credit amount
 * @returns Formatted string (e.g., "5.0 credits")
 */
export function formatCredits(credits: number): string {
  return `${credits.toFixed(1)} credit${credits === 1 ? '' : 's'}`;
}

/**
 * Convert credits to time duration string
 * @param credits - Number of credits
 * @returns Duration string (e.g., "1.5 hours" or "30 minutes")
 */
export function creditsToTimeString(credits: number): string {
  const minutes = credits * MINUTES_PER_CREDIT;
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = minutes / 60;
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

/**
 * Calculate user's current credit balance from transactions
 * @param transactions - Array of credit transaction amounts
 * @returns Total balance
 */
export function calculateBalance(transactions: { amount: number }[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}
