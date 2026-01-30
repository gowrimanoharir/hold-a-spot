'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import { formatDateTime, formatTimeRange } from '@/lib/utils/time';
import type { ReservationWithDetails } from '@/lib/types';

interface SessionCardProps {
  reservation: ReservationWithDetails;
  onCancel: () => void;
}

export default function SessionCard({ reservation, onCancel }: SessionCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const startTime = new Date(reservation.start_time);
  const endTime = new Date(reservation.end_time);
  const isPast = endTime < new Date();
  const isCancelled = reservation.status === 'cancelled';

  const handleCancelClick = () => {
    setConfirmModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    setConfirmModalOpen(false);
    setCancelling(true);
    
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onCancel();
      } else {
        const data: { error?: string } = await response.json();
        setAlertMessage(data.error || 'Failed to cancel reservation');
        setAlertType('error');
        setAlertOpen(true);
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      setAlertMessage('Failed to cancel reservation');
      setAlertType('error');
      setAlertOpen(true);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card accent hover={!isPast && !isCancelled}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Reservation Details */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl gradient-sport flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-almost-black font-display">
                {reservation.facility_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info" size="sm">
                  {reservation.facility_type}
                </Badge>
                {reservation.sport_name && (
                  <Badge variant="success" size="sm">
                    {reservation.sport_name}
                  </Badge>
                )}
                {isCancelled && (
                  <Badge variant="error" size="sm">
                    Cancelled
                  </Badge>
                )}
                {isPast && !isCancelled && (
                  <Badge variant="default" size="sm">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-ocean-teal">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-semibold">{formatDateTime(startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-ocean-teal">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatTimeRange(startTime, endTime)}</span>
            </div>
          </div>
        </div>

        {/* Credits & Actions */}
        <div className="flex flex-col items-end gap-3">
          <Badge variant="gradient" size="lg">
            <span className="font-display text-lg">{reservation.credits_used}</span>
            <span className="ml-1 text-sm">credits</span>
          </Badge>

          {!isPast && !isCancelled && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelClick}
              disabled={cancelling}
              isLoading={cancelling}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Cancel Reservation"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setConfirmModalOpen(false)}
            >
              No, Keep It
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelConfirm}
            >
              Yes, Cancel
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary">
          Are you sure you want to cancel this reservation? Your credits will be refunded.
        </p>
      </Modal>

      {/* Alert Dialog */}
      <Alert
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </Card>
  );
}
