# Visual Diagrams & Architecture

## 1. Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Chat Page                              │
│  • currentChatId (null or UUID)                                 │
│  • refreshTrigger (number for sidebar refresh)                  │
│  • handleChatSelect() - updates currentChatId                   │
│  • handleNewChatCreated() - increments refreshTrigger           │
└─────────────────────────────────────────────────────────────────┘
         │                                              │
         │ currentChatId, onChatSelect                │ currentChatId, onChatIdChange, onNewChatCreated
         │ refreshTrigger                            │
         ▼                                             ▼
    ┌────────────────────────┐          ┌──────────────────────────┐
    │     Sidebar            │          │      ChatArea            │
    ├────────────────────────┤          ├──────────────────────────┤
    │ • chats: Chat[]        │          │ • messages: Message[]    │
    │ • isLoading: boolean   │          │ • input: string          │
    │ • useEffect            │          │ • isLoading: boolean     │
    │   [refreshTrigger]     │          │ • useEffect              │
    │                        │          │   [currentChatId]        │
    │ GET /api/chats →       │          │                          │
    │ setChats(data)         │          │ POST /api/chats →        │
    │                        │          │ POST /api/chat →         │
    │ onClick: chat →        │          │ GET /api/chat →          │
    │ onChatSelect(id)       │          │ setMessages(data)        │
    └────────────────────────┘          └──────────────────────────┘
```

## 2. State Flow - Creating New Chat

```
User Types Message
         │
         ▼
   handleSend()
         │
    Is currentChatId null?
    ├─ YES: Create new chat
    │    │
    │    ▼
    │ POST /api/chats (create)
    │    │
    │    ├─ Generate chatId (UUID)
    │    ├─ Generate title (first 50 chars)
    │    └─ Save first message
    │    │
    │    ▼
    │ Get chatId from response
    │    │
    │    ├─ onChatIdChange(chatId)
    │    │  └─ Parent: setCurrentChatId(chatId)
    │    │
    │    └─ onNewChatCreated()
    │       └─ Parent: setRefreshTrigger++
    │          └─ Sidebar: useEffect re-runs
    │             └─ GET /api/chats re-fetches
    │
    └─ NO: Use existing chatId
         │
         ▼
    POST /api/chat (get response)
         │
    ├─ Generate AI response
    ├─ Save assistant message
    └─ Return response
         │
         ▼
    setMessages(prev => [...prev, assistantMsg])
         │
         ▼
    Display updated conversation
```

## 3. State Flow - Switching to Existing Chat

```
User Clicks Chat in Sidebar
         │
         ▼
   onClick handler
         │
         ▼
   onChatSelect(chatId)
         │
         ▼
   Parent: setCurrentChatId(chatId)
         │
         ▼
   ChatArea useEffect triggered
   (dependency: currentChatId changed)
         │
         ▼
   GET /api/chat?chatId=xxx
         │
         ├─ Verify auth
         ├─ Find chat in MongoDB
         └─ Return messages array
         │
         ▼
   setMessages(allHistoricalMessages)
         │
         ▼
   Render full conversation history
```

## 4. Database Operations

```
                          MongoDB
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    CREATE              READ               UPDATE
    (New Chat)      (Load History)    (Append Messages)
        │                   │                   │
        │              GET /api/chat           │
        │         GET /api/chats?             │
        │                   │                   │
    POST /api/chats    db.chats.findOne()   POST /api/chat
        │                   │                 +
    db.chats.create()   db.chats.find()    db.chats.findOneAndUpdate()
        │                   │                   │
        ├─ chatId (UUID)    ├─ Returns all     ├─ $push messages
        ├─ userId          │   messages for    ├─ Maintains order
        ├─ title           │   specific chat   └─ Updates timestamp
        ├─ messages: [     └─ Sorted by date
        │   {role,
        │    content,
        │    createdAt}
        │ ]
        └─ timestamps
```

## 5. Request Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (React)                             │
└─────────────────────────────────────────────────────────────────┘
              │                                      │
              │ Token from localStorage              │
              │                                      │
              ▼                                      ▼
    ┌─────────────────────┐            ┌───────────────────────┐
    │ Sidebar             │            │ ChatArea              │
    └─────────────────────┘            └───────────────────────┘
              │                                      │
         GET /api/chats                      POST /api/chats
         headers: {                          (when currentChatId null)
           Authorization:                    
           Bearer <token>                    body: {
         }                                     message,
              │                               isFirstMessage: true
              │                             }
              ▼                                      │
    ┌─────────────────────┐                        ▼
    │    Next.js Backend  │                ┌───────────────────────┐
    │   /api/chats (GET)  │                │    Returns chatId     │
    │                     │                └───────────────────────┘
    │ 1. Verify token     │
    │ 2. Get userId       │                        │
    │ 3. Query:           │                        │ onChatIdChange
    │    Chat.find({      │                        │ refreshTrigger++
    │      userId,        │                        │
    │      createdAt: -1  │                        │
    │    })               │                        │ ChatArea continues:
    │ 4. Return chats     │                        │ POST /api/chat
    │                     │                        │ (get AI response)
    └─────────────────────┘                        │
              │                                      │
              ▼                                      ▼
    ┌─────────────────────┐                ┌───────────────────────┐
    │   MongoDB           │                │   /api/chat (POST)    │
    │ Chat.find()         │                │                       │
    │                     │                │ 1. Verify token       │
    │ Returns:            │                │ 2. Get userId         │
    │ [{chatId, title},   │                │ 3. Gemini API call    │
    │  {chatId, title}]   │                │ 4. Chat.findOneAnd    │
    │                     │                │    Update() with      │
    │                     │                │    assistant message  │
    │                     │                │ 5. Return response    │
    └─────────────────────┘                └───────────────────────┘
              │                                      │
              ▼                                      ▼
    ┌─────────────────────┐                ┌───────────────────────┐
    │ Sidebar Re-renders  │                │ ChatArea Updates      │
    │ Shows chat list     │                │ Shows both messages   │
    └─────────────────────┘                └───────────────────────┘
```

