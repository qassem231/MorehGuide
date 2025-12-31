'use server';

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadPdfToMongoDB,
  uploadFileToGeminiAPI,
  extractMetadataFromFile,
  savePdfDocumentToMongoDB,
} from '@/backend/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    console.log(`📁 [UPLOAD ROUTE]: Processing PDF: ${file.name}`);

    // STEP 1: Convert File to Buffer
    console.log(`🔄 [UPLOAD ROUTE]: Converting file to buffer...`);
    const { buffer: fileBuffer } = await uploadPdfToMongoDB(file);

    // STEP 2: Upload to Gemini File API
    console.log(`🚀 [UPLOAD ROUTE]: Uploading to Gemini File API...`);
    const geminiFile = await uploadFileToGeminiAPI(file, fileBuffer);

    // STEP 3: Extract metadata from the file using Gemini
    console.log(`📝 [UPLOAD ROUTE]: Extracting metadata from document...`);
    const metadata = await extractMetadataFromFile(geminiFile.uri, file.name);

    // STEP 4: Save to MongoDB as Binary Blob
    console.log(`💾 [UPLOAD ROUTE]: Saving document to MongoDB...`);
    const docId = await savePdfDocumentToMongoDB(file.name, fileBuffer, metadata);

    console.log(`✅ [UPLOAD ROUTE]: Document saved successfully with ID: ${docId}`);

    return NextResponse.json({
      success: true,
      message: 'PDF processed and saved successfully',
      docId: docId,
      fileName: file.name,
      summary: metadata.summary,
    });
  } catch (error) {
    console.error('❌ [UPLOAD ROUTE]: Upload error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
