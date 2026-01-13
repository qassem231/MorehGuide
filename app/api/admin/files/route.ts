'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
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

async function verifyAdminAccess(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return null;
    
    const payload = await verifyToken(token);
    if (!payload) return null;

    await connectToDatabase();
    const user = await User.findById(payload.userId);
    
    if (!user || !user.isAdmin) {
      console.warn(`❌ [ADMIN FILES API]: Non-admin user ${payload.userId} attempted access`);
      return null;
    }

    return user;
  } catch (error) {
    console.error('❌ [ADMIN FILES API]: Auth verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const user = await verifyAdminAccess(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log(`✅ [ADMIN FILES API]: Admin ${user._id} fetching files`);
    
    const connection = await connectToDatabase();
    const db = connection.connection.db;
    
    const files = await db
      .collection('pdfdocuments')
      .find({})
      .project({ 
        fileData: 0, 
        content: 0,
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`📋 [ADMIN FILES API]: Retrieved ${files.length} files`);
    console.log(`📋 [ADMIN FILES API]: Sample file:`, files[0] || 'No files');
    
    return NextResponse.json(files);
  } catch (error: any) {
    console.error('❌ [ADMIN FILES API]: Error:', error);
    return NextResponse.json(
      { message: 'DB Error', details: error.message },
      { status: 500 }
    );
  }
}
