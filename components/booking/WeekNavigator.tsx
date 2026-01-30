'use client';

import { getWeekDaysWithMetadata } from '@/lib/utils/time';
import type { WeekDay } from '@/lib/types';

interface WeekNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedDate: Date;
}

export default function WeekNavigator({
  currentDate,
  onDateChange,
  selectedDate,
}: WeekNavigatorProps) {
  const weekDays = getWeekDaysWithMetadata(currentDate);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onDateChange(today);
  };

  const isSelectedDate = (day: WeekDay) => {
    return (
      day.date.getDate() === selectedDate.getDate() &&
      day.date.getMonth() === selectedDate.getMonth() &&
      day.date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousWeek}
          className="p-2 hover:bg-cool-gray rounded-lg transition-colors"
          aria-label="Previous week"
        >
          <svg
            className="w-6 h-6 text-almost-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-semibold text-electric-cyan hover:bg-electric-cyan/10 rounded-lg transition-colors"
        >
          Today
        </button>

        <button
          onClick={goToNextWeek}
          className="p-2 hover:bg-cool-gray rounded-lg transition-colors"
          aria-label="Next week"
        >
          <svg
            className="w-6 h-6 text-almost-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isSelected = isSelectedDate(day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayNormalized = new Date(day.date);
          dayNormalized.setHours(0, 0, 0, 0);
          const isPast = dayNormalized < today;

          return (
            <button
              key={day.date.toISOString()}
              onClick={() => {
                const normalizedDate = new Date(day.date);
                normalizedDate.setHours(0, 0, 0, 0);
                onDateChange(normalizedDate);
              }}
              disabled={isPast}
              className={`
                relative p-4 rounded-xl transition-all duration-200
                ${
                  isSelected
                    ? 'bg-gradient-to-br from-electric-cyan to-vibrant-magenta text-white shadow-lg scale-105'
                    : day.isToday
                    ? 'bg-mint-green/20 text-almost-black hover:bg-mint-green/30'
                    : isPast
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-cool-gray text-almost-black hover:bg-electric-cyan/10'
                }
              `}
            >
              <div className="text-xs font-medium mb-1 uppercase opacity-75">
                {day.dayName.slice(0, 3)}
              </div>
              <div className={`text-2xl font-bold font-display ${isSelected ? 'text-white' : ''}`}>
                {day.dayNumber}
              </div>
              {day.isToday && !isSelected && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-electric-cyan rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
