'use client';

import RegisterForm from '@/components/auth/RegisterForm';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}