# MorehGuide - Code Examples & Implementation Details

## React Hooks - Code Examples

### 1. useState - Managing State

#### Example 1: Text Input
```typescript
const [input, setInput] = useState('');

// User types in input box
<input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="Type your message..."
/>

// When send button clicked
handleSend() {
  const message = input;     // Get the text
  setInput('');              // Clear the input
}
```

#### Example 2: List of Messages
```typescript
const [messages, setMessages] = useState([]);

// Add a new message
const addMessage = (content) => {
  setMessages((prev) => [
    ...prev,
    { role: 'user', content }
  ]);
};

// Display all messages
{messages.map((msg, i) => (
  <div key={i}>{msg.content}</div>
))}
```

#### Example 3: Loading State
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSend = async () => {
  setIsLoading(true);  // Show spinner
  
  try {
    const response = await fetch('/api/chat', { ... });
    // Process response
  } finally {
    setIsLoading(false);  // Hide spinner
  }
};

// Disable button while loading
<button disabled={isLoading || !input.trim()}>
  {isLoading ? 'Sending...' : 'Send'}
</button>
```

---

### 2. useEffect - Automatic Data Loading

#### Example 1: Load Chat History When Chat Changes
```typescript
useEffect(() => {
  console.log('Chat changed to:', currentChatId);
  
  // Don't load if no chatId
  if (!currentChatId) {
    console.log('No chat selected, clearing messages');
    return;
  }
  
  // Load messages when chatId changes
  const loadChatHistory = async () => {
    const token = localStorage.getItem('token');
    
    const res = await fetch(`/api/chat?chatId=${currentChatId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    setMessages(data.messages);
  };
  
  loadChatHistory();
}, [currentChatId]);  // Run whenever currentChatId changes
```

**How it works:**
1. First time component mounts: `currentChatId` is null, nothing happens
2. User clicks a chat: `currentChatId` becomes "abc123"
3. Dependency changed, useEffect runs
4. Fetches messages for "abc123"
5. Messages displayed
6. User clicks another chat: Same flow

#### Example 2: Run Once on Mount
```typescript
useEffect(() => {
  console.log('Component mounted');
  
  // Load user data from localStorage
  const userData = localStorage.getItem('user');
  if (userData) {
    setUser(JSON.parse(userData));
  }
  
  // Attach event listeners
  window.addEventListener('authStateChanged', handleAuthChange);
  
  // Cleanup: remove event listener when component unmounts
  return () => {
    window.removeEventListener('authStateChanged', handleAuthChange);
  };
}, []);  // Empty array = run once on mount
```

#### Example 3: Run Every Time Messages Change
```typescript
useEffect(() => {
  console.log('New messages, scrolling to bottom');
  scrollToBottom();
}, [messages]);  // Run whenever messages array changes
```

---

### 3. useRef - Keep Reference Without Re-render

#### Example: Auto-scroll to Bottom
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

// Scroll function
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

// In JSX, place empty div at bottom
return (
  <div className="messages-container">
    {messages.map((msg) => (
      <div key={msg.id}>{msg.content}</div>
    ))}
    <div ref={messagesEndRef} />  {/* Reference point */}
  </div>
);

// When new messages appear, scroll to that div
useEffect(() => {
  scrollToBottom();
}, [messages, isLoading]);
```

**Why useRef instead of useState?**
- `useState` would cause re-render when we update it (unnecessary)
- `useRef` just updates without re-rendering

---

## Component Examples

### ChatArea Component - Full Breakdown

#### Complete handleSend Flow
```typescript
const handleSend = async () => {
  // Safety checks
  if (!input.trim() || isLoading) return;

  // 1. Create message object
  const userMessage: Message = { 
    role: 'user', 
    content: input 
  };

  // 2. Save user input to variable (before clearing)
  const userInput = input;

  // 3. Add to messages immediately (optimistic UI)
  setMessages((prev: Message[]) => [...prev, userMessage]);
  
  // 4. Clear input box
  setInput('');
  
  // 5. Show loading spinner
  setIsLoading(true);

  try {
    // 6. Get token from browser storage
    const token = localStorage.getItem('token');

    // 7. STEP 1: Create/update chat
    let activeChatId: string | null = currentChatId;
    
    if (!activeChatId && !isGuest) {
      console.log('First message, creating new chat');
      
      const chatRes = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message: userInput,
          isFirstMessage: true,
        }),
      });

      if (!chatRes.ok) {
        throw new Error('Failed to create chat');
      }

      const chatData = await chatRes.json();
      activeChatId = chatData.chatId;  // Get the new chatId

      // Tell parent component about new chat
      if (onChatIdChange && activeChatId) {
        onChatIdChange(activeChatId);
      }

      // Tell sidebar to refresh chat list
      if (onNewChatCreated) {
        onNewChatCreated();
      }
    }

    // 8. STEP 2: Get AI response
    console.log('Sending message to AI endpoint');
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ 
        message: userInput,
        chatId: activeChatId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();
    
    // 9. Create assistant message
    const assistantMessage: Message = { 
      role: 'assistant', 
      content: data.response 
    };
    
    // 10. Add assistant message to UI
    setMessages((prev: Message[]) => [...prev, assistantMessage]);
    
  } catch (error) {
    console.error('Chat error:', error);
    
    // Show error message
    const errorMessage: Message = {
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
    };
    setMessages((prev: Message[]) => [...prev, errorMessage]);
    
  } finally {
    // 11. Always hide loading spinner
    setIsLoading(false);
  }
};
```

---

### Sidebar Component - Chat Management

#### Load Chats
```typescript
useEffect(() => {
  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }

      // Stop loading if no token (guest or logged out)
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch all chats
      const res = await fetch('/api/chats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);  // data.chats = [ { _id, chatId, title }, ... ]
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadChats();
}, [refreshTrigger]);  // Refresh when refreshTrigger changes
```

#### Delete Chat
```typescript
const handleDeleteChat = async (e: React.MouseEvent, chatMongoId: string) => {
  // Prevent selecting chat when clicking delete button
  e.stopPropagation();
  
  // Ask user for confirmation
  if (!confirm('Are you sure you want to delete this chat?')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    // Send DELETE request
    const res = await fetch(`/api/chats/${chatMongoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to delete chat');
    }

    // Remove from UI
    setChats((prev) => prev.filter((chat) => chat._id !== chatMongoId));

    // If it was the active chat, clear it
    // (implementation depends on props)
    
  } catch (error) {
    console.error('Delete error:', error);
  }
};
```

---

## API Endpoint Implementation

### POST /api/chats - Create/Update Chat

```typescript
// REQUEST BODY
{
  "message": "What is the registration process?",
  "chatId": null,              // null for new, or existing chatId
  "isFirstMessage": true
}

// BACKEND LOGIC
export async function POST(request: NextRequest) {
  try {
    // 1. Get user from JWT token
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse request
    const { chatId: providedChatId, message, isFirstMessage } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // 3. Connect to database
    await connectToDatabase();

    let chatId = providedChatId;
    let isNewChat = false;

    // 4. CREATE NEW CHAT if no chatId
    if (!chatId) {
      chatId = randomUUID();  // Generate unique ID
      isNewChat = true;

      // Extract title from message (first 50 chars)
      const title = message.substring(0, 50).trim();

      // Create new Chat document
      const newChat = await Chat.create({
        chatId,
        userId: user.userId,
        title,
        messages: [
          {
            role: 'user',
            content: message,
            createdAt: new Date(),
          },
        ],
      });

      // RESPONSE: New chat created
      return NextResponse.json({
        chatId,
        isNewChat: true,
        chat: {
          chatId: newChat.chatId,
          title: newChat.title,
        },
      });
    }

    // 5. ADD MESSAGE to EXISTING CHAT
    const userMsg = {
      role: 'user' as const,
      content: message,
      createdAt: new Date(),
    };

    const updatedChat = await Chat.findOneAndUpdate(
      { chatId, userId: user.userId },
      {
        $push: {
          messages: userMsg,  // Add user message
        },
      },
      { new: true }
    );

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // RESPONSE: Message added
    return NextResponse.json({
      chatId,
      isNewChat: false,
      chat: {
        chatId: updatedChat.chatId,
        title: updatedChat.title,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
```

---

### POST /api/chat - Generate Response ⭐ BUG FIX

```typescript
// REQUEST BODY
{
  "message": "What is the registration process?",
  "chatId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}

// BACKEND LOGIC
export async function POST(request: NextRequest) {
  try {
    // 1. Get user from token
    const user = await getUserFromRequest(request);
    const isGuest = !user;

    // 2. Parse request
    const { message, chatId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // STEP 1: Fetch knowledge base menu
    const menu = await fetchKnowledgeBaseMenu();

    // STEP 2: Select relevant document
    let selectedDocId = 'NONE';
    let geminiFileUri = '';

    if (menu && menu.trim() !== '') {
      selectedDocId = await selectRelevantDocument(message, menu);

      // STEP 3: Upload document to Gemini
      if (selectedDocId !== 'NONE') {
        try {
          const uploadedFile = await uploadFileToGeminiForChat(selectedDocId);
          geminiFileUri = uploadedFile.uri;
        } catch (docError) {
          selectedDocId = 'NONE';
          geminiFileUri = '';
        }
      }
    }

    // STEP 4: Generate response
    let finalResponse = '';

    if (selectedDocId === 'NONE' || !geminiFileUri) {
      // General response without document context
      finalResponse = await generateGeneralResponse(message);
    } else {
      // Contextual response using the document
      finalResponse = await generateContextualResponse(message, geminiFileUri);
    }

    // STEP 5: SAVE TO DATABASE ⭐ BUG FIX HERE
    if (!isGuest) {
      await connectToDatabase();

      // ✅ CREATE BOTH MESSAGES
      const now = new Date();
      const userMsg = { role: 'user' as const, content: String(message), createdAt: now };
      const assistantMsg = { role: 'assistant' as const, content: String(finalResponse), createdAt: new Date() };

      if (chatId) {
        // ✅ SAVE BOTH MESSAGES (BUG FIX)
        await Chat.findOneAndUpdate(
          { chatId, userId: user.userId },
          {
            $push: {
              messages: {
                $each: [userMsg, assistantMsg],  // ✅ BOTH!
              },
            },
          },
          { new: true }
        );
      } else {
        // Legacy: Save to ChatHistory
        await ChatHistory.findOneAndUpdate(
          { userId: user.userId },
          {
            $push: {
              messages: {
                $each: [userMsg, assistantMsg],
                $slice: -200,  // Keep only last 200
              },
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    // RESPONSE: Return AI response
    return NextResponse.json({
      response: finalResponse,
      selectedDocId: selectedDocId,
      usedContext: selectedDocId !== 'NONE',
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
```

---

### GET /api/chat - Retrieve Messages

```typescript
// REQUEST
GET /api/chat?chatId=a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer eyJhbGc...

// BACKEND LOGIC
export async function GET(request: NextRequest) {
  try {
    // 1. Get user from token
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ messages: [] });
    }

    // 2. Get chatId from query params
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    // 3. Connect to database
    await connectToDatabase();

    // 4. Find chat by chatId and userId
    const chat = await Chat.findOne({ chatId, userId: user.userId }).lean();

    // 5. Return messages
    return NextResponse.json({
      messages: chat?.messages ?? [],
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 });
  }
}

// RESPONSE
{
  "messages": [
    {
      "role": "user",
      "content": "What is the registration process?",
      "createdAt": "2024-01-13T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "The registration process involves...",
      "createdAt": "2024-01-13T10:30:05Z"
    }
  ]
}
```

---

## Authentication Examples

### JWT Token Creation
```typescript
// When user logs in
const token = await signToken({
  userId: user._id.toString(),
  email: user.email,
  role: user.role,
  isAdmin: user.isAdmin,
  activeRole: selectedRole  // 'student' or 'lecturer'
});

// Token payload looks like:
// {
//   "userId": "507f1f77bcf86cd799439011",
//   "email": "ahmed@example.com",
//   "role": "student",
//   "isAdmin": false,
//   "activeRole": "student",
//   "iat": 1673608800,
//   "exp": 1674213600
// }

// Store in browser
localStorage.setItem('token', token);
// Cookie can also be set by server
```

### Verify Token on API Call
```typescript
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();  // Extract after "Bearer "
  }

  // Fall back to cookie
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken && cookieToken.trim() !== '') {
    return cookieToken.trim();
  }

  return null;
}

async function getUserFromRequest(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;
  
  // Verify token signature and decode payload
  return await verifyToken(token);  // Returns user object
}

// Usage in API
const user = await getUserFromRequest(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Password Hashing
```typescript
// When user registers
const hashedPassword = await hashPassword(inputPassword);
// Returns: "$2a$10$..." (bcryptjs hash with salt 10)

// Save to database
const user = await User.create({
  name: "Ahmed",
  email: "ahmed@example.com",
  password: hashedPassword,  // Hashed, not plaintext
  role: "pending"
});

// When user logs in
const isPasswordCorrect = await verifyPassword(
  inputPassword,           // What user typed
  user.password           // Hash from database
);
// Returns: true or false
```

---

## Database Query Examples

### Create Chat
```typescript
const newChat = await Chat.create({
  chatId: "a1b2c3d4-...",
  userId: "507f1f77bcf86cd799439011",
  title: "What is the registration...",
  messages: [
    {
      role: 'user',
      content: "What is the registration process?",
      createdAt: new Date()
    }
  ]
});
```

### Add Messages to Chat
```typescript
const updatedChat = await Chat.findOneAndUpdate(
  { chatId, userId },  // Find this chat
  {
    $push: {
      messages: {
        $each: [userMsg, assistantMsg],
      }
    }
  },
  { new: true }  // Return updated document
);
```

### Get All User's Chats
```typescript
const chats = await Chat.find(
  { userId: "507f1f77bcf86cd799439011" },  // Filter by userId
  { _id: 1, chatId: 1, title: 1, createdAt: 1 }  // Only these fields
)
.sort({ createdAt: -1 })  // Newest first
.lean();  // Return plain object (faster)

// Result: [
//   { _id: ObjectId, chatId: "abc123", title: "First chat" },
//   { _id: ObjectId, chatId: "def456", title: "Second chat" }
// ]
```

### Get Single Chat
```typescript
const chat = await Chat.findOne({
  chatId: "a1b2c3d4-...",
  userId: "507f1f77bcf86cd799439011"
}).lean();

// Result: {
//   _id: ObjectId,
//   chatId: "a1b2c3d4-...",
//   userId: "507f1f77bcf86cd799439011",
//   title: "What is...",
//   messages: [
//     { role: 'user', content: "...", createdAt: Date },
//     { role: 'assistant', content: "...", createdAt: Date }
//   ]
// }
```

### Delete Chat
```typescript
const result = await Chat.deleteOne({
  _id: ObjectId("507f1f77bcf86cd799439012")
});

// result: { deletedCount: 1 }
```

---

## Common Patterns

### Optimistic UI Update
```typescript
// Add message to UI immediately
setMessages((prev) => [...prev, userMessage]);

// Then send to server
try {
  const response = await fetch('/api/chat', { ... });
  // If successful, server confirms (no action needed)
} catch (error) {
  // If error, could remove message from UI
  setMessages((prev) => prev.slice(0, -1));
}
```

### Fetch with Error Handling
```typescript
try {
  const res = await fetch('/api/chats', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  setChats(data.chats);
  
} catch (error) {
  console.error('Failed to load chats:', error);
  // Show error to user
}
```

### Conditional Rendering
```typescript
// Show loading spinner
{isLoading && <div>Loading...</div>}

// Show messages or empty state
{messages.length > 0 ? (
  messages.map((msg) => <Message key={msg.id} {...msg} />)
) : (
  <div>No messages yet</div>
)}

// Show send button only if input has text and not loading
<button disabled={!input.trim() || isLoading}>
  Send
</button>
```

---

## Environment Variables Needed

```bash
# In .env.local file

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/moreh-guide

# JWT
JWT_SECRET=your-secret-key-at-least-32-chars

# Gemini AI
GEMINI_API_KEY=AIzaSyD...

# Other
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Testing Examples

### Test if message is saved
1. Send message "Hello"
2. Refresh page
3. Message should still appear ✅

### Test if chat is deleted
1. Create chat
2. Click delete button
3. Confirm deletion
4. Chat should disappear from sidebar ✅

### Test guest mode
1. Don't log in
2. Click "Continue as Guest"
3. Send message
4. Refresh page
5. Message should disappear (not saved) ✅

### Test multiple chats
1. Create chat 1
2. Send message 1
3. Create chat 2
4. Send message 2
5. Click chat 1 → Should show message 1 ✅
6. Click chat 2 → Should show message 2 ✅

---

This should cover everything you need to explain your code to your lecturer! 📖

