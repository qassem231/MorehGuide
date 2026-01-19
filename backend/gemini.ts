"use server";

/**
 * GEMINI AI INTEGRATION
 *
 * This file handles all communication with Google's Gemini AI model.
 *
 * Main Functions:
 * - generateResponse(): Takes user question + uploads PDFs to Gemini → returns AI answer
 * - fetchKnowledgeBaseMenu(): Gets list of all uploaded PDFs from database
 *
 * How it works:
 * 1. User asks a question in chat
 * 2. We fetch relevant PDFs from MongoDB based on user role
 * 3. We upload PDFs to Gemini temporarily
 * 4. Gemini reads the PDFs and answers the question
 * 5. We return the answer to the user
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { connectToDatabase } from "@/lib/db";
import { PdfDocument } from "@/backend/models/PdfDocument";
import fs from "fs";
import path from "path";
import os from "os";

// Initialize Gemini AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);

interface DocumentMetadata {
  summary: string;
  keywords: string[];
  category: string;
}

interface KnowledgeDoc {
  _id: string;
  fileName: string;
  metadata: DocumentMetadata;
}

export async function getModel() {
  return genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
}

export async function fetchKnowledgeBaseMenu(): Promise<string> {
  console.log(
    "📚 [FETCH MENU]: Fetching lightweight knowledge base documents...",
  );

  try {
    await connectToDatabase();

    const documents = await PdfDocument.find(
      {},
      "fileName metadata _id",
    ).lean();

    if (!documents || documents.length === 0) {
      console.log("📋 [FETCH MENU]: No documents found in knowledge base");
      return "";
    }

    const menu = documents
      .map((doc: KnowledgeDoc) => {
        return `ID: ${doc._id} | FileName: ${doc.fileName} | Summary: ${doc.metadata.summary} | Keywords: [${doc.metadata.keywords.join(", ")}]`;
      })
      .join("\n");

    console.log(
      `📋 [FETCH MENU]: Menu created with ${documents.length} documents`,
    );
    return menu;
  } catch (error) {
    console.error(
      "❌ [FETCH MENU]: Error fetching knowledge base menu:",
      error,
    );
    throw new Error("Failed to fetch knowledge base menu");
  }
}

export async function selectRelevantDocument(
  message: string,
  menu: string,
): Promise<string> {
  console.log(`🔍 [ROUTER]: Searching for documents relevant to: "${message}"`);

  if (!menu || menu.trim() === "") {
    console.log("🟡 [ROUTER]: No documents available in knowledge base");
    return "NONE";
  }

  const model = await getModel();

  const selectionPrompt = `User Question: ${message}

Here is a list of available documents:
${menu}

Which single document ID is most relevant to answer this question? Return ONLY the document ID. If none are relevant, return 'NONE'.`;

  try {
    const selectionResult = await model.generateContent(selectionPrompt);
    const selectionText = selectionResult.response.text().trim();

    const selectedDocId = selectionText.split("\n")[0].trim();

    if (selectedDocId === "NONE" || selectedDocId.length === 0) {
      console.log("⚠️ [ROUTER]: No relevant documents found for this query");
    } else {
      console.log(`✅ [ROUTER]: Found relevant Document ID: ${selectedDocId}`);
    }

    return selectedDocId;
  } catch (error) {
    console.error("❌ [ROUTER]: Error selecting relevant document:", error);

    // Check for rate limiting errors
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : "";
    if (
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("429") ||
      errorMessage.includes("quota")
    ) {
      console.warn(
        "⚠️ [ROUTER]: Rate limit detected during document selection, returning NONE",
      );
      return "NONE";
    }

    throw new Error("Failed to select relevant document");
  }
}

export async function generateGeneralResponse(
  message: string,
): Promise<string> {
  console.log(
    "💬 [GENERAL]: Generating general response (no document context)...",
  );

  const model = await getModel();

  const generalPrompt = `You are an AI assistant for Braude Academic College. You support students with information about college rules and regulations. You answer strictly based on the provided context. If the answer is not in the files provided, you will state that. Answer in Hebrew.

User Question: ${message}`;

  try {
    const result = await model.generateContent(generalPrompt);
    console.log("✅ [GENERAL]: Response generated successfully");
    return result.response.text();
  } catch (error) {
    console.error("❌ [GENERAL]: Error generating general response:", error);

    // Check for rate limiting errors
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : "";
    if (
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("429") ||
      errorMessage.includes("quota")
    ) {
      console.warn(
        "⚠️ [GENERAL]: Rate limit detected, returning friendly message",
      );
      return "⚠️ המערכת עמוסה כרגע עקב מגבלת שימוש. אנא נסה שוב בעוד מספר דקות.";
    }

    throw new Error("Failed to generate general response");
  }
}

export async function uploadFileToGeminiForChat(
  documentId: string,
): Promise<{ uri: string; mimeType: string }> {
  console.log(
    `📤 [UPLOAD]: Fetching document ${documentId} from MongoDB and uploading to Gemini...`,
  );

  try {
    await connectToDatabase();

    // Fetch the full document with binary data from MongoDB
    const document = await PdfDocument.findById(documentId).lean();

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    console.log(
      `🔎 [UPLOAD]: Retrieved document "${document.fileName}" from MongoDB`,
    );

    // Extract the Buffer from the document
    // Handle both standard Buffer and BSON Binary objects from Mongoose
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(document.fileData)) {
      fileBuffer = document.fileData;
    } else if ((document.fileData as any).buffer) {
      // Handle Mongoose BSON Binary object
      fileBuffer = Buffer.from((document.fileData as any).buffer);
    } else {
      // Fallback: attempt to convert to Buffer
      fileBuffer = Buffer.from(document.fileData);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("File data not found or empty in document");
    }

    console.log(
      `✅ [UPLOAD]: Buffer converted successfully. Size: ${fileBuffer.length} bytes`,
    );

    // Write buffer to temporary file for Gemini upload
    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, `${Date.now()}_${document.fileName}`);

    console.log(`💾 [UPLOAD]: Writing temporary file to ${tmpFilePath}`);
    fs.writeFileSync(tmpFilePath, fileBuffer);

    try {
      // Upload to Gemini File API
      console.log("🚀 [UPLOAD]: Uploading file to Gemini File API...");
      const uploadResponse = await fileManager.uploadFile(fileBuffer, {
        mimeType: document.contentType || "application/pdf",
        displayName: document.fileName,
      });

      console.log(
        `📌 [UPLOAD]: File uploaded to Gemini. URI: ${uploadResponse.file.uri}`,
      );

      // Wait for the file to be ACTIVE
      let fileStatus = uploadResponse.file;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (fileStatus.state === "PROCESSING" && attempts < maxAttempts) {
        console.log(
          `⏳ [UPLOAD]: File processing (attempt ${attempts + 1}/${maxAttempts})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        fileStatus = await fileManager.getFile(uploadResponse.file.name);
        attempts++;
      }

      if (fileStatus.state !== "ACTIVE") {
        throw new Error(
          `File failed to process. Final state: ${fileStatus.state}`,
        );
      }

      console.log("✅ [UPLOAD]: File is ACTIVE and ready for query");
      return {
        uri: fileStatus.uri,
        mimeType: fileStatus.mimeType,
      };
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
        console.log(`🧹 [UPLOAD]: Cleaned up temporary file`);
      }
    }
  } catch (error) {
    console.error("❌ [UPLOAD]: Error uploading file to Gemini:", error);
    throw new Error("Failed to upload file to Gemini API for chat");
  }
}

export async function generateContextualResponse(
  message: string,
  geminiFileUri: string,
): Promise<string> {
  console.log(
    "🤖 [GENERATION]: Sending prompt to Gemini with document context...",
  );

  const model = await getModel();

  const contextPrompt = `You are an AI assistant for Braude Academic College. The attached document contains official college rules and regulations in Hebrew. Answer the user's question based strictly on this document. If the information is not in the document, state that clearly. Answer in Hebrew.

User Question: ${message}`;

  try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "application/pdf",
          fileUri: geminiFileUri,
        },
      },
      {
        text: contextPrompt,
      },
    ]);

    console.log(
      "✅ [GENERATION]: Response generated successfully with document context",
    );
    return result.response.text();
  } catch (error) {
    console.error(
      "❌ [GENERATION]: Error generating contextual response:",
      error,
    );

    // Check for rate limiting errors
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : "";
    if (
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("429") ||
      errorMessage.includes("quota")
    ) {
      console.warn(
        "⚠️ [GENERATION]: Rate limit detected, returning friendly message",
      );
      return "⚠️ המערכת עמוסה כרגע עקב מגבלת שימוש. אנא נסה שוב בעוד מספר דקות.";
    }

    throw new Error("Failed to generate response with document context");
  }
}
