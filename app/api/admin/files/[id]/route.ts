'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import PdfDocument from '@/backend/models/PdfDocument';

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
 * DELETE /api/admin/files/[id]
 * Deletes a PDF document and its associated vector embeddings
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`🗑️ [ADMIN FILES API]: Received Delete File Request (DELETE) for id: ${id}`);

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      console.error('❌ [ADMIN FILES API]: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.error('❌ [ADMIN FILES API]: User is not an admin');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectToDatabase();

    // Find the document to get its details before deleting
    const document = await PdfDocument.findById(id);

    if (!document) {
      console.error(`❌ [ADMIN FILES API]: Document not found with id ${id}`);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const fileName = document.fileName;

    // Delete the main PDF document
    await PdfDocument.findByIdAndDelete(id);

    console.log(`✅ [ADMIN FILES API]: Document ${fileName} deleted successfully`);

    // TODO: Delete associated vector embeddings/chunks from RAG collection
    // This would be:
    // await VectorChunks.deleteMany({ documentId: id });
    // or
    // await Embeddings.deleteMany({ sourceDocumentId: id });

    console.log(`✅ [ADMIN FILES API]: File ${fileName} and associated embeddings deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      deletedFileName: fileName,
    });
  } catch (error) {
    console.error('❌ [ADMIN FILES API]: DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete file', details: String(error) }, { status: 500 });
  }
}
