# MorehGuide - Complete Architecture & Implementation Documentation

**Last Updated:** January 13, 2026  
**Purpose:** Complete reference guide for understanding the entire MorehGuide chat application

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [React Hooks Explained](#react-hooks-explained)
3. [All Components Explained](#all-components-explained)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)
7. [The Bug Fix](#the-bug-fix)
8. [What Gets Saved & Where](#what-gets-saved--where)

---

## Architecture Overview

### Technology Stack
- **Frontend:** Next.js 14+ (React with TypeScript)
- **Backend:** Next.js API Routes (Server-Side)
- **Database:** MongoDB (with Mongoose ORM)
- **Auth:** JWT (JSON Web Tokens) with bcryptjs
- **AI:** Google Gemini API
- **Styling:** Tailwind CSS

### Project Structure
```
MorehGuide/
├── app/                      # Next.js App Router (pages & API routes)
│   ├── api/                  # Backend API endpoints
│   │   ├── auth/            # Authentication endpoints
│   │   ├── chat/            # Chat API endpoint
│   │   ├── chats/           # Chat management
│   │   ├── admin/           # Admin endpoints
│   │   └── upload/          # File upload endpoint
│   ├── chat/                # Main chat page
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── chat/               # Chat UI components
│   │   ├── ChatArea.tsx    # Main chat interface
│   │   └── Sidebar.tsx     # Chat list sidebar
│   └── auth/               # Authentication components
├── backend/                 # Backend logic
│   ├── models/             # MongoDB schemas
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   ├── ChatHistory.ts
│   │   └── PdfDocument.ts
│   ├── gemini.ts           # Gemini API integration
│   └── storage.ts          # File storage logic
├── lib/                    # Utility functions
│   ├── auth.ts            # JWT & password hashing
│   ├── db.ts              # MongoDB connection
│   └── MobileSidebarContext.tsx
└── public/                 # Static assets
```

---

## React Hooks Explained

### 1. **useState**
State management hook that creates reactive variables.

#### Usage in ChatArea.tsx:
```typescript
// Stores the user input in the message box
const [input, setInput] = useState('');

// Tracks loading state during API calls
const [isLoading, setIsLoading] = useState(false);

// Stores all messages in current chat
const [messages, setMessages] = useState<Message[]>([]);
```

**What it does:**
- `input` = What user types in the text box
- `setInput('')` = Clears the text after sending
- `isLoading` = Disables send button while waiting for response
- `messages` = All chat messages (user + bot) displayed on screen

#### Usage in Sidebar.tsx:
```typescript
// Stores list of all user's chats
const [chats, setChats] = useState<Chat[]>([]);

// Shows loading spinner while fetching chats
const [isLoading, setIsLoading] = useState(true);

// Stores current user info
const [user, setUser] = useState<any>(null);
```

#### Usage in Chat page (app/chat/page.tsx):
```typescript
// Tracks if user is logged in
const [isAuthorized, setIsAuthorized] = useState(false);

// Current user data (id, email, role)
const [user, setUser] = useState<User | null>(null);

// Is this user a guest or logged in?
const [isGuest, setIsGuest] = useState(false);

// Which chat is currently open?
const [currentChatId, setCurrentChatId] = useState<string | null>(null);

// All messages in current chat
const [messages, setMessages] = useState([...]);
```

### 2. **useEffect**
Runs code when component mounts or dependencies change.

#### Usage in ChatArea.tsx:
```typescript
// Load chat history when chatId changes
useEffect(() => {
  if (!currentChatId) return;
  
  const loadChatHistory = async () => {
    // Fetch messages from /api/chat?chatId=xxx
    const res = await fetch(`/api/chat?chatId=${currentChatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    // Display loaded messages
    setMessages(data.messages);
  };
  
  loadChatHistory();
}, [currentChatId]);  // Runs whenever currentChatId changes
```

**What it does:**
1. When you click on a chat in the sidebar, `currentChatId` changes
2. This useEffect automatically triggers
3. It fetches all messages for that chat from the database
4. It displays them in the ChatArea

#### Another example in ChatArea.tsx:
```typescript
// Auto-scroll to bottom whenever new messages appear
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isLoading]);
```

#### Usage in Sidebar.tsx:
```typescript
// Load all user's chats when component mounts
useEffect(() => {
  const loadChats = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/chats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setChats(data.chats);
  };
  
  loadChats();
}, [refreshTrigger]);  // Runs when sidebar needs to refresh
```

#### Usage in Chat page:
```typescript
// Check if user is logged in when page loads
useEffect(() => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (!token) {
    router.push('/login');  // Redirect to login if not authenticated
  } else {
    setIsAuthorized(true);
  }
}, []);
```

### 3. **useRef**
Creates a reference to a DOM element (doesn't cause re-render when changed).

#### Usage in ChatArea.tsx:
```typescript
// Reference to the div at the bottom of messages
const messagesEndRef = useRef<HTMLDivElement>(null);

