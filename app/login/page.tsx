'use client';

import LoginForm from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}