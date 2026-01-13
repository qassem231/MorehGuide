'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiMenu, FiX, FiSettings } from 'react-icons/fi';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
      console.log('👤 [NAVBAR]: Checking user - Token exists:', !!token);
      console.log('👤 [NAVBAR]: User data from localStorage:', userData);
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.log('👤 [NAVBAR]: Parsed user:', parsedUser);
        console.log('👤 [NAVBAR]: User role:', parsedUser.role);
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
      if (e.key === 'user') {
        console.log('🔄 [NAVBAR]: User storage changed, updating...');
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
    setUser(null);
    setIsDropdownOpen(false);

    // Dispatch event to notify other components
    const logoutEvent = new Event('authStateChanged');
    window.dispatchEvent(logoutEvent);

    // Refresh server state and redirect
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="bg-brand-dark border-b border-brand-slate/30 backdrop-blur-sm sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={user ? "/chat" : "/"} className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              MorehGuide
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center space-x-6">
            {user ? (
              <>
                <div className="flex items-center space-x-4">
                  {isSystemAdmin && (
                    <Link
                      href="/admin/files"
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200 border border-blue-500/30"
                    >
                      Manage Files
                    </Link>
                  )}
                  
                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 hover:bg-brand-slate/50 px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center overflow-hidden">
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
                        <p className="text-xs text-emerald-400 font-semibold leading-none" style={{textTransform: 'capitalize'}}>{user.role}</p>
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-brand-slate/95 backdrop-blur-sm border border-brand-slate/50 rounded-lg shadow-lg overflow-hidden animate-in fade-in">
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-4 py-3 text-brand-cream hover:bg-brand-slate/80 transition-colors border-b border-brand-slate/30"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FiSettings className="w-4 h-4" />
                          Account Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/20 transition-colors text-left"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden text-brand-cream hover:text-brand-accent transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden bg-brand-slate/50 border-t border-brand-slate/30 backdrop-blur-sm">
          <div className="px-4 py-4 space-y-4">
            {user ? (
              <>
                <div className="text-right mb-4 flex items-center gap-3 justify-end">
                  <div>
                    <p className="text-xs text-brand-light/70">{user.name}</p>
                    <p className="text-xs text-emerald-400 font-semibold" style={{textTransform: 'capitalize'}}>{user.role}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center overflow-hidden">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-xs">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                </div>
                {user.isAdmin && (
                  <Link
                    href="/admin/files"
                    className="block text-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200 border border-blue-500/30"
                  >
                    Manage Files
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="block text-center bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200 border border-purple-500/30"
                >
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200 border border-red-500/30"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-brand-cream hover:text-brand-accent px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block bg-gradient-brand hover:shadow-brand text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}