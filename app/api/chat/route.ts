import { NextRequest, NextResponse } from 'next/server';
import {
  fetchKnowledgeBaseMenu,
  selectRelevantDocument,
  generateGeneralResponse,
  generateContextualResponse,
  uploadFileToGeminiForChat,
} from '@/backend/gemini';

export async function POST(request: NextRequest) {
  console.log('📨 [CHAT API]: Received Chat Request');
  
  try {
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
        console.log(`📤 [CHAT API]: Step 3 - Uploading selected document to Gemini`);
        try {
          const uploadedFile = await uploadFileToGeminiForChat(selectedDocId);
          geminiFileUri = uploadedFile.uri;
          console.log(`✅ [CHAT API]: Document uploaded successfully`);
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