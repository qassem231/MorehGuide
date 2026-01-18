'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { verifyToken } from '@/lib/auth/auth';
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

/**
 * POST /api/admin/migrate
 * Migrates existing PDF documents to add audience field
 * Sets all existing documents to 'everyone' audience
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId);

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    console.log(`🔄 [MIGRATE API]: Starting migration for admin ${user._id}`);

    const connection = await connectToDatabase();
    const db = connection.connection.db;

    // Update all documents without audience field to have audience: 'everyone'
    const result = await db.collection('pdfdocuments').updateMany(
      { audience: { $exists: false } },
      { $set: { audience: 'everyone' } }
    );

    console.log(`✅ [MIGRATE API]: Migration complete. Updated ${result.modifiedCount} documents`);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('❌ [MIGRATE API]: Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
