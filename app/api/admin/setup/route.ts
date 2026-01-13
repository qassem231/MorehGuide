'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken, signToken } from '@/lib/auth';
import User from '@/backend/models/User';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken && cookieToken.trim() !== '') {
    return cookieToken.trim();
  }

  return null;
}

async function getUserFromRequest(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return await verifyToken(token);
}

/**
 * POST /api/admin/setup
 * Make current user an admin (development only)
 */
export async function POST(request: NextRequest) {
  console.log('📥 [ADMIN SETUP]: Received setup request');

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Update ONLY isAdmin flag - preserve their role choice (student/lecturer)
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        isAdmin: true
        // NOTE: Do NOT change role here - keep student/lecturer choice
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ [ADMIN SETUP]: User ${user.userId} promoted to admin with isAdmin: true`);

    // Generate new token with isAdmin flag
    const newToken = await signToken({
      userId: updatedUser._id.toString(),
      email: updatedUser.email,
      role: updatedUser.role,
      isAdmin: true,
    });

    return NextResponse.json({
      success: true,
      message: 'User promoted to admin. New token issued.',
      token: newToken,
      user: {
        userId: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('❌ [ADMIN SETUP]: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
