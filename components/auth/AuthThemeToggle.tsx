"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/lib/ThemeContext";

export default function AuthThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur transition-colors duration-200 hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <>
          <FiMoon className="h-4 w-4" />
          <span className="hidden sm:inline">Dark mode</span>
        </>
      ) : (
        <>
          <FiSun className="h-4 w-4" />
          <span className="hidden sm:inline">Light mode</span>
        </>
      )}
    </button>
  );
}
