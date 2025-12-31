'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
                  <div className="text-right">
                    <p className="text-sm text-brand-light">Welcome back</p>
                    <p className="text-brand-cream font-semibold">{user.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 font-semibold py-2 px-4 rounded-lg transition-all duration-200 border border-red-500/30"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Logout
                  </button>
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
                <div className="text-right mb-4">
                  <p className="text-sm text-brand-light">Welcome back</p>
                  <p className="text-brand-cream font-semibold">{user.name}</p>
                </div>
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