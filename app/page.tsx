'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated via JWT token
    const token = localStorage.getItem('token');
    
    if (token) {
      // User is logged in, redirect to chat
      router.push('/chat');
    } else {
      // User is logged out, redirect to login
      router.push('/login');
    }
  }, [router]);

  // Show loading while checking auth state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="text-brand-cream text-xl font-semibold">Loading...</div>
      </div>
    </div>
  );
}
