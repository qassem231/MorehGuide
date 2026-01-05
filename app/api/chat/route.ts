'use server';

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchKnowledgeBaseMenu,
  selectRelevantDocument,
  generateGeneralResponse,
  generateContextualResponse,
  uploadFileToGeminiForChat,
} from '@/backend/gemini';

import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import ChatHistory from '@/backend/models/ChatHistory';

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
 * Returns the current user's saved chat messages.
 */
export async function GET(request: NextRequest) {
  console.log('📥 [CHAT API]: Received Chat History Request (GET)');

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

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
 * Generates an answer (same as before), then appends user + assistant messages
 * to the current user's chat history.
 */
export async function POST(request: NextRequest) {
  console.log('📨 [CHAT API]: Received Chat Request (POST)');

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    console.log(`💬 [CHAT API]: User message: "${message}"`);

    let selectedDocId = 'NONE';
    let geminiFileUri = '';

    // STEP 1: Fetch lightweight knowledge base menu (IDs, filenames, metadata only)
    console.log('📋 [CHAT API]: Step 1 - Fetching knowledge base menu');
    const menu = await fetchKnowledgeBaseMenu();

    // STEP 2: Use Gemini to select the most relevant document
    if (menu && menu.trim() !== '') {
      console.log('🔍 [CHAT API]: Step 2 - Selecting relevant document');
      selectedDocId = await selectRelevantDocument(message, menu);

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

    // STEP 5: Persist chat history (append user + assistant)
    await connectToDatabase();

    const now = new Date();
    const userMsg = { role: 'user' as const, content: String(message), createdAt: now };
    const assistantMsg = { role: 'assistant' as const, content: String(finalResponse), createdAt: new Date() };

    // Keep history from growing forever (last 200 messages)
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
