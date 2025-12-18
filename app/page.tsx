'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, redirect to chat
        router.push('/chat');
      } else {
        // User is logged out, redirect to login
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Show loading while checking auth state
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="text-brand-cream text-xl">Loading...</div>
    </div>
  );
}
