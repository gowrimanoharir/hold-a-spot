'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SessionCard from '@/components/sessions/SessionCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useUserReservations } from '@/hooks/useReservations';
import { useCredits } from '@/hooks/useCredits';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDate } from '@/lib/utils/time';

export default function SessionsPage() {
  const router = useRouter();
  const [userId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hold-a-spot-user-id');
    }
    return null;
  });
  const [email] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hold-a-spot-email');
    }
    return null;
  });

  const { reservations, refetch: refetchReservations } = useUserReservations(userId || undefined);
  const { balance, resetDate, refetch: refetchCredits } = useCredits(userId || undefined);

  // Real-time updates
  useRealtime('reservations', () => {
    refetchReservations();
  });

  useEffect(() => {
    if (!userId || !email) {
      router.push('/book');
    }
  }, [userId, email, router]);

  const handleCancelSuccess = () => {
    refetchReservations();
    refetchCredits();
  };

  // Separate upcoming and past reservations
  const now = new Date();
  const upcomingReservations = reservations.filter(
    (r) => new Date(r.end_time) >= now && r.status === 'confirmed'
  );
  const pastReservations = reservations.filter(
    (r) => new Date(r.end_time) < now || r.status !== 'confirmed'
  );

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">My Sessions</h1>
            <p className="text-ocean-teal">View and manage your bookings</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-ocean-teal">Logged in as</div>
              <div className="font-semibold text-almost-black">{email}</div>
            </div>
            <Button variant="primary" onClick={() => router.push('/book')}>
              Book New Session
            </Button>
          </div>
        </div>
      </div>

      {/* Credit Balance Card */}
      <div className="bg-white rounded-2xl p-8 shadow-md border-2 border-cool-gray">
        <h2 className="text-2xl font-bold text-almost-black mb-6">Credit Balance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget */}
          <div className="text-center p-6 bg-cool-gray rounded-xl">
            <div className="text-sm font-semibold text-ocean-teal mb-2">Credit Budget</div>
            <div className="text-5xl font-bold font-display text-almost-black">10</div>
            <div className="text-sm text-gray-500 mt-1">Weekly Allowance</div>
          </div>

          {/* Used */}
          <div className="text-center p-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl border-2 border-orange-300">
            <div className="text-sm font-semibold text-orange-700 mb-2">Credits Used</div>
            <div className="text-5xl font-bold font-display text-orange-600">{10 - balance}</div>
            <div className="text-sm text-orange-600 mt-1">This Week</div>
          </div>

          {/* Remaining */}
          <div className="text-center p-6 bg-gradient-to-br from-mint-green/20 to-mint-green/10 rounded-xl border-2 border-mint-green">
            <div className="text-sm font-semibold text-green-700 mb-2">Credits Remain</div>
            <div className="text-5xl font-bold font-display text-mint-green">{balance}</div>
            <div className="text-sm text-green-600 mt-1">Available Now</div>
          </div>
        </div>
        {resetDate && (
          <p className="text-center mt-4 text-sm text-ocean-teal">
            Credits reset on {formatDate(new Date(resetDate))}
          </p>
        )}
      </div>

      {/* Upcoming Reservations */}
      <div>
        <h2 className="text-2xl font-bold text-almost-black mb-4">
          Upcoming Sessions
          {upcomingReservations.length > 0 && (
            <Badge variant="info" size="md" className="ml-3">
              {upcomingReservations.length}
            </Badge>
          )}
        </h2>

        {upcomingReservations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-md text-center">
            <svg
              className="w-16 h-16 text-cool-gray mx-auto mb-4"
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
            <p className="text-gray-400 text-lg mb-4">No upcoming sessions</p>
            <Button 
              onClick={() => router.push('/book')}
              className="bg-gradient-to-r from-mint-green to-mint-green/90 hover:scale-105 transition-transform text-white font-bold px-8 py-4 text-lg rounded-xl shadow-lg"
            >
              Book a Court / Bay
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingReservations.map((reservation) => (
              <SessionCard
                key={reservation.id}
                reservation={reservation}
                onCancel={handleCancelSuccess}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-almost-black mb-4">
            Past Sessions
            <Badge variant="default" size="md" className="ml-3">
              {pastReservations.length}
            </Badge>
          </h2>

          <div className="space-y-4">
            {pastReservations.map((reservation) => (
              <SessionCard
                key={reservation.id}
                reservation={reservation}
                onCancel={handleCancelSuccess}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
