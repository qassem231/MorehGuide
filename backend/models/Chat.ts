'use server';

import mongoose, { Schema, Document } from 'mongoose';

export type ChatRole = 'user' | 'assistant';

export interface IChatMessage {
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export interface IChat extends Document {
  chatId: string;
  userId: string;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
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

const ChatSchema = new Schema<IChat>(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent model recompilation in development
const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
