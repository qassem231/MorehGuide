'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { ObjectId } from 'mongodb';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    console.log(`🗑️  [DELETE FILE]: Attempting to delete file with ID: ${fileId}`);

    const connection = await connectToDatabase();
    const db = connection.connection.db;

    // Convert string to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(fileId);
    } catch (err) {
      console.error('Invalid ObjectId format:', fileId);
      return NextResponse.json({ error: 'Invalid file ID format' }, { status: 400 });
    }

    // Try multiple collection names
    const collectionNames = ['files', 'uploads', 'documents', 'pdfdocuments'];
    let deleted = false;
    let attempts = [];

    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        const result = await collection.deleteOne({ _id: objectId });
        attempts.push(`${collectionName}: ${result.deletedCount} deleted`);

        if (result.deletedCount > 0) {
          console.log(`✅ [DELETE FILE]: File deleted from ${collectionName}`);
          deleted = true;
          break;
        }
      } catch (collErr) {
        console.warn(`Could not query ${collectionName}:`, collErr);
        attempts.push(`${collectionName}: error`);
      }
    }

    if (!deleted) {
      console.log('Delete attempts:', attempts);
      return NextResponse.json(
        { error: 'File not found in any collection', attempts },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      fileId: fileId,
    });
  } catch (error: any) {
    console.error('❌ [DELETE FILE] Error:', error);
    return NextResponse.json(
      { error: `Delete failed: ${error.message}` },
      { status: 500 }
    );
  }
}
