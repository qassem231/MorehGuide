'use server';

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchKnowledgeBaseMenu,
  selectRelevantDocument,
  generateGeneralResponse,
  generateContextualResponse,
  uploadFileToGeminiForChat,
} from '@/backend/services/gemini';

import { connectToDatabase } from '@/lib/db/connection';
import { verifyToken } from '@/lib/auth/auth';
import ChatHistory from '@/backend/models/ChatHistory';
import Chat from '@/backend/models/Chat';

/**
 * Extract JWT token from:
 * 1) Authorization: Bearer <token>
 * 2) Cookie named "token"
 */
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
 * GET /api/chat
 * Returns the chat messages for a specific chatId.
 * Query params: ?chatId=<id> (optional - if provided, fetch from Chat collection; otherwise use legacy ChatHistory)
 * Note: Guests cannot retrieve chat history (no user ID to query)
 */
export async function GET(request: NextRequest) {
  console.log('📥 [CHAT API]: Received Chat History Request (GET)');

  try {
    const user = await getUserFromRequest(request);
    // Guests cannot retrieve chat history (no persistent storage)
    if (!user) {
      console.log('⚠️ [CHAT API]: GET request without authentication (guest mode) - returning empty history');
      return NextResponse.json({ messages: [] });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    await connectToDatabase();

    // If chatId is provided, fetch from new Chat collection
    if (chatId) {
      const chat = await Chat.findOne({ chatId, userId: user.userId }).lean();
      return NextResponse.json({
        messages: chat?.messages ?? [],
      });
    }

    // Otherwise, fetch from legacy ChatHistory (for backward compatibility)
    const history = await ChatHistory.findOne({ userId: user.userId }).lean();

    return NextResponse.json({
      messages: history?.messages ?? [],
    });
  } catch (error) {
    console.error('❌ [CHAT API]: GET history error:', error);
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 });
  }
}

/**
 * POST /api/chat
 * Generates an answer (same as before), then appends user + assistant messages.
 * If chatId is provided in body, saves to Chat collection; otherwise to ChatHistory (legacy).
 * Note: Guests can chat but their messages are not persisted
 */
export async function POST(request: NextRequest) {
  console.log('📨 [CHAT API]: Received Chat Request (POST)');

  try {
    const user = await getUserFromRequest(request);
    const isGuest = !user;
    if (isGuest) {
      console.log('👥 [CHAT API]: Guest user making chat request (no persistence)');
    }

    const { message, chatId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    console.log(`💬 [CHAT API]: User message: "${message}"`);

    let selectedDocId = 'NONE';
    let geminiFileUri = '';

    // Get user's activeRole from token for future role-based filtering (guests have no role)
    console.log(`👤 [CHAT API]: User activeRole: ${user?.activeRole || 'guest'}`);

    // STEP 1: Fetch lightweight knowledge base menu (IDs, filenames, metadata only)
    console.log('📋 [CHAT API]: Step 1 - Fetching knowledge base menu');
    const menu = await fetchKnowledgeBaseMenu();

    // STEP 2: Use Gemini to select the most relevant document
    if (menu && menu.trim() !== '') {
      console.log('🔍 [CHAT API]: Step 2 - Selecting relevant document');
      selectedDocId = await selectRelevantDocument(message, menu);

      // TODO: Filter vector search results where audience matches user.activeRole or is set to 'everyone'
      // Example implementation:
      // const allowedAudiences = [user?.activeRole, 'everyone'];
      // filtered_docs = docs.filter(doc => allowedAudiences.includes(doc.audience));

      // STEP 3: If a document was selected, upload it to Gemini
      if (selectedDocId !== 'NONE' && selectedDocId.length > 0) {
        console.log('📤 [CHAT API]: Step 3 - Uploading selected document to Gemini');
        try {
          const uploadedFile = await uploadFileToGeminiForChat(selectedDocId);
          geminiFileUri = uploadedFile.uri;
          console.log('✅ [CHAT API]: Document uploaded successfully');
        } catch (docError) {
          console.warn(
            `⚠️ [CHAT API]: Could not upload document ${selectedDocId}, falling back to general chat`,
            docError
          );
          selectedDocId = 'NONE';
          geminiFileUri = '';
        }
      }
    } else {
      console.log('📭 [CHAT API]: No documents in knowledge base, using general chat');
    }

    // STEP 4: Generate response with or without context
    let finalResponse = '';

    if (selectedDocId === 'NONE' || !geminiFileUri) {
      console.log('🤖 [CHAT API]: Step 4 - Generating general response (no document context)');
      finalResponse = await generateGeneralResponse(message);
    } else {
      console.log(`🤖 [CHAT API]: Step 4 - Generating contextual response with document ${selectedDocId}`);
      finalResponse = await generateContextualResponse(message, geminiFileUri);
    }

    console.log('✅ [CHAT API]: Response generated successfully');

    // STEP 5: Persist chat history (skip for guests)
    if (!isGuest) {
      await connectToDatabase();

      const now = new Date();
      const userMsg = { role: 'user' as const, content: String(message), createdAt: now };
      const assistantMsg = { role: 'assistant' as const, content: String(finalResponse), createdAt: new Date() };

      if (chatId) {
        // Save to new Chat collection - save BOTH user and assistant messages
        await Chat.findOneAndUpdate(
          { chatId, userId: user.userId },
          {
            $push: {
              messages: {
                $each: [userMsg, assistantMsg],
              },
            },
          },
          { new: true }
        );
      } else {
        // Keep history from growing forever (last 200 messages)
        // Save to legacy ChatHistory collection
        await ChatHistory.findOneAndUpdate(
          { userId: user.userId },
          {
            $push: {
              messages: {
                $each: [userMsg, assistantMsg],
                $slice: -200,
              },
            },
          },
          { upsert: true, new: true }
        );
      }
    } else {
      console.log('👥 [CHAT API]: Guest user - skipping chat persistence');
    }

    return NextResponse.json({
      response: finalResponse,
      selectedDocId: selectedDocId,
      usedContext: selectedDocId !== 'NONE',
    });
  } catch (error) {
    console.error('❌ [CHAT API]: Chat error:', error);

    if (error instanceof Object && 'status' in error) {
      const status = (error as any).status;
      if (status === 429) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please check your Google AI Studio billing and rate limits.' },
          { status: 429 }
        );
      }
      if (status === 400) {
        return NextResponse.json({ error: 'Invalid request. Please check your message content.' }, { status: 400 });
      }
      if (status === 403) {
        return NextResponse.json({ error: 'Access forbidden. Please check your API key permissions.' }, { status: 403 });
      }
    }

    if (error instanceof Error && error.message.includes('Response was blocked due to')) {
      return NextResponse.json(
        {
          error: 'התגובה נחסמה על ידי מערכת הבטיחות של Google AI. אנא נסה לשאול שאלה אחרת או פנה למנהל המערכת.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
