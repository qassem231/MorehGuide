'use server';

import mongoose, { Schema, Document } from 'mongoose';

export type ChatRole = 'user' | 'assistant';

export interface IChatMessage {
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export interface IChatHistory extends Document {
  userId: string;
  messages: IChatMessage[];
  updatedAt: Date;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

// Prevent model recompilation in development
const ChatHistory =
  mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);

export default ChatHistory;
