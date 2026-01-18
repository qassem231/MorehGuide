'use server';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { verifyToken } from '@/lib/auth/auth';
import Chat from '@/backend/models/Chat';

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
 * DELETE /api/chats/[id]
 * Deletes a specific chat by MongoDB _id
 * Path param: id (MongoDB _id)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params as required in Next.js 16+
  const { id } = await params;
  
  console.log(`🗑️ [CHATS API]: Received Delete Chat Request (DELETE) for id: ${id}`);

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      console.error('❌ [CHATS API]: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[CHATS API]: User ID: ${user.userId}, Chat MongoDB ID: ${id}`);

    const chatMongoId = id;

    await connectToDatabase();

    // Find and delete the chat, ensuring it belongs to the user
    // Mongoose will automatically convert the string to ObjectId
    const deletedChat = await Chat.findOneAndDelete(
      { _id: chatMongoId, userId: user.userId },
      { new: true }
    );

    if (!deletedChat) {
      console.error(`❌ [CHATS API]: Chat not found or unauthorized for user ${user.userId} with id ${chatMongoId}`);
      return NextResponse.json(
        { error: 'Chat not found or unauthorized' },
        { status: 404 }
      );
    }

    console.log(`✅ [CHATS API]: Chat ${deletedChat.chatId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
      deletedChatId: deletedChat.chatId,
    });
  } catch (error) {
    console.error('❌ [CHATS API]: DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete chat', details: String(error) }, { status: 500 });
  }
}
