'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        createdAt: serverTimestamp(),
        chatHistory: []
      });

      router.push('/login');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-brand-slate p-8 rounded-xl shadow-lg border border-brand-accent/20">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-cream">
          Create your account
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleRegister}>
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
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <div className="space-y-1">
            <label htmlFor="role" className="block text-sm font-medium text-brand-cream">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'student' | 'lecturer')}
              className="block w-full px-3 py-2 border border-brand-accent/20 bg-brand-slate text-brand-cream rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-all duration-200"
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>
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
          Register
        </Button>
      </form>
    </div>
  );
}