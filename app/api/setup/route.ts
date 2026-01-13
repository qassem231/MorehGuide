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
 * POST /api/setup
 * Promote current user to admin (accessible before being admin)
 */
export async function POST(request: NextRequest) {
  console.log('📥 [SETUP API]: Received setup request');

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Update isAdmin flag and set role to 'admin'
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        isAdmin: true,
        role: 'admin',
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ [SETUP API]: User ${user.userId} promoted to admin`);

    // Generate new token with isAdmin flag
    const newToken = await signToken({
      userId: updatedUser._id.toString(),
      email: updatedUser.email,
      role: 'admin',
      isAdmin: true,
    });

    return NextResponse.json({
      success: true,
      message: 'User promoted to admin successfully!',
      token: newToken,
      user: {
        userId: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: 'admin',
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error('❌ [SETUP API]: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
