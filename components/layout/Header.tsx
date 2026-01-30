'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/book"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gradient group-hover:scale-105 transition-transform">
              Hold a Spot
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/book"
              className={`font-semibold transition-colors ${
                isActive('/book')
                  ? 'text-vibrant-magenta'
                  : 'text-almost-black hover:text-vibrant-magenta'
              }`}
            >
              Book Courts
            </Link>
            <Link
              href="/sessions"
              className={`font-semibold transition-colors ${
                isActive('/sessions')
                  ? 'text-vibrant-magenta'
                  : 'text-almost-black hover:text-vibrant-magenta'
              }`}
            >
              My Sessions
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-almost-black hover:bg-cool-gray rounded-lg transition-colors"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 pt-4 border-t border-cool-gray space-y-2">
          <Link
            href="/book"
            className={`block px-4 py-2 rounded-lg font-semibold transition-colors ${
              isActive('/book')
                ? 'bg-electric-cyan/10 text-vibrant-magenta'
                : 'text-almost-black hover:bg-cool-gray'
            }`}
          >
            Book Courts
          </Link>
          <Link
            href="/sessions"
            className={`block px-4 py-2 rounded-lg font-semibold transition-colors ${
              isActive('/sessions')
                ? 'bg-electric-cyan/10 text-vibrant-magenta'
                : 'text-almost-black hover:bg-cool-gray'
            }`}
          >
            My Sessions
          </Link>
        </nav>
      </div>
    </header>
  );
}
