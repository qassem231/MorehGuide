'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiLogOut, FiMenu, FiX, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useMobileSidebar } from '@/lib/MobileSidebarContext';

interface NavbarProps {}

export default function Navbar({}: NavbarProps = {}) {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isMobileSidebarOpen, toggleMobileSidebar } = useMobileSidebar();

  // Simple admin check: email match OR isAdmin flag
  const isSystemAdmin = user && (
    user.email === 'admin@admin.com' || 
    user.isAdmin === true
  );

  useEffect(() => {
    // Check user on initial mount
    const checkUser = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const activeRole = localStorage.getItem('activeRole');
      const guestMode = localStorage.getItem('guestMode') === 'true';
      console.log('👤 [NAVBAR]: Checking user - Token exists:', !!token);
      console.log('👤 [NAVBAR]: Active role:', activeRole);
      console.log('👤 [NAVBAR]: User data from localStorage:', userData);
      setIsGuest(guestMode);
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        // Merge activeRole if it exists in localStorage
        if (activeRole) {
          parsedUser.activeRole = activeRole;
        }
        console.log('👤 [NAVBAR]: Parsed user:', parsedUser);
        console.log('👤 [NAVBAR]: User role:', parsedUser.role);
        console.log('👤 [NAVBAR]: User activeRole:', parsedUser.activeRole);
        setUser(parsedUser);
      } else if (guestMode && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    };

    checkUser();

    // Listen for auth state changes from LoginForm
    const handleAuthStateChanged = () => {
      console.log('🔄 [NAVBAR]: Auth state changed event received');
      checkUser();
    };

    // Listen for user data updates (when role is selected)
    const handleUserDataUpdated = () => {
      console.log('🔄 [NAVBAR]: User data updated event received');
      checkUser();
    };

    // Listen for storage changes (when role is updated in another component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'activeRole') {
        console.log(`🔄 [NAVBAR]: Storage changed for key: ${e.key}, updating...`);
        checkUser();
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChanged);
    window.addEventListener('userDataUpdated', handleUserDataUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
      window.removeEventListener('userDataUpdated', handleUserDataUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    console.log('🔓 [NAVBAR]: Logout button clicked');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestRole');
    setUser(null);
    setIsGuest(false);
    setIsDropdownOpen(false);

    // Dispatch event to notify other components
    const logoutEvent = new Event('authStateChanged');
    window.dispatchEvent(logoutEvent);

    // Refresh server state and redirect
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="bg-brand-dark border-b border-brand-slate/30 backdrop-blur-sm z-10 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Sidebar Toggle + Logo */}
          <div className="flex items-center gap-2 sm:gap-0">
            {/* Sidebar Toggle (only show on chat page) */}
            {pathname === '/chat' && (
              <button
                className="lg:hidden text-brand-cream hover:text-brand-accent transition-colors p-2 -ml-2"
                onClick={toggleMobileSidebar}
                aria-label="Toggle sidebar"
              >
                {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            )}
            
            {/* Logo */}
            <Link href={user && !isGuest ? "/chat" : "/"} className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-brand-accent hover:text-blue-300 transition-colors">
                MorehGuide
              </span>
            </Link>
          </div>

          {/* Right Section - Profile Dropdown (Mobile + Desktop) */}
          {user && !isGuest ? (
            <div className="flex items-center gap-4">
              {/* Desktop Admin Link */}
              {isSystemAdmin && (
                <Link
                  href="/admin/files"
                  className="hidden sm:block bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200 border border-blue-500/30"
                >
                  Manage Files
                </Link>
              )}
              
              {/* Profile Dropdown - Mobile & Desktop */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 hover:bg-brand-slate/50 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-brand flex items-center justify-center overflow-hidden">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-xs">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-brand-light/70 leading-none">{user.name}</p>
                    {/* Role Label - Priority: Admin > Student > Lecturer > Guest */}
                    {isGuest ? (
                      <p className="text-xs text-amber-400 font-semibold leading-none">Guest</p>
                    ) : user.email === 'admin@admin.com' || user.isAdmin === true ? (
                      <p className="text-xs text-sky-400 font-semibold leading-none">Admin</p>
                    ) : user.activeRole === 'student' ? (
                      <p className="text-xs text-emerald-400 font-semibold leading-none">Student</p>
                    ) : user.activeRole === 'lecturer' ? (
                      <p className="text-xs text-sky-400 font-semibold leading-none">Lecturer</p>
                    ) : (
                      <p className="text-xs text-brand-light/50 font-semibold leading-none">User</p>
                    )}
                  </div>
                  <FiChevronDown className={`w-3.5 sm:w-4 h-3.5 sm:h-4 text-brand-light/60 group-hover:text-brand-light transition-transform duration-200 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-brand-slate/95 backdrop-blur-sm border border-brand-slate/50 rounded-lg shadow-lg overflow-hidden animate-in fade-in z-50">
                    {/* Mobile: Show user info in dropdown */}
                    <div className="sm:hidden px-3 py-2 border-b border-brand-slate/30 text-xs text-brand-light/70">
                      <p className="font-semibold text-brand-cream">{user.name}</p>
                      <p className="text-sky-400 font-semibold" style={{textTransform: 'capitalize'}}>
                        {isGuest ? 'Guest' : (user.activeRole || user.role)}
                      </p>
                    </div>
                    
                    {/* Admin link for mobile */}
                    {isSystemAdmin && (
                      <Link
                        href="/admin/files"
                        className="sm:hidden flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-brand-slate/80 transition-colors border-b border-brand-slate/30"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Manage Files
                      </Link>
                    )}
                    
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-brand-cream hover:bg-brand-slate/80 transition-colors border-b border-brand-slate/30"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FiSettings className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-red-400 hover:bg-red-500/20 transition-colors text-left"
                    >
                      <FiLogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (pathname !== '/login' && pathname !== '/register') ? (
            <div className="hidden sm:flex items-center space-x-4">
              <Link
                href="/login"
                className="text-brand-cream hover:text-brand-accent px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-gradient-brand hover:shadow-brand text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Register
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Authentication Links (when not logged in) */}
      {!user && (
        <div className="sm:hidden border-t border-brand-slate/30 bg-brand-slate/50 backdrop-blur-sm">
          <div className="flex gap-2 px-3 py-3">
            <Link
              href="/login"
              className="flex-1 text-center text-brand-cream hover:text-brand-accent px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex-1 bg-gradient-brand hover:shadow-brand text-white font-semibold text-sm py-2 px-3 rounded-lg transition-all duration-200 text-center"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}