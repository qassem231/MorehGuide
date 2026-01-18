'use server';

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';

/**
 * Extract JWT token from request headers or cookies
 * @param request - NextRequest object
 * @returns Token string or null if not found
 */
export async function extractToken(request: NextRequest): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  // Fall back to cookie
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken && cookieToken.trim() !== '') {
    return cookieToken.trim();
  }

  return null;
}

/**
 * Verify and extract user from request
 * @param request - NextRequest object
 * @returns User object or null if token invalid/missing
 */
export async function getUserFromRequest(request: NextRequest) {
  const token = await extractToken(request);
  if (!token) return null;
  return await verifyToken(token);
}
