'use server';

import { GoogleAIFileManager } from '@google/generative-ai/server';
import { connectToDatabase } from '@/lib/db/connection';
import { PdfDocument } from '@/backend/models/PdfDocument';
import { getModel } from '@/backend/services/gemini';
import fs from 'fs';
import path from 'path';

const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);

/**
 * Convert uploaded File to Buffer
 * @param file - File object from form submission
 * @returns Object containing buffer and filename
 */
export async function uploadPdfToMongoDB(file: File): Promise<{ buffer: Buffer; fileName: string }> {
  console.log(`🟢 [UPLOAD]: Starting processing for file: ${file.name}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  console.log(`✅ [UPLOAD]: File converted to Buffer. Size: ${buffer.length} bytes`);

  return { buffer, fileName: file.name };
}

/**
 * Upload file to Google's Gemini File API
 * @param file - File object
 * @param buffer - File buffer
 * @returns URI and MIME type of uploaded file
 */
export async function uploadFileToGeminiAPI(
  file: File,
  buffer: Buffer
): Promise<{ uri: string; mimeType: string }> {
  console.log('🟡 [GEMINI UPLOAD]: Uploading to Google File API...');

  try {
    const uploadResponse = await fileManager.uploadFile(buffer, {
      mimeType: file.type || 'application/pdf',
      displayName: file.name,
    });

    console.log(`🟢 [GEMINI UPLOAD]: File upload complete. URI: ${uploadResponse.file.uri}`);

    // Wait for the file to be active
    let file_status = uploadResponse.file;
    while (file_status.state === 'PROCESSING') {
      console.log('File is still processing. Waiting...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      file_status = await fileManager.getFile(uploadResponse.file.name);
    }

    if (file_status.state !== 'ACTIVE') {
      throw new Error(`File upload failed. State: ${file_status.state}`);
    }

    console.log('File is now ACTIVE and ready to use.');
    return {
      uri: file_status.uri,
      mimeType: file_status.mimeType,
    };
  } catch (error) {
    console.error('Error uploading to Gemini File API:', error);
    throw new Error('Failed to upload file to Gemini API');
  }
}

/**
 * Extract metadata from PDF using Gemini
 * Analyzes document to generate summary, keywords, and category
 * @param geminiFileUri - URI of file in Gemini
 * @param fileName - Original filename
 * @returns Object with summary, keywords, and category
 */
export async function extractMetadataFromFile(
  geminiFileUri: string,
  fileName: string
): Promise<{ summary: string; keywords: string[]; category: string }> {
  console.log('🟡 [METADATA]: Generating summary with Gemini...');

  const model = await getModel();

  const analysisPrompt = `Analyze this document. It is in Hebrew. Return ONLY a valid JSON object with this exact format: { "summary": "2 sentence description in Hebrew", "keywords": ["tag1", "tag2", "tag3"], "category": "General" }. Do not include markdown code blocks or any other text.`;

  try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: 'application/pdf',
          fileUri: geminiFileUri,
        },
      },
      {
        text: analysisPrompt,
      },
    ]);

    const responseText = result.response.text();
    console.log('Raw Gemini response:', responseText);

    let jsonStr = responseText.trim();
    
    // Try to extract JSON from code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to extract JSON object from text
    const objectMatch = responseText.match(/\{[\s\S]*\}/);
    if (objectMatch && !jsonStr.includes('{')) {
      jsonStr = objectMatch[0];
    }

    console.log('Parsed JSON string:', jsonStr);
    const metadata = JSON.parse(jsonStr);

    if (!metadata.summary || !Array.isArray(metadata.keywords) || !metadata.category) {
      console.warn('Invalid metadata structure, using defaults');
      return {
        summary: `Document: ${fileName}`,
        keywords: ['document', 'pdf'],
        category: 'General',
      };
    }

    console.log('Metadata extracted successfully:', metadata);
    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    
    // Return default metadata instead of throwing error
    console.log('Using default metadata due to extraction error');
    return {
      summary: `Document: ${fileName}`,
      keywords: ['document', 'pdf'],
      category: 'General',
    };
  }
}

/**
 * Save PDF document to MongoDB
 * @param fileName - Document filename
 * @param fileBuffer - File binary data
 * @param metadata - Document metadata (summary, keywords, category)
 * @param audience - Who can access ('student', 'lecturer', or 'everyone')
 * @returns MongoDB document ID
 */
export async function savePdfDocumentToMongoDB(
  fileName: string,
  fileBuffer: Buffer,
  metadata: { summary: string; keywords: string[]; category: string },
  audience: 'student' | 'lecturer' | 'everyone' = 'everyone'
): Promise<string> {
  console.log(`🟢 [DB]: Saving PDF document to MongoDB with audience: ${audience}...`);
  
  await connectToDatabase();

  try {
    const newDocument = await PdfDocument.create({
      fileName,
      fileData: fileBuffer,
      contentType: 'application/pdf',
      metadata,
      audience,
      createdAt: new Date(),
    });

    console.log(`✅ [DB]: Document saved to MongoDB with ID: ${newDocument._id} and audience: ${audience}`);
    return newDocument._id.toString();
  } catch (error) {
    console.error('Error saving document to MongoDB:', error);
    throw new Error('Failed to save document to MongoDB');
  }
}
