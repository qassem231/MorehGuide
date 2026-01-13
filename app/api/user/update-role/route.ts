'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import User from '@/backend/models/User';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { role } = await request.json();

    // Validate role
    if (!role || !['student', 'lecturer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "student" or "lecturer"' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get the current user to preserve isAdmin status
    const currentUser = await User.findById(user.userId);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only update the role, PRESERVE isAdmin status
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        role: role  // Only update role
        // DO NOT touch isAdmin - preserve current value
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ [ROLE UPDATE]: User ${user.userId} role updated to ${role}, isAdmin preserved as ${updatedUser.isAdmin}`);

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('❌ [ROLE UPDATE ERROR]:', error);
    return NextResponse.json(
      { error: 'Failed to update role', details: error.message },
      { status: 500 }
    );
  }
}
