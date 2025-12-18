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

    // Build a single concatenated prompt (fail-safe) with the Hebrew rules
    const hebrewRules = `אתה עוזר מומחה המענה על שאלות בהתבסס אך ורק על המסמכים PDF המסופקים.

ענה תמיד רק בעברית, ללא קשר לשפה שבה שאל המשתמש.

המסמכים ההקשר המסופקים הם בעברית. נתח אותם לעומק.

כל פעם שאתה מציין עובדה, אתה חייב לציין את המקור: סעיף, עמוד, או פסקה מההקשר (למשל, '[מקור: סעיף 4.2]').

עצב את התשובה בצורה ברורה באמצעות Markdown:
- השתמש **מודגש** למונחים מרכזיים.
- השתמש ברשימות נקודות לרשימות.
- השתמש ### כותרות להפרדת נושאים.

אם התשובה לא נמצאת במסמכים, השב בדיוק: "לא מצאתי את המידע הזה במסמכים שהעלית. האם תרצה שאחפש נושא אחר?"`;

    // Header + context + user question all concatenated into one string
    let finalPrompt = 'System Instructions: ' + hebrewRules + '\n\n';

    finalPrompt += 'Context from files:\n';
    if (!snapshot.empty) {
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const content = data.content || data.text || JSON.stringify(data);
        finalPrompt += `Document ${index + 1}:\n${content}\n\n`;
      });
    } else {
      finalPrompt += 'No documents available.\n\n';
    }

    finalPrompt += 'User Question: ' + message;

    // Construct Gemini payload with simple text
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(finalPrompt);

    console.log('Raw Gemini Response:', JSON.stringify(result, null, 2));

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