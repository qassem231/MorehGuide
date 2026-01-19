"use server";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Chat from "@/backend/models/Chat";
import { randomUUID } from "crypto";

/**
 * Extract JWT token from:
 * 1) Authorization: Bearer <token>
 * 2) Cookie named "token"
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = request.cookies.get("token")?.value;
  if (cookieToken && cookieToken.trim() !== "") {
    return cookieToken.trim();
  }

  return null;
}

async function getUserFromRequest(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  return await verifyToken(token);
}

/**
 * GET /api/chats
 * Returns all chats for the current user with chatId and title (for sidebar).
 * Guests cannot have persistent chats, so returns empty list.
 */
export async function GET(request: NextRequest) {
  console.log("📥 [CHATS API]: Received Get All Chats Request (GET)");

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log(
        "⚠️ [CHATS API]: Guest user requesting chats - returning empty list",
      );
      return NextResponse.json({ chats: [] });
    }

    await connectToDatabase();

    // Fetch all chats for this user, sorted by most recent first
    const chats = await Chat.find(
      { userId: user.userId },
      { _id: 1, chatId: 1, title: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      chats: chats.map((chat) => ({
        _id: chat._id?.toString ? chat._id.toString() : String(chat._id),
        chatId: chat.chatId,
        title: chat.title,
      })),
    });
  } catch (error) {
    console.error("❌ [CHATS API]: GET error:", error);
    return NextResponse.json(
      { error: "Failed to load chats" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chats
 * Creates a new chat or adds a message to an existing chat.
 * Body: { chatId?: string, message: string, isFirstMessage?: boolean }
 * - If chatId is not provided, creates a new chat with auto-generated ID
 * - If isFirstMessage is true, generates title from the message
 * Note: Guests cannot create persistent chats, so returns empty response
 */
export async function POST(request: NextRequest) {
  console.log("📨 [CHATS API]: Received Create/Update Chat Request (POST)");

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log("👥 [CHATS API]: Guest user - skipping chat creation");
      // Guests can't create chats, return empty chatId
      return NextResponse.json({ chatId: "", isNewChat: false });
    }

    const { chatId: providedChatId, message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    let chatId = providedChatId;

    // If no chatId provided, create a new chat
    if (!chatId) {
      chatId = randomUUID();

      // Generate title from first message (truncate to 50 chars)
      const title = message.substring(0, 50).trim();

      console.log(
        `📝 [CHATS API]: Creating new chat ${chatId} with title: "${title}"`,
      );

      const newChat = await Chat.create({
        chatId,
        userId: user.userId,
        title,
        messages: [
          {
            role: "user",
            content: message,
            createdAt: new Date(),
          },
        ],
      });

      return NextResponse.json({
        chatId,
        isNewChat: true,
        chat: {
          chatId: newChat.chatId,
          title: newChat.title,
        },
      });
    }

    // If chatId provided, add message to existing chat
    console.log(`💬 [CHATS API]: Adding message to chat ${chatId}`);

    const userMsg = {
      role: "user" as const,
      content: message,
      createdAt: new Date(),
    };

    const updatedChat = await Chat.findOneAndUpdate(
      { chatId, userId: user.userId },
      {
        $push: {
          messages: userMsg,
        },
      },
      { new: true },
    );

    if (!updatedChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({
      chatId,
      isNewChat: false,
      chat: {
        chatId: updatedChat.chatId,
        title: updatedChat.title,
      },
    });
  } catch (error) {
    console.error("❌ [CHATS API]: POST error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 },
    );
  }
}
