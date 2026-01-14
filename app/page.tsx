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
    <div className="h-full flex items-center justify-center bg-gradient-dark dark:bg-gradient-to-br dark:from-gray-50 dark:to-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-accent dark:border-blue-600 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
        <div className="text-brand-cream dark:text-gray-900 text-xl font-semibold">Loading...</div>
      </div>
    </div>
  );
}
