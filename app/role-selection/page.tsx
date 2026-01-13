'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiBookOpen, FiUserCheck } from 'react-icons/fi';

export const dynamic = 'force-dynamic';

function RoleSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === 'true';
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Server-side-like check: verify auth status before rendering UI
  useEffect(() => {
    console.log('🔐 [ROLE SELECTION]: Checking authentication status...');
    setIsCheckingAuth(true);

    try {
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const isAdmin = user.email === 'admin@admin.com' || user.isAdmin === true;
        
        if (isAdmin) {
          console.log('✅ [ROLE SELECTION]: Admin user detected, redirecting to /chat');
          router.push('/chat');
          return;
        }
      }
      
      console.log('✅ [ROLE SELECTION]: User is not admin, showing role selection');
      setIsCheckingAuth(false);
    } catch (error) {
      console.error('❌ [ROLE SELECTION]: Error checking admin status:', error);
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleRoleSelect = async (role: 'student' | 'lecturer') => {
    setIsLoading(true);
    setError('');
    setSelectedRole(role);

    try {
      // If guest mode, just store role locally
      if (isGuest) {
        console.log(`👤 [GUEST MODE]: Setting guest role to: ${role}`);
        localStorage.setItem('guestMode', 'true');
        localStorage.setItem('guestRole', role);
        
        // Create a guest user object
        const guestUser = {
          id: 'guest-' + Date.now(),
          name: 'Guest User',
          email: 'guest@moreguide.local',
          role: role === 'student' ? 'user' : 'admin',
          isGuest: true,
          isAdmin: false,
        };
        
        localStorage.setItem('user', JSON.stringify(guestUser));
        console.log('✅ Guest user stored in localStorage');

        // Dispatch event
        window.dispatchEvent(new Event('authStateChanged'));
        window.dispatchEvent(new Event('userDataUpdated'));

        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('✅ Redirecting to /chat');
        router.push('/chat');
        return;
      }

      // Regular authenticated role selection
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log(`🔄 Starting role selection for: ${role}`);

      // Simulate update({ activeRole: ... }) for session-only storage
      // This uses await pattern but stores only in localStorage (not MongoDB)
      const activeRole = role === 'student' ? 'student' : 'lecturer';
      
      // Store activeRole in localStorage (session-based, not persisted to DB)
      localStorage.setItem('activeRole', activeRole);
      console.log(`✅ Active role stored in localStorage: ${activeRole}`);

      // Also update user data to include activeRole
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.activeRole = activeRole;
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User object updated with activeRole');
      }

      // Dispatch event
      window.dispatchEvent(new Event('userDataUpdated'));

      // Wait briefly and redirect
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('✅ Redirecting to /chat');
      router.push('/chat');
    } catch (err: any) {
      console.error('❌ Error selecting role:', err);
      setError(err.message || 'Failed to select role');
      setSelectedRole(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-linear-to-br from-brand-dark via-brand-dark to-brand-slate flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Loading State - prevents UI flicker while checking auth */}
      {isCheckingAuth && (
        <div className="relative z-20 text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent"></div>
            <p className="text-brand-cream text-sm mt-4">Loading...</p>
          </div>
        </div>
      )}

      {/* Content - only render after auth check is complete */}
      {!isCheckingAuth && (
        <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-4">
            Welcome to MorehGuide
          </h1>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Student Card */}
          <button
            onClick={() => handleRoleSelect('student')}
            disabled={isLoading}
            className="group relative"
          >
            <div
              className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-all duration-300 cursor-pointer overflow-hidden
              ${selectedRole === 'student' && isLoading ? 'scale-95 opacity-50' : 'hover:scale-105 hover:border-blue-500/50'}
              ${selectedRole === 'student' ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                    <FiBookOpen className="w-12 h-12 text-blue-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-brand-cream mb-2">Student</h2>
                <p className="text-brand-light/70 text-sm">
                  Learn and explore course materials at your own pace
                </p>

                {selectedRole === 'student' && isLoading && (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </button>

          {/* Lecturer Card */}
          <button
            onClick={() => handleRoleSelect('lecturer')}
            disabled={isLoading}
            className="group relative"
          >
            <div
              className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-all duration-300 cursor-pointer overflow-hidden
              ${selectedRole === 'lecturer' && isLoading ? 'scale-95 opacity-50' : 'hover:scale-105 hover:border-purple-500/50'}
              ${selectedRole === 'lecturer' ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''}`}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                    <FiUserCheck className="w-12 h-12 text-purple-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-brand-cream mb-2">Lecturer</h2>
                <p className="text-brand-light/70 text-sm">
                  Create, manage, and share course materials with students
                </p>

                {selectedRole === 'lecturer' && isLoading && (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin inline-block w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center max-w-xl mx-auto">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-brand-light/50 text-sm">
          <p>You can change your role anytime in your account settings</p>
        </div>
      </div>
      )}
    </div>
  );
}

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={<div className='flex h-screen items-center justify-center bg-linear-to-br from-brand-dark via-brand-dark to-brand-slate'><div className='text-center'><div className='animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent'></div><p className='text-brand-cream text-sm mt-4'>Loading...</p></div></div>}>
      <RoleSelectionContent />
    </Suspense>
  );
}
