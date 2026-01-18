'use server';

import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  console.log('🔐 [AUTH]: Hashing password with bcryptjs');
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);
  console.log('✅ [AUTH]: Password hashed successfully');
  return hashedPassword;
}

/**
 * Verify a password against its bcryptjs hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.log('🔐 [AUTH]: Verifying password against hash');
  const isValid = await bcryptjs.compare(password, hash);
  if (isValid) {
    console.log('✅ [AUTH]: Password verified successfully');
  } else {
    console.log('❌ [AUTH]: Password verification failed');
  }
  return isValid;
}

/**
 * Sign a JWT token using jose
 * @param payload - User data to include in token (userId, email, role, etc)
 * @returns JWT token string
 */
export async function signToken(payload: {
  userId: string;
  email: string;
  role: string;
  isAdmin?: boolean;
  activeRole?: 'student' | 'lecturer';
}): Promise<string> {
  console.log(`🔑 [AUTH]: Signing JWT token for user: ${payload.email}`);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  console.log('✅ [AUTH]: JWT token signed successfully');
  return token;
}

/**
 * Verify a JWT token using jose
 * @param token - JWT token string to verify
 * @returns Decoded token payload or null if invalid
 */
export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
  isAdmin?: boolean;
  activeRole?: 'student' | 'lecturer';
} | null> {
  try {
    console.log('🔑 [AUTH]: Verifying JWT token');
    const verified = await jwtVerify(token, JWT_SECRET);
    console.log('✅ [AUTH]: JWT token verified successfully');
    return verified.payload as {
      userId: string;
      email: string;
      role: string;
      isAdmin?: boolean;
      activeRole?: 'student' | 'lecturer';
    };
  } catch (error) {
    console.error('❌ [AUTH]: JWT token verification failed:', error);
    return null;
  }
}