// Auto-scroll to this div when new messages appear
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```

**What it does:**
- Points to the last empty div in the messages list
- When new messages are added, we scroll to this point
- Makes the chat always show the newest messages

### 4. **useRouter**
Next.js hook to navigate between pages.

#### Usage in Chat page:
```typescript
const router = useRouter();

// If not logged in, redirect to login page
router.push('/login');

// If logged in, stay on chat page
router.push('/chat');
```

### 5. **useContext (Custom Hook)**
Custom hook for managing mobile sidebar state.

#### Usage in Chat page:
```typescript
const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useMobileSidebar();

// On mobile, you can open/close the sidebar
if (isMobileSidebarOpen) {
  // Show sidebar as overlay on mobile
}
```

---

## All Components Explained

### 1. **ChatArea.tsx** (Main Chat Interface)
**Location:** `components/chat/ChatArea.tsx`

**Purpose:** 
- Displays all messages in a conversation
- Accepts user input
- Sends messages to the bot
- Shows bot responses

**Key Props:**
- `currentChatId: string | null` - Which chat is open
- `messages: Message[]` - All messages to display
- `setMessages: Function` - Update messages state
- `isGuest: boolean` - Is this a guest user?

**Key Functions:**

#### `handleSend()`
**What it does:**
1. Takes user's text input
2. Adds it to messages list immediately (optimistic UI)
3. Clears the input box
4. Makes TWO API calls:

**First API Call - Create/Update Chat:**
```typescript
// POST /api/chats
// Saves the user's message and gets a chatId
const chatRes = await fetch('/api/chats', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    message: userInput,
    chatId: activeChatId  // null if first message
  })
});

// Response: { chatId: "...", isNewChat: true }
```

**Second API Call - Get Bot Response:**
```typescript
// POST /api/chat
// Gets AI response and saves it to chat
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    message: userInput,
    chatId: activeChatId  // Now we have the chatId
  })
});

// Response: { response: "AI's answer", selectedDocId: "..." }
```

#### `handleKeyPress()`
Allows sending message by pressing Enter (without Shift).

**What it does:**
```typescript
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();  // Send message
  }
};

