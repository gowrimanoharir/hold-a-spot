'use client';

import { useState, useEffect, useMemo } from 'react';
import WeekNavigator from '@/components/booking/WeekNavigator';
import FacilityFilter from '@/components/booking/FacilityFilter';
import TimeSlotGrid from '@/components/booking/TimeSlotGrid';
import BookingModal from '@/components/booking/BookingModal';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useReservations } from '@/hooks/useReservations';
import { useCredits } from '@/hooks/useCredits';
import { useRealtime } from '@/hooks/useRealtime';
import type { FacilityWithSport } from '@/lib/types';

export default function BookPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  });
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<FacilityWithSport[]>([]);

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithSport | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Data hooks
  const startOfDay = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }, [selectedDate]);

  const endOfDay = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }, [selectedDate]);

  const { reservations, refetch: refetchReservations } = useReservations(
    undefined,
    startOfDay,
    endOfDay
  );

  const { balance: credits, refetch: refetchCredits } = useCredits(userId || undefined);

  // Real-time updates
  useRealtime('reservations', () => {
    refetchReservations();
  });

  // Load saved user from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('hold-a-spot-user-id');
    const savedEmail = localStorage.getItem('hold-a-spot-email');
    if (savedUserId && savedEmail) {
      setUserId(savedUserId);
      setEmail(savedEmail);
    }
  }, []);

  // Fetch facilities
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities');
      if (response.ok) {
        const data: FacilityWithSport[] = await response.json();
        setFacilities(data);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const handleLogin = async () => {
    setEmailError('');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const data: { user: { id: string; email: string } } = await response.json();
      setUserId(data.user.id);
      
      // Save to localStorage
      localStorage.setItem('hold-a-spot-user-id', data.user.id);
      localStorage.setItem('hold-a-spot-email', data.user.email);
      
      refetchCredits();
    } catch (error) {
      console.error('Login error:', error);
      setEmailError('Failed to log in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUserId(null);
    setEmail('');
    localStorage.removeItem('hold-a-spot-user-id');
    localStorage.removeItem('hold-a-spot-email');
  };

  const handleSlotClick = (facility: FacilityWithSport, startTime: Date, endTime: Date) => {
    if (!userId) {
      setAlertMessage('Please enter your email to book a slot');
      setAlertOpen(true);
      return;
    }

    setSelectedFacility(facility);
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    refetchReservations();
    refetchCredits();
  };

  const filteredFacilities = facilities.filter((f) =>
    selectedFacilityIds.includes(f.id)
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header with User Entry */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Book a Court</h1>
            <p className="text-ocean-teal">
              Reserve your spot for pickleball courts and practice bays
            </p>
          </div>

          {/* User Login/Info */}
          <div className="w-full md:w-auto">
            {!userId ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  error={emailError}
                  className="w-full sm:w-64"
                />
                <Button
                  onClick={handleLogin}
                  isLoading={isLoggingIn}
                  disabled={!email || isLoggingIn}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-ocean-teal">Logged in as</div>
                  <div className="font-semibold text-almost-black">{email}</div>
                </div>
                <Badge variant="gradient" size="lg">
                  <span className="font-display text-2xl">{credits}</span>
                  <span className="ml-2">credits</span>
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <WeekNavigator
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Facility Filter Sidebar */}
        <div className="lg:col-span-1">
          <FacilityFilter onFilterChange={setSelectedFacilityIds} />
        </div>

        {/* Time Slot Grid */}
        <div className="lg:col-span-3">
          <TimeSlotGrid
            key={selectedDate.toISOString()}
            selectedDate={selectedDate}
            facilities={filteredFacilities}
            reservations={reservations}
            onSlotClick={handleSlotClick}
          />
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        facility={selectedFacility}
        startTime={selectedStartTime}
        endTime={selectedEndTime}
        userId={userId || ''}
        currentCredits={credits}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Alert Dialog */}
      <Alert
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type="warning"
      />
    </div>
  );
}
