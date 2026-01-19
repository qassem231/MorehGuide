"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/lib/ThemeContext";

export default function AuthThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="absolute right-6 top-6 p-3 rounded-full bg-white dark:bg-brand-slate/30 text-gray-800 dark:text-brand-cream shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border border-gray-200 dark:border-white/10 backdrop-blur-md z-50"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <FiMoon size={24} className="text-brand-accent" />
      ) : (
        <FiSun size={24} className="text-yellow-400" />
      )}
    </button>
  );
}