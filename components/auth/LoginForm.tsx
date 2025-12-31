'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 [LOGIN FORM]: Submitting login form');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token to localStorage SYNCHRONOUSLY and IMMEDIATELY
      console.log('💾 [LOGIN FORM]: Saving JWT token to localStorage');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Verify the token was actually saved
      const savedToken = localStorage.getItem('token');
      console.log('✅ [LOGIN FORM]: Token saved and verified:', !!savedToken);

      // Dispatch a custom event to notify other components that auth state changed
      const authChangeEvent = new Event('authStateChanged');
      window.dispatchEvent(authChangeEvent);

      // Give a tiny delay to ensure localStorage is committed before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log('✅ [LOGIN FORM]: Login successful, redirecting to /chat');
      router.push('/chat');
    } catch (error: any) {
      console.error('❌ [LOGIN FORM]: Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-brand-slate p-8 rounded-xl shadow-lg border border-brand-accent/20">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-cream">
          Sign in to your account
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full"
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}