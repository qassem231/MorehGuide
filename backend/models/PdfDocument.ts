'use server';

import mongoose, { Schema, Document } from 'mongoose';

export interface IPdfDocument extends Document {
  fileName: string;
  fileData: Buffer;
  contentType: string;
  metadata: {
    summary: string;
    keywords: string[];
    category: string;
  };
  geminiUri?: string;
  audience: 'student' | 'lecturer' | 'everyone';
  createdAt: Date;
}

const PdfDocumentSchema = new Schema<IPdfDocument>(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileData: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      default: 'application/pdf',
    },
    metadata: {
      summary: {
        type: String,
        required: true,
      },
      keywords: {
        type: [String],
        required: true,
      },
      category: {
        type: String,
        default: 'General',
      },
    },
    geminiUri: {
      type: String,
      default: null,
    },
    audience: {
      type: String,
      enum: ['student', 'lecturer', 'everyone'],
      default: 'everyone',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create index on metadata for faster queries
PdfDocumentSchema.index({ 'metadata.keywords': 1, 'metadata.category': 1 });

// Use existing model if it exists, otherwise create new one
export const PdfDocument =
  mongoose.models.PdfDocument || mongoose.model<IPdfDocument>('PdfDocument', PdfDocumentSchema);

export default PdfDocument;
