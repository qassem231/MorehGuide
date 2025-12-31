'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export default function Chat() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('🔐 [CHAT PAGE]: Checking authorization...');

    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      console.warn('⚠️ [CHAT PAGE]: No token found, redirecting to /login');
      router.push('/login');
      return;
    }

    if (!storedUser) {
      console.warn('⚠️ [CHAT PAGE]: No user data found, redirecting to /login');
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      console.log(`✅ [CHAT PAGE]: User authorized: ${parsedUser.email}`);
      setUser(parsedUser);
      setIsAuthorized(true);
    } catch (error) {
      console.error('❌ [CHAT PAGE]: Failed to parse user data:', error);
      router.push('/login');
    }

    // Listen for auth state changes from LoginForm
    const handleAuthStateChanged = () => {
      console.log('🔄 [CHAT PAGE]: Auth state changed event received');
      const newToken = localStorage.getItem('token');
      const newUser = localStorage.getItem('user');

      if (newToken && newUser) {
        setUser(JSON.parse(newUser));
        setIsAuthorized(true);
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChanged);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, [router]);

  // Render loading state while checking authorization
  if (!isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-brand-cream items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
            <p className="text-brand-dark text-sm mt-4">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render chat interface once authorized
  return (
    <div className="flex h-[calc(100vh-64px)] bg-brand-dark">
      <Sidebar userRole={user?.role || 'user'} />
      <ChatArea />
    </div>
  );
}