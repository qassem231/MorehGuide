'use client';

import { useState, useCallback } from 'react';
import Navbar from './Navbar';
import { usePathname } from 'next/navigation';

export default function NavbarWrapper() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleMobileSidebarToggle = useCallback((isOpen: boolean) => {
    setIsMobileSidebarOpen(isOpen);
  }, []);

  return (
    <Navbar onMobileSidebarToggle={handleMobileSidebarToggle} isMobileSidebarOpen={isMobileSidebarOpen} />
  );
}
