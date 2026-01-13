# Chat Functionality Refactor - Complete Implementation Guide

## Overview
The chat system now uses MongoDB to persist chat sessions and supports viewing previous chats from the sidebar.

## Architecture

### 1. **Database Schema (MongoDB)**
Each chat is stored as a unique document in the `Chat` collection:

```
Chat Document {
  _id: ObjectId (MongoDB auto-generated)
  chatId: UUID (unique identifier for the chat)
  userId: string (user's ID from token)
  title: string (first 50 chars of first message - shown in sidebar)
  messages: [
    { role: 'user'|'assistant', content: string, createdAt: Date },
    ...
  ]
  createdAt: Date
  updatedAt: Date
}
```

### 2. **API Routes**

#### **GET /api/chats**
- **Purpose**: Fetch all chat titles and IDs for the sidebar
- **Response**: `{ chats: [{ chatId: string, title: string }, ...] }`
- **Auth**: Required (Bearer token)
- **Flow**: Used by Sidebar to display Recent Chats

#### **POST /api/chats**
- **Purpose**: Create new chat or add user message to existing chat
- **Body**: `{ chatId?: string, message: string, isFirstMessage?: boolean }`
- **Response**: `{ chatId: string, isNewChat: boolean, chat: { chatId, title } }`
- **Auth**: Required
- **Flow**:
  1. If no `chatId`: Creates new chat with auto-generated UUID and title from message
  2. If `chatId` provided: Adds user message to existing chat

#### **GET /api/chat?chatId=<id>**
- **Purpose**: Fetch all messages for a specific chat
- **Query**: `chatId` (optional - if not provided, uses legacy ChatHistory)
- **Response**: `{ messages: [...] }`
- **Auth**: Required
- **Flow**: Used by ChatArea to load message history when switching chats

#### **POST /api/chat**
- **Purpose**: Generate AI response and save both user and assistant messages
- **Body**: `{ message: string, chatId: string }`
- **Response**: `{ response: string, selectedDocId: string, usedContext: boolean }`
- **Auth**: Required
- **Flow**:
  1. Generates AI response using Gemini API
  2. Saves assistant message to Chat collection
  3. Returns generated response

### 3. **Component Flow**

#### **Chat Page (`/app/chat/page.tsx`)**
- Manages `currentChatId` state
- Manages `refreshTrigger` to tell Sidebar when to reload chat list
- Passes `onNewChatCreated` callback to ChatArea
- Passes `refreshTrigger` prop to Sidebar

#### **Sidebar (`/components/chat/Sidebar.tsx`)**
- Fetches chats from `GET /api/chats` on mount and when `refreshTrigger` changes
- Displays list of recent chats
- "New Chat" button sets `currentChatId` to `null`
- Clicking a chat calls `onChatSelect(chatId)`
- Current chat is highlighted with border and background

#### **ChatArea (`/components/chat/ChatArea.tsx`)**
- **Load Message History**: `useEffect` runs when `currentChatId` changes
  - If `currentChatId` is null: Shows initial greeting
  - If `currentChatId` has value: Fetches messages from `GET /api/chat?chatId=...`

- **Send Message Flow**:
  1. User types and clicks Send
  2. If no `currentChatId`: Creates new chat via `POST /api/chats` (saves first message)
  3. Calls `onChatIdChange(newChatId)` to update parent
  4. Calls `onNewChatCreated()` to trigger Sidebar refresh
  5. Gets AI response via `POST /api/chat` (saves assistant response)
  6. Displays both messages to user

### 4. **Key Features**

✅ **Persistent Chat History**: All chats stored in MongoDB
✅ **Sidebar Integration**: Recent chats loaded from database
✅ **No Duplicates**: Clicking existing chat loads it (doesn't create new one)
✅ **New Chat Button**: Resets to initial state (currentChatId = null)
✅ **Auto-title Generation**: First message becomes chat title
✅ **Message History Loading**: Full history loads when switching chats
✅ **Proper State Management**: Parent component coordinates between Sidebar and ChatArea

## Message Flow Diagram

### Creating a New Chat:
```
User sends message in empty ChatArea
  ↓
POST /api/chats (create new chat with first message)
  ↓ chatId returned
ChatArea calls onChatIdChange(chatId)
  ↓ currentChatId updated in parent
ChatArea calls onNewChatCreated()
  ↓ refreshTrigger incremented
Sidebar re-fetches GET /api/chats
  ↓ new chat appears in sidebar
POST /api/chat (get AI response, save assistant message)
  ↓
Display response to user
```

### Opening Existing Chat:
```
User clicks chat in sidebar
  ↓
onChatSelect(chatId) called
  ↓ currentChatId updated
ChatArea useEffect triggered
  ↓
GET /api/chat?chatId=... fetches message history
  ↓
Messages displayed in ChatArea
```

## Testing Checklist

- [ ] Create a new chat and verify it appears in sidebar
- [ ] Click existing chat and verify message history loads
- [ ] Click "New Chat" button and verify it resets
- [ ] Send message in new chat and verify it saves
- [ ] Refresh page and verify chat history persists
- [ ] Switch between multiple chats and verify correct messages load
- [ ] Verify chat titles are truncated to first message

## Database Queries Used

1. **Get all user chats (sidebar)**:
   ```javascript
   Chat.find({ userId }, { chatId, title }).sort({ createdAt: -1 })
   ```

2. **Get chat messages**:
   ```javascript
   Chat.findOne({ chatId, userId }).lean()
   ```

3. **Create new chat**:
   ```javascript
   Chat.create({ chatId, userId, title, messages: [...] })
   ```

4. **Add message to chat**:
   ```javascript
   Chat.findOneAndUpdate({ chatId, userId }, { $push: { messages } })
   ```
