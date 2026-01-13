'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📝 [REGISTER FORM]: Submitting registration form');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('✅ [REGISTER FORM]: Registration successful');
      
      // Auto-login after successful registration
      if (data.token) {
        console.log('💾 [REGISTER FORM]: Auto-logging in with received token');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Dispatch auth state change event
        const authChangeEvent = new Event('authStateChanged');
        window.dispatchEvent(authChangeEvent);

        // Give a tiny delay to ensure localStorage is committed
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('✅ [REGISTER FORM]: Refreshing server state');
        router.refresh();

        console.log('✅ [REGISTER FORM]: Redirecting to /chat');
        router.push('/chat');
      } else {
        // If no token returned, redirect to login
        router.push('/login');
      }
    } catch (error: any) {
      console.error('❌ [REGISTER FORM]: Registration error:', error);
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-brand-slate/50 backdrop-blur-sm p-8 rounded-2xl shadow-brand border border-brand-slate/50">
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-brand-light">Join MorehGuide to get started</p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleRegister}>
        <div className="space-y-5">
          <Input
            id="name"
            name="name"
            type="text"
            label="Full name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

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
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
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
          Register
        </Button>
      </form>
      <p className="text-center text-sm text-brand-light">
        Already have an account?{' '}
        <a href="/login" className="text-brand-accent hover:text-blue-400 font-semibold transition-colors">
          Sign in
        </a>
      </p>
    </div>
  );
}