// Example:
// Enter = sends message
// Shift+Enter = creates new line
```

---

### 2. **Sidebar.tsx** (Chat List)
**Location:** `components/chat/Sidebar.tsx`

**Purpose:**
- Shows all user's previous chats
- Allows switching between chats
- Shows "New Chat" button
- Shows admin controls for admins
- Can delete chats

**Key Functions:**

#### `loadChats()`
```typescript
// Fetches all chats for current user
const res = await fetch('/api/chats', {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` }
});

const data = await res.json();
// data.chats = [
//   { _id: "123", chatId: "abc", title: "First chat" },
//   { _id: "456", chatId: "def", title: "Second chat" },
// ]
```

#### `handleNewChat()`
```typescript
// Sets currentChatId to null (creates fresh chat)
onChatSelect(null);

// This triggers ChatArea to show empty greeting message
```

#### `handleChatSelect(chatId)`
```typescript
// When you click on a chat in sidebar
onChatSelect(chatId);

// This tells ChatArea: "Load messages for this chatId"
// ChatArea's useEffect triggers and loads the chat history
```

#### `handleDeleteChat(chatMongoId)`
```typescript
// DELETE request to remove chat from database
const res = await fetch(`/api/chats/${chatMongoId}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` }
});

// After successful delete:
// - Remove from sidebar list
// - If it was the active chat, clear it
```

---

### 3. **Chat Page** (app/chat/page.tsx)
**Location:** `app/chat/page.tsx`

**Purpose:**
- Main container for chat interface
- Checks if user is logged in
- Manages page-level state
- Coordinates between Sidebar and ChatArea

**Key State Variables:**
```typescript
const [isAuthorized, setIsAuthorized] = useState(false);
// True if user is logged in and can access page

const [currentChatId, setCurrentChatId] = useState<string | null>(null);
// Which chat is currently open

const [messages, setMessages] = useState([...]);
// All messages in the current chat

const [isGuest, setIsGuest] = useState(false);
// Is this user a guest (not logged in)?

const [refreshTrigger, setRefreshTrigger] = useState(0);
// Used to tell Sidebar to refresh chat list
```

**Key Functions:**

#### `handleChatSelect(chatId)`
```typescript
// When you click a chat in sidebar
setCurrentChatId(chatId);

// If it's a NEW chat (null)
if (chatId === null) {
  // Clear messages and show greeting
  setMessages([{ role: 'assistant', content: 'שלום!...' }]);
}
```

#### `handleNewChatCreated()`
```typescript
// After sending first message and creating new chat
// Tell sidebar to refresh its list
setRefreshTrigger((prev) => prev + 1);
```

---

## Database Models

### 1. **User Model**
**Location:** `backend/models/User.ts`

**Schema:**
```typescript
{
  name: String,              // User's name
  email: String,             // Email (unique)
  password: String,          // Hashed password
  role: String,              // 'student' | 'lecturer' | 'admin' | 'pending'
  isAdmin: Boolean,          // Is system admin?
  profilePicture: String,    // URL to profile pic
  createdAt: Date            // When account created
}
```

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "password": "$2a$10$...(hashed)",
  "role": "student",
  "isAdmin": false,
  "profilePicture": "https://...",
  "createdAt": "2024-01-10T10:30:00Z"
}
```

---

### 2. **Chat Model** (NEW - Used for persistent chats)
**Location:** `backend/models/Chat.ts`

**Schema:**
```typescript
{
  chatId: String,            // Unique ID for this chat (UUID)
  userId: String,            // Which user owns this chat
  title: String,             // Chat title (first message truncated)
  messages: [
    {
      role: String,          // 'user' or 'assistant'
      content: String,       // Message text
      createdAt: Date        // When message was sent
    }
  ],
  createdAt: Date,           // When chat was created
  updatedAt: Date            // Last updated
}
```

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "507f1f77bcf86cd799439011",
  "title": "What is the registration process?",
  "messages": [
    {
      "role": "user",
      "content": "What is the registration process?",
      "createdAt": "2024-01-13T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "The registration process is...",
      "createdAt": "2024-01-13T10:30:05Z"
    }
  ],
  "createdAt": "2024-01-13T10:30:00Z",
  "updatedAt": "2024-01-13T10:30:05Z"
}
```

---

### 3. **ChatHistory Model** (LEGACY - For backward compatibility)
**Location:** `backend/models/ChatHistory.ts`

**Schema:**
```typescript
{
  userId: String,            // Which user owns this chat (unique)
  messages: [
    {
      role: String,          // 'user' or 'assistant'
      content: String,       // Message text
      createdAt: Date        // When message was sent
    }
  ],
  createdAt: Date,           // When record created
  updatedAt: Date            // Last updated
}
```

**Difference from Chat Model:**
- Only ONE record per user (legacy system)
- Contains ALL messages (not organized by chat)
- Limited to last 200 messages

---

## API Endpoints

### 1. **POST /api/chats** (Create or Update Chat)
**Purpose:** Creates a new chat or adds user message to existing chat

**Request:**
```json
{
  "message": "What is the registration process?",
  "chatId": null,              // null for first message, or chatId to add to existing
  "isFirstMessage": true
}
```

**Response (New Chat):**
```json
{
  "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "isNewChat": true,
  "chat": {
    "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "What is the registration process?"
  }
}
```

**Response (Add to Existing):**
```json
{
  "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "isNewChat": false,
  "chat": {
    "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "What is the registration process?"
  }
}
```

**What Happens in Backend:**
```typescript
// If no chatId provided (first message)
1. Generate new UUID for chatId
2. Get title from message (truncate to 50 chars)
3. Create new Chat document with user message
4. Return the new chatId

// If chatId provided
1. Find existing Chat by chatId
2. Add user message to messages array
3. Return chatId
```

---

### 2. **GET /api/chats** (Get All Chats)
**Purpose:** Fetch all chats for the current user

**Request:**
```
GET /api/chats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "chats": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "What is the registration process?"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "chatId": "b2c3d4e5-f6a7-0912-bcde-f12345678901",
      "title": "How do I change my password?"
    }
  ]
}
```

---

### 3. **POST /api/chat** (Get AI Response) ⭐ **THIS IS WHERE WE FIXED THE BUG**
**Purpose:** Generate AI response and save chat

**Request:**
```json
{
  "message": "What is the registration process?",
  "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response:**
```json
{
  "response": "The registration process is...",
  "selectedDocId": "doc123",
  "usedContext": true
}
```

**What Happens in Backend (STEP BY STEP):**

**Step 1:** Get knowledge base menu
```typescript
const menu = await fetchKnowledgeBaseMenu();
// Gets list of all available PDF documents
```

**Step 2:** Use Gemini to select relevant document
```typescript
const selectedDocId = await selectRelevantDocument(message, menu);
// Gemini analyzes the question and picks the best PDF
```

**Step 3:** Upload document to Gemini
```typescript
const uploadedFile = await uploadFileToGeminiForChat(selectedDocId);
const geminiFileUri = uploadedFile.uri;
// Document is sent to Gemini to use as context
```

**Step 4:** Generate response
```typescript
// With context:
const finalResponse = await generateContextualResponse(message, geminiFileUri);

// Without context:
const finalResponse = await generateGeneralResponse(message);
```

**Step 5: SAVE TO DATABASE** ⭐ **BUG FIX LOCATION**
```typescript
// NOW BOTH MESSAGES ARE SAVED:
const now = new Date();
const userMsg = { role: 'user', content: message, createdAt: now };
const assistantMsg = { role: 'assistant', content: finalResponse, createdAt: now };

// BEFORE FIX: Only assistantMsg was saved ❌
// AFTER FIX: Both userMsg and assistantMsg are saved ✅

await Chat.findOneAndUpdate(
  { chatId, userId: user.userId },
  {
    $push: {
      messages: {
        $each: [userMsg, assistantMsg],  // BOTH messages!
      }
    }
  },
  { new: true }
);
```

---

### 4. **GET /api/chat** (Get Chat Messages)
**Purpose:** Fetch all messages for a specific chat

**Request:**
```
GET /api/chat?chatId=a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer <token>
```

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the registration process?",
      "createdAt": "2024-01-13T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "The registration process is...",
      "createdAt": "2024-01-13T10:30:05Z"
    }
  ]
}
```

---

### 5. **DELETE /api/chats/[id]** (Delete Chat)
**Purpose:** Delete a specific chat

**Request:**
```
DELETE /api/chats/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Chat deleted successfully"
}
```

---

## Data Flow

### Flow 1: First Message in New Chat
```
User types: "Hello" and clicks Send
    ↓
ChatArea.handleSend() called
    ↓
Add message to local state (show immediately)
    ↓
POST /api/chats { message: "Hello", chatId: null }
    ↓
Backend creates new Chat document
Saves user message "Hello" to database
Returns chatId
    ↓
Frontend gets chatId
Calls onChatIdChange(chatId)  ← Updates parent state
    ↓
POST /api/chat { message: "Hello", chatId }
    ↓
Backend searches knowledge base
Generates AI response using Gemini
Saves BOTH messages to Chat (user + assistant)  ✅
Returns response
    ↓
Frontend receives response
Adds assistant message to local state
    ↓
Sidebar notifies chat list to refresh
    ↓
User sees BOTH messages on screen
```

### Flow 2: Message in Existing Chat
```
User clicks on a chat in sidebar
    ↓
handleChatSelect(chatId) called
    ↓
setCurrentChatId(chatId)
    ↓
ChatArea useEffect triggered
    ↓
GET /api/chat?chatId=xxx
    ↓
Backend fetches Chat document
Returns all messages
    ↓
Frontend receives messages
setMessages(messages)
    ↓
Chat history displays on screen
    ↓
User types new message and clicks Send
    ↓
[Same as Flow 1 from here]
```

### Flow 3: Refresh Page (Current Chat)
```
Page refreshes
    ↓
Chat component mounts
    ↓
Authorization check
    ↓
setCurrentChatId(previous chatId)
    ↓
ChatArea useEffect triggered
    ↓
GET /api/chat?chatId=xxx
    ↓
Backend fetches Chat from MongoDB
Returns messages: [user1, assistant1, user2, assistant2, ...]
    ↓
Frontend displays all messages
    ↓
User sees both their messages and bot's responses ✅
```

---

## The Bug Fix

### The Problem
When you refreshed the page, you only saw the bot's message, not your own message.

### Root Cause
In the `/api/chat` endpoint, when saving to the Chat collection:
- ✅ Assistant message was saved
- ❌ User message was NOT saved

### The Code Before (WRONG):
```typescript
// POST /api/chat handler
if (chatId) {
  // Save to new Chat collection
  await Chat.findOneAndUpdate(
    { chatId, userId: user.userId },
    {
      $push: {
        messages: assistantMsg,  // ❌ ONLY ASSISTANT!
      }
    },
    { new: true }
  );
}
```

### The Code After (FIXED):
```typescript
// POST /api/chat handler
if (chatId) {
  // Save to new Chat collection - BOTH messages
  const userMsg = { role: 'user', content: message, createdAt: now };
  const assistantMsg = { role: 'assistant', content: finalResponse, createdAt: now };
  
  await Chat.findOneAndUpdate(
    { chatId, userId: user.userId },
    {
      $push: {
        messages: {
          $each: [userMsg, assistantMsg],  // ✅ BOTH USER AND ASSISTANT!
        }
      }
    },
    { new: true }
  );
}
```

### Why This Fix Works
- When you send a message, BOTH the user message and bot response are now saved in the same database operation
- When you refresh, `GET /api/chat` retrieves ALL messages including yours
- Sidebar shows all chats correctly

---

## What Gets Saved & Where

### In localStorage (Browser Storage - NOT Persistent)
```javascript
// User info (not sensitive)
localStorage.setItem('user', JSON.stringify({
  id: "507f1f77bcf86cd799439011",
  email: "ahmed@example.com",
  name: "Ahmed Ali",
  role: "student"
}));

// Authentication token
localStorage.setItem('token', 'eyJhbGc...');

// Role selection
localStorage.setItem('activeRole', 'student');

// Guest mode flag
localStorage.setItem('guestMode', 'true');

// NOTE: This is cleared when browser closes (or can be cleared manually)
```

### In MongoDB (Database - PERSISTENT) ✅

#### User Document (Collection: "users")
```json
{
  "_id": ObjectId,
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "password": "$2a$10$...(hashed)",
  "role": "student",
  "isAdmin": false,
  "profilePicture": "https://...",
  "createdAt": ISODate
}
```

#### Chat Document (Collection: "chats") ✅ **STORES ALL MESSAGES**
```json
{
  "_id": ObjectId,
  "chatId": "a1b2c3d4-...",
  "userId": "507f1f77bcf86cd799439011",
  "title": "What is the registration process?",
  "messages": [
    {
      "role": "user",
      "content": "What is the registration process?",
      "createdAt": ISODate
    },
    {
      "role": "assistant",
      "content": "The registration process involves...",
      "createdAt": ISODate
    },
    {
      "role": "user",
      "content": "What about payment?",
      "createdAt": ISODate
    },
    {
      "role": "assistant",
      "content": "Payment is handled by...",
      "createdAt": ISODate
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

#### Uploading PDFs (Collection: "pdfdocuments")
```json
{
  "_id": ObjectId,
  "filename": "Student_Handbook.pdf",
  "uploadedBy": "admin@admin.com",
  "uploadedAt": ISODate,
  "audience": "student",        // Who can see this
  "geminiFileUri": "https://...", // For Gemini AI
  "size": 1024000
}
```

---

## Session Flow Example

### Complete User Journey:

**1. User Registers**
- Enters name, email, password
- POST /api/auth/register
- Password is hashed with bcryptjs
- User document created in MongoDB
- User redirected to role selection

**2. User Selects Role**
- Clicks "Student" or "Lecturer"
- Role saved to activeRole in localStorage
- activeRole also saved in JWT token
- User redirected to chat page

**3. User Sends First Message**
- Types "What are the deadlines?"
- Clicks Send
- Message added to chat UI immediately
- POST /api/chats { message, chatId: null }
  - Backend: Creates new Chat document with user message
  - Backend: Returns chatId = "a1b2c3d4-..."
- Frontend: Gets chatId, updates state
- POST /api/chat { message, chatId }
  - Backend: Searches PDFs for relevant document
  - Backend: Asks Gemini to generate response
  - Backend: **SAVES BOTH messages to Chat** ✅
  - Backend: Returns AI response
- Frontend: Displays assistant message
- Chat now saved in MongoDB

**4. User Refreshes Page**
- Page reloads
- Authorization check passes (token valid)
- currentChatId is restored
- GET /api/chat?chatId=a1b2c3d4-...
  - Backend: Retrieves Chat from MongoDB
  - Backend: Returns ALL messages
- Frontend: Displays both user and assistant messages ✅

**5. User Clicks Different Chat**
- Clicks "How do I change password?" in sidebar
- handleChatSelect called with different chatId
- GET /api/chat?chatId=b2c3d4e5-...
- New chat's messages loaded and displayed

**6. User Logs Out**
- localStorage.clear()
- localStorage items deleted
- User redirected to login page
- MongoDB still has all chats (persisted)

**7. User Logs Back In**
- Logs in again
- JWT token generated
- User data stored in localStorage
- GET /api/chats fetches all previous chats
- All conversations are still there in MongoDB

---

## Key Concepts Summary

### Authorization
- Every API request requires JWT token in Authorization header
- Token is verified server-side
- Token expires after 7 days
- Guests cannot have persistent chats

### Authentication
- Password hashing: bcryptjs with salt 10
- JWT signing: HS256 algorithm
- Stored in: localStorage (browser) and cookies

### Message Storage
- **UI State (React):** `messages` state in ChatArea component
- **Database:** MongoDB Chat collection with chatId, userId, messages array
- **On Page Load:** Fetched from MongoDB via GET /api/chat

### Persistence
- LocalStorage: Clears on logout or browser close
- MongoDB: Permanent until deleted
- All chats and messages are tied to userId

---

## Common Questions for Lecture

**Q: How do you prevent data loss when refreshing?**
A: All messages are saved to MongoDB immediately after the bot responds. When the page refreshes, we fetch the chat from MongoDB using the chatId, so no messages are lost.

**Q: Why are there two API calls when sending a message?**
A: 
1. First call to `/api/chats` creates the chat and saves the user message
2. Second call to `/api/chat` generates the AI response and saves it
This separation allows us to get the chatId before calling the chat API.

**Q: What's the difference between Chat and ChatHistory models?**
A: Chat is the new model supporting multiple chats per user. ChatHistory is legacy (one record per user, all messages mixed). Both are supported for backward compatibility.

**Q: How does the bot know which documents to search?**
A: 
1. Backend fetches list of PDFs from database
2. Sends to Gemini with the user's question
3. Gemini analyzes and returns best matching document ID
4. That PDF is uploaded to Gemini
5. Gemini generates response using that PDF as context

**Q: What happens if user is a guest?**
A: 
- They can chat normally
- Their messages don't get saved to database
- No chat history when they refresh
- No access to old chats

**Q: How do you ensure only users see their own chats?**
A: Every Chat document has a userId field. API queries always filter by both userId and chatId: `Chat.findOne({ chatId, userId })`

---

## Technology Deep Dive

### Authentication Flow
```
1. User registers
   ↓
2. Password hashed: hashPassword(password) → $2a$10$...
   ↓
3. User stored in MongoDB
   ↓
4. User logs in
   ↓
5. Password verified: verifyPassword(input, hash) → true/false
   ↓
6. JWT created: signToken({ userId, email, role })
   ↓
7. Token stored in localStorage and cookies
   ↓
8. Token sent in Authorization header for API requests
   ↓
9. Backend verifies token: verifyToken(token)
   ↓
10. If valid, request processed
    If invalid, return 401 Unauthorized
```

### Database Connection
```typescript
// Single MongoDB connection (cached in development)
// Prevents connection exhaustion

if (cached.conn) {
  return cached.conn;  // Reuse existing connection
}

// Create new connection if needed
mongoose.connect(MONGODB_URI)
```

### Message Flow Timeline
```
T0:00 - User types "Hello"
T0:01 - Click Send
T0:02 - Message appears in UI (optimistic update)
T0:03 - POST /api/chats (save user message, get chatId)
T0:05 - POST /api/chat (generate response, save both messages)
T0:10 - Response appears in UI
T0:11 - Sidebar refreshes to show new chat
(Messages are now in MongoDB)

If user refreshes at T1:00:
T1:00 - Page reloads
T1:01 - GET /api/chats (fetch list of chats)
T1:02 - GET /api/chat?chatId=xxx (fetch messages for current chat)
T1:03 - All messages display (including user's message) ✅
```

---

## Summary

**The Application:**
- Chat interface where users can ask questions about school policies
- Backend queries AI (Gemini) with relevant PDF documents
- All conversations are saved to MongoDB
- Users can have multiple chats and switch between them

**The Components:**
- ChatArea: Message display and input
- Sidebar: Chat list and management
- Chat page: Main container and auth check

**The Hooks:**
- useState: Store data (messages, chats, loading state)
- useEffect: Load data when component mounts or state changes
- useRef: Reference to scroll container
- useContext: Mobile sidebar state
- useRouter: Navigation

**The Fix We Made:**
- Bug: Only bot messages were saved, not user messages
- Solution: Save both user and assistant messages in the same database operation
- Result: Refreshing now shows both user and bot messages

**The Data:**
- LocalStorage: User info, token (temporary)
- MongoDB: All users, chats, messages, PDFs (permanent)

This is everything you need to explain the application to your lecturer!

