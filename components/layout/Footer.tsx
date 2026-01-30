'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-almost-black text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-gradient mb-3">Hold a Spot</h3>
            <p className="text-cool-gray text-sm">
              Your sports facility reservation system. Book courts and bays with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-cool-gray">
              <li>
                <a
                  href="/book"
                  className="hover:text-electric-cyan transition-colors"
                >
                  Book a Court
                </a>
              </li>
              <li>
                <a
                  href="/sessions"
                  className="hover:text-electric-cyan transition-colors"
                >
                  My Sessions
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-white mb-3">Facility Hours</h4>
            <p className="text-sm text-cool-gray">
              Open Daily: 6:00 AM - 10:00 PM
            </p>
            <p className="text-sm text-cool-gray mt-2">
              Weekly Credits: 10 credits (resets Monday)
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-cool-gray">
            <p>&copy; {currentYear} Hold a Spot. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Built with Next.js & Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
