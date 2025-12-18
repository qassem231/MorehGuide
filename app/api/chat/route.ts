import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // Query knowledge_base collection for all documents
    const knowledgeBaseRef = collection(db, 'knowledge_base');
    const snapshot = await getDocs(knowledgeBaseRef);

    // Create a simple text prompt instead of multimodal
    const systemPrompt = `אתה עוזר חינוכי מועיל. תמיד ענה בעברית בלבד. ספק מידע ברור ומדויק.`;
    let prompt = systemPrompt + '\n\n';

    if (!snapshot.empty) {
      prompt += 'Based on the following documents, please answer the user\'s question:\n';
      // For now, just mention that documents are available
      prompt += `There are ${snapshot.docs.length} documents available for reference.\n\n`;
    }

    prompt += 'User question: ' + message;

    // Construct Gemini payload with simple text
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('Chat error:', error);

    // Handle specific Google AI errors
    if (error instanceof Object && 'status' in error) {
      const status = (error as any).status;
      if (status === 429) {
        return NextResponse.json({ error: 'API quota exceeded. Please check your Google AI Studio billing and rate limits.' }, { status: 429 });
      }
      if (status === 400) {
        return NextResponse.json({ error: 'Invalid request. Please check your message content.' }, { status: 400 });
      }
      if (status === 403) {
        return NextResponse.json({ error: 'Access forbidden. Please check your API key permissions.' }, { status: 403 });
      }
    }

    // Handle GoogleGenerativeAI specific errors
    if (error instanceof Error && error.message.includes('Response was blocked due to')) {
      return NextResponse.json({
        error: 'התגובה נחסמה על ידי מערכת הבטיחות של Google AI. אנא נסה לשאול שאלה אחרת או פנה למנהל המערכת.'
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}