## 6. User Journey Map

```
STEP 1: Login
  User → /login → Authenticate → Token to localStorage
     │
     ▼
STEP 2: Chat Page
  Click on /chat
     │
     ├─→ Sidebar loads
     │   GET /api/chats
     │   Display Recent Chats list
     │
     └─→ ChatArea initializes
         Show greeting (no chat selected)
     │
     ▼
STEP 3: New Chat
  User types "Hello"
     │
     ├─→ ChatArea: POST /api/chats (create)
     │   Get back chatId
     │   currentChatId set to chatId
     │
     ├─→ Sidebar: useEffect runs (refreshTrigger++)
     │   GET /api/chats (re-fetch)
     │   New chat appears in list
     │
     └─→ ChatArea: POST /api/chat (get response)
         AI responds, both messages visible
     │
     ▼
STEP 4: Send More Messages
  User types "What about tuition?"
     │
     └─→ ChatArea: POST /api/chat
         (currentChatId already set, no new chat)
         Message appends to same chat
     │
     ▼
STEP 5: New Conversation
  User clicks "New Chat"
     │
     ├─→ currentChatId = null
     ├─→ ChatArea resets to greeting
     └─→ Sidebar no chat highlighted
     │
     ▼
STEP 6: Open Previous Chat
  User clicks "What about tuition?" in sidebar
     │
     ├─→ currentChatId set to that chatId
     └─→ ChatArea: GET /api/chat?chatId=xxx
         All history loads, displayed
     │
     ▼
STEP 7: Continue Chat
  User sends new message
     │
     └─→ Message appends to existing chat
```

## 7. Message State Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Message Lifecycle                            │
└─────────────────────────────────────────────────────────────────┘

NEW MESSAGE (User sends in existing chat)
  │
  ├─ Created in ChatArea state: messages array
  ├─ Displayed immediately in UI
  ├─ Sent to POST /api/chat
  ├─ Stored in MongoDB under Chat.messages
  ├─ AI response generated
  ├─ Assistant message added to MongoDB
  ├─ Response displayed in ChatArea
  └─ All stored with timestamps

LOADED MESSAGE (User switches to previous chat)
  │
  ├─ Triggered by currentChatId change
  ├─ GET /api/chat?chatId=xxx fetches from MongoDB
  ├─ All historical messages returned
  ├─ Loaded into ChatArea.messages state
  ├─ Displayed with proper styling
  │   (User: right side, Assistant: left side)
  └─ Ready for new messages to append

DELETED SCENARIO (User could implement)
  │
  ├─ DELETE /api/chat?chatId=xxx (hypothetical)
  ├─ Removes Chat document from MongoDB
  ├─ All messages in that chat deleted
  └─ Chat removed from sidebar
```

## 8. API Endpoint Dependency Graph

```
CLIENT
  │
  ├─→ GET /api/chats
  │   ├─ Called on: Sidebar mount, refreshTrigger change
  │   ├─ Returns: [{chatId, title}, ...]
  │   └─ Updates: Sidebar.chats state
  │
  ├─→ POST /api/chats (create)
  │   ├─ Called on: First message (when currentChatId null)
  │   ├─ Body: {message, isFirstMessage: true}
  │   ├─ Returns: {chatId}
  │   ├─ Updates: Chat.currentChatId
  │   └─ Triggers: GET /api/chats (refresh)
  │
  ├─→ GET /api/chat?chatId=xxx
  │   ├─ Called on: Chat selected (currentChatId changes)
  │   ├─ Returns: {messages: [...]}
  │   └─ Updates: ChatArea.messages
  │
  └─→ POST /api/chat
      ├─ Called on: Send message (regardless of new/existing)
      ├─ Body: {message, chatId}
      ├─ Returns: {response}
      ├─ AI: Processes via Gemini API
      ├─ DB: Saves to Chat.messages
      └─ Updates: ChatArea.messages
```

## 9. Error Handling Flow

```
Any API Call
     │
     ├─ Try
     │  ├─ Fetch API
     │  ├─ Check response.ok
     │  └─ Parse JSON
     │
     └─ Catch Error
        │
        ├─ Log to console
        ├─ Display error message to user
        │  ("Sorry, I encountered an error...")
        ├─ setIsLoading(false)
        └─ User can retry
```

## 10. Security Flow

```
REQUEST ARRIVES
     │
     ▼
Extract Token
     ├─ From Authorization header (Bearer <token>)
     └─ Fallback to cookie
     │
     ▼
Verify Token
     ├─ Check expiration
     ├─ Check signature
     └─ Extract userId
     │
     ▼
Validate Request
     ├─ If no valid token → 401 Unauthorized
     ├─ If no userId → 401 Unauthorized
     └─ If token valid → Proceed
     │
     ▼
Query with userId
     ├─ All queries filter by userId
     ├─ User can only see their own chats
     ├─ User can only access their own data
     └─ Prevents cross-user data leakage
     │
     ▼
Return Response
     └─ Data belongs to authenticated user only
```

---

These diagrams show:
- ✅ How components interact
- ✅ How state flows through the app
- ✅ How data moves between client and server
- ✅ How database operations work
- ✅ The complete user journey
- ✅ Security at each step
