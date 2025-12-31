import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/backend/models/User';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('📝 [REGISTER API]: Received registration request');

  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      console.warn('⚠️ [REGISTER API]: Missing required fields');
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.warn('⚠️ [REGISTER API]: Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    console.log('🗄️ [REGISTER API]: Connecting to MongoDB');
    await connectToDatabase();

    // Check if email already exists
    console.log(`🔍 [REGISTER API]: Checking if email ${email} already exists`);
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.warn(`⚠️ [REGISTER API]: Email ${email} already registered`);
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    console.log('🔐 [REGISTER API]: Hashing password');
    const hashedPassword = await hashPassword(password);

    // Create new user
    console.log(`👤 [REGISTER API]: Creating new user: ${name} (${email})`);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
    });

    console.log(`✅ [REGISTER API]: User created successfully with ID: ${newUser._id}`);

    // Sign JWT token
    const token = await signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [REGISTER API]: Registration error:', error);

    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Email is already registered' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Registration failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
