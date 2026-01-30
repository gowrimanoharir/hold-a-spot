// Hold a Spot - TypeScript Type Definitions

// ============================================
// DATABASE TYPES
// ============================================

export interface Sport {
  id: string;
  name: string;
  is_active: boolean;
  max_booking_hours: number;
  slot_duration_minutes: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  bonus_credits: number;
  is_admin: boolean;
  created_at: string;
}

export type FacilityType = 'court' | 'bay';

export interface Facility {
  id: string;
  name: string;
  sport_id: string;
  type: FacilityType;
  is_active: boolean;
  created_at: string;
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed';
export type CancelledBy = 'user' | 'admin' | null;

export interface Reservation {
  id: string;
  user_id: string;
  facility_id: string;
  start_time: string;
  end_time: string;
  credits_used: number;
  status: ReservationStatus;
  cancelled_by: CancelledBy;
  created_at: string;
  updated_at: string;
}


export interface CalendarBlock {
  id: string;
  facility_id: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_by: string;
  created_at: string;
}

// ============================================
// VIEW TYPES
// ============================================


export interface ActiveFacility extends Facility {
  sport_name: string;
  max_booking_hours: number;
  slot_duration_minutes: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateUserRequest {
  email: string;
}

export interface CreateUserResponse {
  user: User;
}

export interface GetCreditsResponse {
  weekly_allowance: number;
  used_this_week: number;
  weekly_remaining: number;
  bonus_credits: number;
  total_available: number;
  week_start: string;
}

export interface CreateReservationRequest {
  user_id: string;
  facility_id: string;
  start_time: string;
  end_time: string;
}

export interface CreateReservationResponse {
  reservation: Reservation;
  remaining_credits: number;
}

export interface CheckAvailabilityRequest {
  facility_id: string;
  start_time: string;
  end_time: string;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  reason?: string;
}

// ============================================
// UI TYPES
// ============================================

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  reservation?: ReservationWithDetails;
}

export interface ReservationWithDetails extends Reservation {
  facility?: Facility;
  user?: User;
  facility_name?: string;
  facility_type?: FacilityType;
  sport_name?: string;
}

export interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

export interface FacilityWithSport extends Facility {
  sport: Sport;
}

// ============================================
// FILTER TYPES
// ============================================

export interface BookingFilters {
  facilityType?: FacilityType | 'all';
  sportId?: string;
  searchQuery?: string;
}

export interface ReservationFilters {
  userId?: string;
  facilityId?: string;
  startDate?: string;
  endDate?: string;
  status?: ReservationStatus;
}

// ============================================
// ERROR TYPES
// ============================================

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

// ============================================
// CONSTANTS
// ============================================

export const CREDITS_PER_WEEK = 10;
export const MINUTES_PER_CREDIT = 30;
export const MIN_BOOKING_MINUTES = 30;
export const FACILITY_HOURS = {
  OPEN: 6,  // 6 AM
  CLOSE: 22 // 10 PM
} as const;

// ============================================
// UTILITY TYPES
// ============================================

export type WithId<T> = T & { id: string };
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
