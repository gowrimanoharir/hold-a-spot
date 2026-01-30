'use client';

import { useEffect } from 'react';
import Button from './Button';

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'error' | 'warning' | 'success';
}

export default function Alert({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
}: AlertProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colors = {
    info: {
      bg: 'bg-accent-blue/10',
      border: 'border-accent-blue',
      icon: '💬',
    },
    error: {
      bg: 'bg-status-error/10',
      border: 'border-status-error',
      icon: '⚠️',
    },
    warning: {
      bg: 'bg-accent-yellow/10',
      border: 'border-accent-yellow',
      icon: '⚡',
    },
    success: {
      bg: 'bg-status-success/10',
      border: 'border-status-success',
      icon: '✓',
    },
  };

  const colorScheme = colors[type];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-dark/80 backdrop-blur-sm animate-fade-in" />
      
      {/* Alert Dialog */}
      <div 
        className="relative bg-surface-medium border-2 border-border-medium rounded-xl shadow-glow-lg max-w-md w-full animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Title Bar */}
        <div className={`${colorScheme.bg} border-b-2 ${colorScheme.border} rounded-t-xl px-6 py-4 flex items-center gap-3`}>
          <span className="text-2xl">{colorScheme.icon}</span>
          <h3 className="font-display text-xl font-bold text-text-primary">
            {title || (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Notice')}
          </h3>
        </div>

        {/* Message */}
        <div className="px-6 py-6">
          <p className="text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
            className="min-w-24"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
