'use client';

import { useState, useEffect, useMemo } from 'react';
import CalendarGrid from '@/components/booking/CalendarGrid';
import BookingModal from '@/components/booking/BookingModal';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useReservations } from '@/hooks/useReservations';
import { useCredits } from '@/hooks/useCredits';
import { useRealtime } from '@/hooks/useRealtime';
import type { FacilityWithSport, Sport } from '@/lib/types';

export default function BookPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  });
  const [facilities, setFacilities] = useState<FacilityWithSport[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string>('');

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date | null>(null);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string | null>(null);

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Data hooks
  const startOfDay = useMemo(() => {
    // Create date at start of selected day in local timezone
    const date = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0,
      0,
      0,
      0
    );
    return date.toISOString();
  }, [selectedDate]);

  const endOfDay = useMemo(() => {
    // Create date at end of selected day in local timezone
    const date = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      23,
      59,
      59,
      999
    );
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

  // Fetch sports
  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/sports');
      if (response.ok) {
        const data: Sport[] = await response.json();
        setSports(data);
        // Select first sport by default
        if (data.length > 0) {
          setSelectedSportId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

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

  // Filter facilities by selected sport
  const filteredFacilities = useMemo(() => {
    if (!selectedSportId) return facilities;
    return facilities.filter(f => f.sport_id === selectedSportId);
  }, [facilities, selectedSportId]);

  // Get selected sport name
  const selectedSport = sports.find(s => s.id === selectedSportId);
  const sportName = selectedSport?.name || 'sports';

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

  const handleSlotClick = (date: Date, time: string) => {
    if (!userId) {
      setAlertMessage('Please enter your email to book a slot');
      setAlertOpen(true);
      return;
    }

    setSelectedBookingDate(date);
    setSelectedBookingTime(time);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    refetchReservations();
    refetchCredits();
  };

  // Week navigation
  const handleWeekChange = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      const now = new Date();
      setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    } else {
      const newDate = new Date(selectedDate);
      const daysToAdd = direction === 'next' ? 7 : -7;
      newDate.setDate(newDate.getDate() + daysToAdd);
      setSelectedDate(newDate);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header with User Entry */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Book a Court</h1>
            <p className="text-ocean-teal">
              Reserve your spot for {sportName.toLowerCase()} courts and practice bays
            </p>
          </div>

          {/* User Login/Info */}
          <div className="w-full md:w-auto">
            {!userId ? (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Sport Selector Dropdown */}
                {sports.length > 0 && (
                  <select
                    value={selectedSportId}
                    onChange={(e) => setSelectedSportId(e.target.value)}
                    className="px-4 py-3 border-2 border-cool-gray rounded-lg focus:outline-none focus:border-electric-cyan transition-colors bg-white font-semibold text-almost-black"
                  >
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                )}
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
                {/* Sport Selector Dropdown for logged in users */}
                {sports.length > 0 && (
                  <select
                    value={selectedSportId}
                    onChange={(e) => setSelectedSportId(e.target.value)}
                    className="px-4 py-3 border-2 border-cool-gray rounded-lg focus:outline-none focus:border-electric-cyan transition-colors bg-white font-semibold text-almost-black"
                  >
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                )}
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

      {/* Facilities Display */}
      {filteredFacilities.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-almost-black mb-4">
            Available {sportName} Facilities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-gradient-to-br from-cool-gray to-soft-lavender/30 rounded-lg p-4 text-center border-2 border-transparent hover:border-electric-cyan transition-all"
              >
                <div className="text-sm font-semibold text-almost-black mb-1">
                  {facility.name}
                </div>
                <div className="text-xs text-ocean-teal capitalize">
                  {facility.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <CalendarGrid
        selectedDate={selectedDate}
        facilities={filteredFacilities}
        reservations={reservations}
        onSlotClick={handleSlotClick}
        onWeekChange={handleWeekChange}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedDate={selectedBookingDate}
        selectedTime={selectedBookingTime}
        userId={userId || ''}
        currentCredits={credits}
        facilities={filteredFacilities}
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
