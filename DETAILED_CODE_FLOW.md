# Detailed Code Flow

## 1. APPLICATION STARTUP

```
User visits /chat
      ↓
Chat Page Loads
      ├─→ Check authorization (token + user in localStorage)
      ├─→ Set isAuthorized = true
      ├─→ Initialize:
      │   ├─ currentChatId = null
      │   ├─ refreshTrigger = 0
      │   └─ user = {id, name, email, role}
      │
      └─→ Render:
          ├─ Sidebar component (passes refreshTrigger=0)
          └─ ChatArea component (passes currentChatId=null)
```

## 2. SIDEBAR INITIALIZATION

```
Sidebar Mounts
      ↓
useEffect runs (dependency: [refreshTrigger])
      ├─→ Get token from localStorage
      ├─→ GET /api/chats (with Authorization header)
      │   └─→ Backend:
      │       ├─ Verify token
      │       ├─ Query Chat collection: { userId: user.userId }
      │       ├─ Sort by createdAt DESC (most recent first)
      │       └─ Return: { chats: [{chatId, title}, ...] }
      │
      ├─→ setChats(data.chats)
      └─→ setIsLoading(false)

Sidebar Renders
      └─→ Shows "Recent Chats" list with loaded chats
```

## 3. CHAT AREA INITIALIZATION

```
ChatArea Mounts (currentChatId = null)
      ├─→ setMessages to initial greeting
      ├─→ useEffect runs (dependency: [currentChatId])
      │   └─→ Since currentChatId is null:
      │       └─ Don't load any history (starting fresh)
      │
      └─→ Render:
          ├─ Display initial greeting message
          ├─ Show input field
          └─ Show Send button
```

## 4. USER SENDS FIRST MESSAGE (New Chat)

```
User types "What is the admission process?" and clicks Send
      ↓
handleSend() called
      ├─→ userMessage = {role: 'user', content: 'What is the admission process?'}
      ├─→ userInput = 'What is the admission process?' (saved to variable)
      ├─→ setMessages([initial_greeting, userMessage])
      ├─→ setInput('') (clear input field)
      ├─→ setIsLoading(true)
      │
      ├─→ Get token from localStorage
      ├─→ Since currentChatId is null:
      │   ├─→ POST /api/chats
      │   │   ├─ Body: { message: userInput, isFirstMessage: true }
      │   │   └─→ Backend:
      │   │       ├─ Verify token, get user
      │   │       ├─ Generate chatId = UUID()
      │   │       ├─ Generate title = first 50 chars of message
      │   │       ├─ Create Chat document:
      │   │       │   {
      │   │       │     chatId: 'abc123',
      │   │       │     userId: 'user1',
      │   │       │     title: 'What is the admission process?',
      │   │       │     messages: [{
      │   │       │       role: 'user',
      │   │       │       content: 'What is the admission process?',
      │   │       │       createdAt: now
      │   │       │     }]
      │   │       │   }
      │   │       └─ Return: { chatId: 'abc123', isNewChat: true, ... }
      │   │
      │   ├─→ chatData = {chatId: 'abc123', ...}
      │   ├─→ activeChatId = 'abc123'
      │   ├─→ Call onChatIdChange('abc123')
      │   │   └─→ Parent Chat Page: setCurrentChatId('abc123')
      │   │
      │   └─→ Call onNewChatCreated()
      │       └─→ Parent Chat Page: setRefreshTrigger(1)
      │           └─→ Triggers Sidebar useEffect to re-fetch chats
      │
      ├─→ POST /api/chat
      │   ├─ Body: { message: userInput, chatId: 'abc123' }
      │   └─→ Backend:
      │       ├─ Verify token, get user
      │       ├─ Process message through Gemini AI
      │       ├─ Generate response
      │       ├─ Push assistant message to Chat.messages:
      │       │   Chat.findOneAndUpdate(
      │       │     { chatId: 'abc123', userId: 'user1' },
      │       │     { $push: { messages: assistantMessage } }
      │       │   )
      │       └─ Return: { response: 'AI response text', ... }
      │
      ├─→ data = {response: 'The admission process involves...', ...}
      ├─→ assistantMessage = {role: 'assistant', content: 'The admission process...'}
      ├─→ setMessages(prev => [...prev, assistantMessage])
      │   └─→ Messages now: [initial_greeting, userMessage, assistantMessage]
      │
      └─→ setIsLoading(false)

MEANWHILE - Sidebar Refresh (triggered by setRefreshTrigger(1))
      ├─→ useEffect runs again (dependency changed: refreshTrigger now = 1)
      ├─→ GET /api/chats
      │   └─→ Backend returns: { chats: [{
      │       chatId: 'abc123',
      │       title: 'What is the admission process?'
      │     }] }
      │
      ├─→ setChats([{chatId: 'abc123', title: 'What is the admission process?'}])
      └─→ Sidebar re-renders showing new chat in list

Screen Updates
      ├─ ChatArea shows conversation
      └─ Sidebar shows new chat highlighted
```

