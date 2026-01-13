'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePromoteToAdmin = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in. Please login first.');
        router.push('/login');
        return;
      }

      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to promote to admin');
        return;
      }

      setMessage(data.message);
      
      // Update localStorage with new token and user data
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.isAdmin = true;
      user.role = 'admin';
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update token to include isAdmin flag
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Dispatch events to ensure Navbar picks it up
      setTimeout(() => {
        window.dispatchEvent(new Event('authStateChanged'));
        window.dispatchEvent(new Event('userDataUpdated'));
      }, 100);

      // Redirect to admin files
      setTimeout(() => {
        router.refresh();
        setTimeout(() => router.push('/admin/files'), 500);
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-linear-to-br from-brand-dark via-brand-slate to-brand-dark flex items-center justify-center p-4">
      <div className="bg-brand-dark border border-brand-slate/30 rounded-lg p-8 max-w-md w-full shadow-lg">
        <h1 className="text-3xl font-bold text-brand-cream mb-4">Admin Setup</h1>
        <p className="text-brand-light mb-6">
          Click the button below to promote your account to admin. You'll then have access to file management and other admin features.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg text-sm">
            <p className="font-semibold">{message}</p>
            <p className="text-xs mt-2">Redirecting to file manager in 2 seconds...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePromoteToAdmin}
          disabled={isLoading}
          className="w-full bg-gradient-brand hover:shadow-brand text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Promoting...' : 'Promote to Admin'}
        </button>

        <p className="text-brand-light text-xs mt-4 text-center">
          After promotion, you'll have access to the admin dashboard.
        </p>

        <div className="mt-6 text-center">
          <Link href="/chat" className="text-brand-accent hover:text-brand-cream transition-colors text-sm">
            Back to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
