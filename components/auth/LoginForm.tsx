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
    <div className="max-w-md w-full space-y-8 bg-brand-slate/50 backdrop-blur-sm p-8 rounded-2xl shadow-brand border border-brand-slate/50">
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-brand-light">Sign in to your MorehGuide account</p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-5">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm text-center p-3 rounded-lg border border-red-500/30 font-medium">{error}</div>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full py-3 text-base"
        >
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-brand-light">
        Don't have an account?{' '}
        <a href="/register" className="text-brand-accent hover:text-blue-400 font-semibold transition-colors">
          Register now
        </a>
      </p>
    </div>
  );
}