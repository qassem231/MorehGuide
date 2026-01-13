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
  const [isGuest, setIsGuest] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        'שלום! אני עוזר ה-AI של המכללה האקדמית בראודה. אני יכול לסייע במידע על נהלים ותקנות במכללה, בהתבסס על נתונים מאתר המכללה.',
    },
  ]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    console.log('🔐 [CHAT PAGE]: Checking authorization...');

    // Check guest mode first
    const guestMode = localStorage.getItem('guestMode') === 'true';
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const activeRole = localStorage.getItem('activeRole');

    // Allow access if either: 1) has token or 2) is in guest mode
    if (!token && !guestMode) {
      console.warn('⚠️ [CHAT PAGE]: No token and not guest, redirecting to /login');
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
      console.log(`👤 [CHAT PAGE]: Guest mode: ${guestMode}`);
      
      // Merge activeRole from localStorage if it exists
      if (activeRole) {
        parsedUser.activeRole = activeRole;
        console.log(`✅ [CHAT PAGE]: activeRole merged: ${activeRole}`);
      }
      
      setUser(parsedUser);
      setIsGuest(guestMode);
      setIsAuthorized(true);
    } catch (error) {
      console.error('❌ [CHAT PAGE]: Failed to parse user data:', error);
      router.push('/login');
    }
  }, [router]);

  const handleChatSelect = (chatId: string | null) => {
    console.log('handleChatSelect called with:', chatId);
    setCurrentChatId(chatId);
    
    // If chatId is null (New Chat), clear messages and show initial greeting
    if (chatId === null) {
      console.log('Clearing messages for new chat');
      setMessages([
        {
          role: 'assistant',
          content:
            'שלום! אני עוזר ה-AI של המכללה האקדמית בראודה. אני יכול לסייע במידע על נהלים ותקנות במכללה, בהתבסס על נתונים מאתר המכללה.',
        },
      ]);
    }
  };

  const handleChatIdChange = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleNewChatCreated = () => {
    // Trigger sidebar to refresh the chat list
    setRefreshTrigger((prev) => prev + 1);
  };

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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-brand-dark">
      {!isAuthorized ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-dark via-brand-slate to-brand-dark">
          <div className="text-center">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-brand-accent/30 border-t-brand-accent rounded-full mb-4"></div>
            <p className="text-brand-light">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          <Sidebar
            userRole={user?.role}
            currentChatId={currentChatId}
            onChatSelect={handleChatSelect}
            refreshTrigger={refreshTrigger}
            isGuest={isGuest}
          />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ChatArea 
              key={currentChatId}
              currentChatId={currentChatId} 
              messages={messages}
              setMessages={setMessages}
              onChatIdChange={handleChatIdChange}
              onNewChatCreated={handleNewChatCreated}
              isGuest={isGuest}
            />
          </div>
        </>
      )}
    </div>
  );
}