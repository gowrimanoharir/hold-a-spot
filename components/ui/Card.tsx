'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  hover?: boolean;
  gradient?: 'primary' | 'sport' | 'none';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = '',
      accent = false,
      hover = true,
      gradient = 'none',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'bg-white rounded-2xl p-6 shadow-md transition-all duration-200';

    const accentStyles = accent
      ? 'border-l-4 border-transparent [background-image:linear-gradient(white,white),linear-gradient(90deg,var(--mint-green)_0%,var(--electric-cyan)_50%,var(--deep-purple)_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box]'
      : '';

    const hoverStyles = hover
      ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      : '';

    const gradientStyles = {
      primary: 'gradient-primary text-white',
      sport: 'gradient-sport text-white',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${accentStyles} ${hoverStyles} ${gradientStyles[gradient]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
