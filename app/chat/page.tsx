'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';

export default function Chat() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'lecturer' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Current Auth User:", currentUser?.uid);
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Fetched User Data:", userData);
          console.log("Fetched User Role:", userData.role);
          setUserRole(userData.role);
          console.log("Setting userRole to:", userData.role);
        } else {
          console.log("User document does not exist in Firestore");
        }
      } else {
        console.log("No authenticated user");
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Bouncer effect: redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log("User not authenticated, redirecting to login");
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    console.log("userRole state changed to:", userRole);
  }, [userRole]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-brand-cream items-center justify-center">
        <div className="text-brand-cream text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-brand-dark">
      <Sidebar userRole={userRole} />
      <ChatArea />
    </div>
  );
}