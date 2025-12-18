import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Convert file to buffer for upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to Gemini using GoogleAIFileManager
    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
    const uploadResponse = await fileManager.uploadFile(fileBuffer, {
      mimeType: file.type,
      displayName: file.name,
    });

    // Save to Firestore knowledge_base collection
    const docRef = await addDoc(collection(db, 'knowledge_base'), {
      name: file.name,
      uri: uploadResponse.file.uri,
      mimeType: uploadResponse.file.mimeType,
      uploadedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      fileId: docRef.id,
      name: file.name,
      uri: uploadResponse.file.uri
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}