## 5. USER CLICKS EXISTING CHAT IN SIDEBAR

```
User clicks "What is the admission process?" in sidebar
      ↓
handleChatSelect('abc123') called
      ├─→ Call onChatSelect('abc123')
      │   └─→ Parent: setCurrentChatId('abc123')
      │
      └─→ Sidebar re-renders with chat highlighted

ChatArea useEffect Triggered (dependency: currentChatId changed to 'abc123')
      ├─→ Since currentChatId is 'abc123' (not null):
      │   ├─→ GET /api/chat?chatId=abc123
      │   │   └─→ Backend:
      │   │       ├─ Verify token, get user
      │   │       ├─ Find Chat: { chatId: 'abc123', userId: 'user1' }
      │   │       └─ Return: { messages: [
      │   │           {role: 'user', content: 'What is...', createdAt: time1},
      │   │           {role: 'assistant', content: 'The admission...', createdAt: time2}
      │   │         ]}
      │   │
      │   ├─→ data.messages = [...all messages...]
      │   └─→ setMessages(data.messages)
      │
      └─→ ChatArea re-renders with full history loaded
```

## 6. USER SENDS MESSAGE IN EXISTING CHAT

```
User (in existing chat) types "What about scholarships?" and clicks Send
      ↓
handleSend() called
      ├─→ userMessage = {role: 'user', content: 'What about scholarships?'}
      ├─→ userInput = 'What about scholarships?'
      ├─→ setMessages(prev => [...prev, userMessage])
      ├─→ setInput('')
      ├─→ setIsLoading(true)
      │
      ├─→ Since currentChatId = 'abc123' (NOT null):
      │   └─→ Skip POST /api/chats (don't create new chat)
      │       └─→ activeChatId stays 'abc123'
      │
      ├─→ POST /api/chat
      │   ├─ Body: { message: userInput, chatId: 'abc123' }
      │   └─→ Backend:
      │       ├─ Generate AI response
      │       ├─ Find existing Chat: { chatId: 'abc123', userId: 'user1' }
      │       ├─ Push assistant message to messages array
      │       └─ Return response
      │
      ├─→ assistantMessage created
      ├─→ setMessages(prev => [...prev, assistantMessage])
      └─→ setIsLoading(false)

Results
      ├─ New message pair appended to existing chat
      ├─ Message saved to MongoDB
      ├─ Sidebar shows same chat (no new chat created)
      └─ No duplicate chats
```

## 7. USER CLICKS "NEW CHAT" BUTTON

```
User clicks "New Chat" button
      ↓
handleNewChat() called
      ├─→ Call onChatSelect(null)
      │   └─→ Parent: setCurrentChatId(null)
      │
      └─→ Sidebar items lose highlight

ChatArea useEffect Triggered (dependency: currentChatId changed to null)
      ├─→ Since currentChatId is null:
      │   ├─→ Reset messages to initial greeting
      │   └─→ Clear input field
      │
      └─→ ChatArea ready for new conversation
```

## 8. STATE MACHINE SUMMARY

```
┌─────────────────────────────────────────────────────┐
│          COMPONENT STATE LIFECYCLE                   │
└─────────────────────────────────────────────────────┘

Chat Page (Parent)
├─ currentChatId: null | string
│   └─ Controls which chat is loaded in ChatArea
│   └─ null = new chat mode
│   └─ string = existing chat selected
│
├─ refreshTrigger: number (0, 1, 2, ...)
│   └─ Triggers Sidebar to re-fetch chat list
│   └─ Incremented only on new chat creation
│
├─→ Sidebar
│   ├─ chats: Chat[] (loaded from DB)
│   ├─ isLoading: boolean
│   ├─ currentChatId (from parent) - used to highlight
│   └─ Depends on: refreshTrigger
│
└─→ ChatArea
    ├─ messages: Message[]
    ├─ input: string
    ├─ isLoading: boolean
    ├─ currentChatId (from parent) - used to load history
    └─ Depends on: currentChatId
```

## 9. API CALL SUMMARY

| Flow | API | Purpose | Request | Response |
|------|-----|---------|---------|----------|
| New Chat | POST /api/chats | Create chat | {message, isFirstMessage} | {chatId, isNewChat} |
| New Chat | POST /api/chat | Get AI response | {message, chatId} | {response} |
| Switch Chat | GET /api/chat | Load history | ?chatId=xxx | {messages} |
| Switch Chat | (Sidebar doesn't refresh) | - | - | - |
| Send Message | POST /api/chat | Get AI response | {message, chatId} | {response} |
| Sidebar Load | GET /api/chats | Load chat list | - | {chats} |
