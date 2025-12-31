'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/backend/models/User';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('🔐 [LOGIN API]: Received login request');

  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      console.warn('⚠️ [LOGIN API]: Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    console.log('🗄️ [LOGIN API]: Connecting to MongoDB');
    await connectToDatabase();

    // Find user by email
    console.log(`🔍 [LOGIN API]: Looking up user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.warn(`⚠️ [LOGIN API]: User not found: ${email}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    console.log(`🔐 [LOGIN API]: Verifying password for user: ${email}`);
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      console.warn(`⚠️ [LOGIN API]: Invalid password for user: ${email}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Sign JWT token
    console.log(`🔑 [LOGIN API]: Generating JWT token for user: ${email}`);
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    console.log(`✅ [LOGIN API]: Login successful for user: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [LOGIN API]: Login error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Login failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
