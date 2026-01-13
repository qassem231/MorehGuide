# Quick Testing Guide

## Test Scenario 1: Create a New Chat

1. Navigate to `/chat`
2. Send a message (e.g., "Hello")
3. **Expected Results**:
   - ✅ Message appears on right side (user)
   - ✅ AI response appears on left side (assistant)
   - ✅ New chat appears in sidebar with title "Hello"
   - ✅ Chat is marked as selected (highlighted)

## Test Scenario 2: View Chat History

1. Create a new chat and send 2-3 messages
2. Click "New Chat" button
3. ChatArea should show initial greeting, messages cleared
4. Click the chat you created in sidebar
5. **Expected Results**:
   - ✅ All previous messages load in correct order
   - ✅ No duplicate messages
   - ✅ Chat is marked as selected

## Test Scenario 3: Multiple Chats

1. Create Chat A (send 2 messages)
2. Click "New Chat"
3. Create Chat B (send 1 message)
4. Click Chat A in sidebar
5. Click Chat B in sidebar
6. **Expected Results**:
   - ✅ Switching correctly shows each chat's messages
   - ✅ No cross-contamination of messages
   - ✅ Chat titles correct in sidebar

## Test Scenario 4: Persistence

1. Create a chat and send messages
2. Refresh the page (F5)
3. **Expected Results**:
   - ✅ You're redirected to login if not authenticated
   - ✅ After login, chats still appear in sidebar
   - ✅ Click previous chat and messages load

## Test Scenario 5: New Chat Button

1. Open a chat with messages
2. Click "New Chat" button
3. **Expected Results**:
   - ✅ ChatArea shows initial greeting
   - ✅ Input field is enabled
   - ✅ No chat is highlighted in sidebar

## Test Scenario 6: Sidebar Refresh

1. Create new chat A
2. Verify it appears immediately in sidebar
3. Create new chat B in a different browser window/tab
4. Go back to first window and look at sidebar
5. **Note**: Sidebar only auto-refreshes after sending a message in your tab. To see chats from other sessions, refresh the sidebar by sending a message or refreshing the page.

## Debugging Checklist

If something doesn't work:

1. **Check Browser Console** (F12)
   - Look for error messages
   - Check network requests (Network tab)

2. **Verify MongoDB Connection**
   - Check if chats are actually saved: `db.chats.find()`
   - Verify structure matches schema

3. **Check API Routes**
   - `GET /api/chats` returns correct chats
   - `POST /api/chats` creates new chat with correct title
   - `GET /api/chat?chatId=xxx` returns all messages

4. **Verify Authentication**
   - Token in localStorage
   - Token is valid (not expired)

## Common Issues & Solutions

### Issue: Chats not appearing in sidebar
- Check browser console for errors
- Verify token is in localStorage: `localStorage.getItem('token')`
- Check MongoDB for Chat documents

### Issue: Messages not loading when clicking chat
- Verify chatId is being passed correctly
- Check GET /api/chat endpoint returns messages
- Check MongoDB for messages in that chat

### Issue: New chat not appearing immediately
- Sidebar only refreshes after sending message
- Check POST /api/chats response includes new chatId
- Verify onNewChatCreated callback is being called

### Issue: Sending message creates duplicate chat
- Verify currentChatId is set correctly after POST /api/chats
- Check onChatIdChange is being called
- Inspect Chat documents in MongoDB for duplicates

## Database Inspection Commands (MongoDB)

```javascript
// List all chats for a user
db.chats.find({ userId: "USER_ID_HERE" })

// Count chats for a user
db.chats.countDocuments({ userId: "USER_ID_HERE" })

// View specific chat with messages
db.chats.findOne({ chatId: "CHAT_ID_HERE" })

// Count total chats
db.chats.countDocuments()

// Delete all chats (for testing)
db.chats.deleteMany({ userId: "USER_ID_HERE" })
```

## Performance Tips

- Sidebar only re-fetches when new chat created (efficient)
- ChatArea uses useEffect to load history (prevents redundant calls)
- Messages array stays in component state (fast rendering)
- MongoDB queries are indexed on userId and chatId (fast lookups)
