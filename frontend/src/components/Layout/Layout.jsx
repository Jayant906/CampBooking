import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useState, useEffect } from 'react';

// Helper component for footer links with scroll-to-top behavior
const FooterLink = ({ to, children, className }) => {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.preventDefault();
    const state = to === '/' ? { resetCamps: true, ts: Date.now() } : undefined;
    navigate(to, { state });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

const MembershipBadge = ({ isAdmin }) =>
  isAdmin ? (
    <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-green-500/20 text-emerald-700 dark:text-green-300 text-xs font-medium px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
      Member
    </span>
  );

const Layout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHeaderNavigation = (e, to, options = {}) => {
    e?.preventDefault();

    if (options.closeMobileMenu) {
      setMobileMenuOpen(false);
    }

    if (options.resetCamps) {
      navigate(to, { state: { resetCamps: true, ts: Date.now() } });
    } else {
      navigate(to);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreCamps = (e) => {
    handleHeaderNavigation(e, '/', { closeMobileMenu: true, resetCamps: true });
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className="min-h-screen">
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" onClick={handleExploreCamps} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-shadow">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l7 9-7 9M12 3l7 9-7 9" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-display font-semibold text-white">Luxecamp</span>
                <span className="block text-[10px] uppercase tracking-widest text-white/50 -mt-0.5">Premium Camping</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
              {isAuthenticated && (
                <Link to="/" onClick={handleExploreCamps} className="nav-link whitespace-nowrap">
                  Explore Camps
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/manage-booking" onClick={(e) => handleHeaderNavigation(e, '/manage-booking')} className="nav-link whitespace-nowrap">
                  My Bookings
                </Link>
              )}
              {isAuthenticated && user?.isAdmin && (
                <>
                  <Link to="/admin/camps" onClick={(e) => handleHeaderNavigation(e, '/admin/camps')} className="nav-link whitespace-nowrap">
                    Manage Camps
                  </Link>
                  <Link to="/admin/coupons" onClick={(e) => handleHeaderNavigation(e, '/admin/coupons')} className="nav-link whitespace-nowrap">
                    Manage Coupons
                  </Link>
                  <Link to="/admin/users" onClick={(e) => handleHeaderNavigation(e, '/admin/users')} className="nav-link whitespace-nowrap">
                    Manage Users
                  </Link>
                  <Link to="/admin/bookings" onClick={(e) => handleHeaderNavigation(e, '/admin/bookings')} className="nav-link whitespace-nowrap">
                    Manage Bookings
                  </Link>
                </>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-sand-dark)] hover:bg-[var(--color-sand)] dark:border-[#404040] dark:hover:bg-[#333] transition-all"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {isAuthenticated ? (
                <div className="hidden lg:flex items-center gap-3">
                  <Link 
                    to="/profile" 
                    onClick={(e) => handleHeaderNavigation(e, '/profile')}
                    className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-[var(--color-sand)] dark:hover:bg-[#333] transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="hidden xl:block text-left">
                      <span className="block text-sm font-medium text-white leading-tight">{user?.firstName}</span>
                      <MembershipBadge isAdmin={user?.isAdmin} />
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-3">
                  <Link to="/login" onClick={(e) => handleHeaderNavigation(e, '/login')} className="nav-link whitespace-nowrap">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={(e) => handleHeaderNavigation(e, '/register')} className="btn-primary text-sm py-2.5 whitespace-nowrap">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-sand-dark)] dark:border-[#404040]"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--color-sand)] dark:border-[#333] animate-fadeIn">
            <div className="px-4 py-4 space-y-2">
              {isAuthenticated && (
                <Link to="/" onClick={handleExploreCamps} className="block px-4 py-3 rounded-xl text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] font-medium">
                  Explore Camps
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/manage-booking" onClick={(e) => handleHeaderNavigation(e, '/manage-booking', { closeMobileMenu: true })} className="block px-4 py-3 rounded-xl text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] font-medium">
                  My Bookings
                </Link>
              )}
              {isAuthenticated && user?.isAdmin && (
                <>
                  <Link to="/admin/camps" onClick={(e) => handleHeaderNavigation(e, '/admin/camps', { closeMobileMenu: true })} className="block px-4 py-3 rounded-xl text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] font-medium">
                    Manage Camps
                  </Link>
                  <Link to="/admin/coupons" onClick={(e) => handleHeaderNavigation(e, '/admin/coupons', { closeMobileMenu: true })} className="block px-4 py-3 rounded-xl text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] font-medium">
                    Manage Coupons
                  </Link>
                  <Link to="/admin/users" onClick={(e) => handleHeaderNavigation(e, '/admin/users', { closeMobileMenu: true })} className="block px-4 py-3 rounded-xl text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] font-medium">
                    Manage Users
                  </Link>
                  <Link to="/admin/bookings" onClick={(e) => handleHeaderNavigation(e, '/admin/bookings', { closeMobileMenu: true })} className="block px-4 py-3 rounded-xl text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] font-medium">
                    Manage Bookings
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-[var(--color-sand)] dark:border-[#333]">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={(e) => handleHeaderNavigation(e, '/profile', { closeMobileMenu: true })} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-sand)] dark:hover:bg-[#333]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                      <div>
                        <span className="block font-medium text-white">{user?.firstName} {user?.lastName}</span>
                        <MembershipBadge isAdmin={user?.isAdmin} />
                      </div>
                    </Link>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <Link to="/login" onClick={(e) => handleHeaderNavigation(e, '/login', { closeMobileMenu: true })} className="flex-1 btn-secondary text-center">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={(e) => handleHeaderNavigation(e, '/register', { closeMobileMenu: true })} className="flex-1 btn-primary text-center">
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-sand)] dark:border-[#333] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l7 9-7 9M12 3l7 9-7 9" />
                  </svg>
                </div>
                <span className="text-xl font-display font-semibold text-white">Luxecamp</span>
              </div>
              <p className="text-white/60 max-w-md leading-relaxed">
                Discover and book premium camping experiences across India. From serene lakeside retreats to mountain adventures.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><FooterLink to="/" className="text-white/60 hover:text-white transition-colors">Explore Camps</FooterLink></li>
                {isAuthenticated && (
                  <li><FooterLink to="/manage-booking" className="text-white/60 hover:text-white transition-colors">My Bookings</FooterLink></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-2">
                {isAuthenticated ? (
                  <>
                    <li><FooterLink to="/profile" className="text-white/60 hover:text-white transition-colors">My Profile</FooterLink></li>
                  </>
                ) : (
                  <>
                    <li><FooterLink to="/login" className="text-white/60 hover:text-white transition-colors">Sign In</FooterLink></li>
                    <li><FooterLink to="/register" className="text-white/60 hover:text-white transition-colors">Create Account</FooterLink></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--color-sand)] dark:border-[#333] mt-10 pt-8 text-center">
            <p className="text-white/40 text-sm">© 2026 Luxecamp. Premium outdoor experiences.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

