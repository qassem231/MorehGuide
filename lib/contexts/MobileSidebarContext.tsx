'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface MobileSidebarContextType {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType | undefined>(undefined);

/**
 * Provider component for mobile sidebar state
 * Wraps app to make sidebar context available to all components
 */
export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  return (
    <MobileSidebarContext.Provider
      value={{
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </MobileSidebarContext.Provider>
  );
}

/**
 * Hook to use mobile sidebar context
 * @returns Mobile sidebar state and controls
 * @throws Error if used outside MobileSidebarProvider
 */
export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext);
  if (!context) {
    throw new Error('useMobileSidebar must be used within MobileSidebarProvider');
  }
  return context;
}
