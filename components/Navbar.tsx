"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FiLogOut,
  FiMenu,
  FiX,
  FiSettings,
  FiChevronDown,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useMobileSidebar } from "@/lib/MobileSidebarContext";
import { useTheme } from "@/lib/ThemeContext";

interface NavbarProps {}

export default function Navbar({}: NavbarProps = {}) {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isMobileSidebarOpen, toggleMobileSidebar } = useMobileSidebar();
  const { theme, toggleTheme } = useTheme();

  // Simple admin check: email match OR isAdmin flag
  const isSystemAdmin =
    user && (user.email === "admin@admin.com" || user.isAdmin === true);

  useEffect(() => {
    // Check user on initial mount
    const checkUser = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      const activeRole = localStorage.getItem("activeRole");
      const guestMode = localStorage.getItem("guestMode") === "true";
      console.log("👤 [NAVBAR]: Checking user - Token exists:", !!token);

      setIsGuest(guestMode);
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        if (activeRole) {
          parsedUser.activeRole = activeRole;
        }
        setUser(parsedUser);
      } else if (guestMode && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    };

    checkUser();

    const handleAuthStateChanged = () => checkUser();
    const handleUserDataUpdated = () => checkUser();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "activeRole") {
        checkUser();
      }
    };

    window.addEventListener("authStateChanged", handleAuthStateChanged);
    window.addEventListener("userDataUpdated", handleUserDataUpdated);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
      window.removeEventListener("userDataUpdated", handleUserDataUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navbar on login and register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guestMode");
    localStorage.removeItem("guestRole");
    setUser(null);
    setIsGuest(false);
    setIsDropdownOpen(false);

    const logoutEvent = new Event("authStateChanged");
    window.dispatchEvent(logoutEvent);

    router.refresh();
    router.push("/login");
  };

  return (
    // FIX: Background is white in light mode, dark gray in dark mode
    <nav className="bg-gray-50 dark:bg-[#1e1f20] border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm z-10 shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Sidebar Toggle + Logo */}
          <div className="flex items-center gap-2 sm:gap-0">
            {pathname === "/chat" && (
              <button
                className="lg:hidden text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 -ml-2"
                onClick={toggleMobileSidebar}
                aria-label="Toggle sidebar"
              >
                {isMobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            )}

            <Link
              href={user && !isGuest ? "/chat" : "/"}
              className="flex items-center"
            >
              <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                MorehGuide
              </span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-200"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <FiMoon size={20} /> : <FiSun size={20} />}
            </button>

            {user && !isGuest ? (
              <div className="flex items-center gap-2">
                {isSystemAdmin && (
                  <Link
                    href="/admin/files"
                    // FIX: Standard blue text on light bg, lighter blue text on dark bg
                    className="hidden sm:block bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/30 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    Manage Files
                  </Link>
                )}

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 sm:gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-brand dark:bg-blue-500 flex items-center justify-center overflow-hidden">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-xs">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-none">
                        {user.name}
                      </p>
                      {/* Role Labels */}
                      {isGuest ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold leading-none">
                          Guest
                        </p>
                      ) : user.email === "admin@admin.com" ||
                        user.isAdmin === true ? (
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold leading-none">
                          Admin
                        </p>
                      ) : user.activeRole === "student" ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold leading-none">
                          Student
                        </p>
                      ) : (
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold leading-none">
                          Lecturer
                        </p>
                      )}
                    </div>
                    <FiChevronDown
                      className={`w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-transform duration-200 hidden sm:block ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-gray-50 dark:bg-[#1e1f20] backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in z-50 transition-colors duration-300">
                      <div className="sm:hidden px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {user.name}
                        </p>
                        <p className="text-sky-600 dark:text-sky-400 font-semibold capitalize">
                          {isGuest ? "Guest" : user.activeRole || user.role}
                        </p>
                      </div>

                      {isSystemAdmin && (
                        <Link
                          href="/admin/files"
                          className="sm:hidden flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Files
                        </Link>
                      )}

                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <FiSettings className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        // FIX: Standard red text on light bg, lighter red on dark bg
                        className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors text-left"
                      >
                        <FiLogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : pathname !== "/login" && pathname !== "/register" ? (
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-brand dark:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Register
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
