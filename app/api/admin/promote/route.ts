'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { verifyToken } from '@/lib/auth/auth';
import User from '@/backend/models/User';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestingUser = await verifyToken(token);
    if (!requestingUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if requesting user is already admin
    const currentUser = await User.findById(requestingUser.userId);
    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can promote users' },
        { status: 403 }
      );
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email and promote to admin
    const userToPromote = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isAdmin: true },
      { new: true }
    ).select('-password');

    if (!userToPromote) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ [PROMOTE]: User ${email} promoted to admin`);

    return NextResponse.json({
      success: true,
      message: 'User promoted to admin',
      user: userToPromote,
    });
  } catch (error: any) {
    console.error('❌ [PROMOTE ERROR]:', error);
    return NextResponse.json(
      { error: 'Failed to promote user', details: error.message },
      { status: 500 }
    );
  }
}
