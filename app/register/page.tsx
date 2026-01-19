"use client";

import RegisterForm from "@/components/auth/RegisterForm";
import AuthThemeToggle from "@/components/auth/AuthThemeToggle";

export default function Register() {
  return (
    <div className="relative h-full flex items-center justify-center bg-gray-100 dark:bg-brand-dark py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <AuthThemeToggle />
      <RegisterForm />
    </div>
  );
}
