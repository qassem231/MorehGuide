# MorehGuide - AI Assistant for Braude Academic College

An intelligent chatbot system that helps students access information about Braude Academic College rules, regulations, and procedures. The system uses Google's Gemini AI to provide contextual answers based on official college documents stored as PDFs.

## 🏗️ Project Architecture

### **Project Structure**

```
morehguide/
├── app/                          # Next.js App Router (Frontend & API Routes)
│   ├── api/                      # Backend API Endpoints
│   │   ├── auth/
│   │   │   ├── login/           # JWT login endpoint
│   │   │   └── register/        # User registration endpoint
│   │   ├── chat/                # Chat AI endpoint
│   │   └── upload/              # PDF upload endpoint
│   ├── chat/                    # Chat interface page
│   ├── login/                   # Login page
│   ├── register/                # Registration page
│   └── layout.tsx               # Root layout with Navbar
│
├── backend/                     # Backend Business Logic
│   ├── models/
│   │   ├── User.ts             # User Mongoose schema
│   │   └── PdfDocument.ts      # PDF Document schema with binary storage
│   ├── gemini.ts               # Gemini AI integration (chat logic)
│   ├── storage.ts              # File upload & metadata extraction
│   └── database.ts             # Legacy Firebase helpers (deprecated)
│
├── components/                  # React Components
│   ├── auth/
│   │   ├── LoginForm.tsx       # Login form with JWT
│   │   └── RegisterForm.tsx    # Registration form
│   ├── chat/
│   │   ├── ChatArea.tsx        # Main chat interface
│   │   └── Sidebar.tsx         # Chat sidebar navigation
│   ├── admin/
│   │   └── UploadButton.tsx    # PDF upload button (admin only)
│   └── ui/                     # Reusable UI components
│
├── lib/                        # Utility Libraries
│   ├── db.ts                   # MongoDB connection helper
│   ├── auth.ts                 # JWT & password hashing utilities
│   └── firebase.ts             # Legacy Firebase config (deprecated)
│
├── middleware.ts               # Next.js middleware for admin route protection
└── .env.local                  # Environment variables
```

---

## 🔄 System Flow

### **1. User Authentication Flow**

```
User Registration:
1. User fills form (name, email, password) → RegisterForm.tsx
2. POST /api/auth/register
3. Hash password with bcryptjs
4. Save user to MongoDB (User model)
5. Generate JWT token
6. Return token + user info

User Login:
1. User enters credentials → LoginForm.tsx
2. POST /api/auth/login
3. Verify password hash
4. Generate JWT token (7-day expiration)
5. Save token to localStorage
6. Redirect to /chat
```

**Authentication Stack:**
- **Password Hashing:** `bcryptjs` (10 rounds)
- **JWT Signing:** `jose` library with HS256 algorithm
- **Token Storage:** Browser localStorage
- **Admin Protection:** Next.js middleware checks JWT role

---

### **2. PDF Upload Flow**

```
Admin uploads PDF:
1. Click upload button → /admin route protected by middleware
2. Select PDF file → UploadButton.tsx
3. POST /api/upload/route.ts with FormData
   ↓
4. backend/storage.ts → uploadPdfToMongoDB()
   - Convert File to Buffer
   ↓
5. backend/storage.ts → uploadFileToGeminiAPI()
   - Upload Buffer to Google Gemini File API
   - Wait for file to be ACTIVE
   ↓
6. backend/storage.ts → extractMetadataFromFile()
   - Send PDF to Gemini with analysis prompt
   - Extract: summary (Hebrew), keywords, category
   ↓
7. backend/storage.ts → savePdfDocumentToMongoDB()
   - Save to MongoDB PdfDocument collection:
     * fileName: string
     * fileData: Buffer (entire PDF as binary blob)
     * contentType: 'application/pdf'
     * metadata: { summary, keywords, category }
     * geminiUri: optional cache
     * createdAt: timestamp
   ↓
8. Return success response with docId
```

**Storage Architecture:**
- **Database:** MongoDB (Mongoose ODM)
- **PDF Storage:** Binary Blob directly in MongoDB (no external storage)
- **Metadata:** Extracted by Gemini AI in Hebrew
- **Indexes:** Optimized queries on `metadata.keywords` and `metadata.category`

---

### **3. Chat & Document Retrieval Flow**

```
User sends message in chat:
1. User types message → ChatArea.tsx
2. POST /api/chat/route.ts with { message }
   ↓
3. backend/gemini.ts → fetchKnowledgeBaseMenu()
   - Query MongoDB: PdfDocument.find({}, 'fileName metadata _id')
   - Returns lightweight menu (IDs, filenames, summaries, keywords)
   ↓
4. backend/gemini.ts → selectRelevantDocument(message, menu)
   - Send message + menu to Gemini
   - Gemini selects most relevant document ID
   - Returns document ID or 'NONE'
   ↓
5a. IF document selected:
    - backend/gemini.ts → uploadFileToGeminiForChat(documentId)
      * Fetch full document from MongoDB (with fileData Buffer)
      * Handle BSON Binary conversion to Node.js Buffer
      * Write Buffer to temporary file
      * Upload temp file to Gemini File API
      * Clean up temp file
      ↓
    - backend/gemini.ts → generateContextualResponse(message, geminiUri)
      * Send message + PDF file URI to Gemini
      * Gemini answers based STRICTLY on document content
      * Returns answer in Hebrew
   ↓
5b. IF no document selected:
    - backend/gemini.ts → generateGeneralResponse(message)
      * Gemini answers with general knowledge
      * Returns answer in Hebrew
   ↓
6. Return response to frontend
7. Display in chat interface with markdown support
```

**Chat Intelligence:**
- **Librarian Architecture:** Smart document routing before retrieval
- **Lazy Loading:** Only fetch full PDF when needed
- **Temporary Files:** Convert Buffer → Temp File → Upload → Delete
- **Context-Aware:** Gemini uses actual PDF content for answers

---

## 🗄️ Database Schema

### **User Collection**
```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique, indexed),
  password: string (bcrypt hash),
  role: 'user' | 'admin' (default: 'user'),
  createdAt: Date
}
```

### **PdfDocument Collection**
```typescript
{
  _id: ObjectId,
  fileName: string,
  fileData: Buffer,              // Entire PDF as binary blob
  contentType: string,           // 'application/pdf'
  metadata: {
    summary: string,             // Hebrew 2-sentence description
    keywords: string[],          // Search tags
    category: string             // Document category
  },
  geminiUri?: string,            // Optional Gemini File API cache
  createdAt: Date
}

// Indexes:
- metadata.keywords (for fast keyword search)
- metadata.category (for category filtering)
```

---

## 🤖 AI System Configuration

### **Gemini Model Settings**
```typescript
Model: 'gemini-flash-latest'
Temperature: 0.7
topK: 40
topP: 0.95
maxOutputTokens: 2048
```

### **System Prompts**

**General Chat:**
```
"You are an AI assistant for Braude Academic College. You support students 
with information about college rules and regulations. You answer strictly 
based on the provided context. If the answer is not in the files provided, 
you will state that. Answer in Hebrew."
```

**Contextual Chat (with PDF):**
```
"You are an AI assistant for Braude Academic College. The attached document 
contains official college rules and regulations in Hebrew. Answer the user's 
question based strictly on this document. If the information is not in the 
document, state that clearly. Answer in Hebrew."
```

### **Rate Limiting Handling**
- Detects: "fetch failed", "429", "quota exceeded"
- Response: "⚠️ המערכת עמוסה כרגע עקב מגבלת שימוש. אנא נסה שוב בעוד מספר דקות."
- No crashes or 500 errors

---

## 🔐 Security Features

### **Authentication**
- JWT tokens with 7-day expiration
- Bcrypt password hashing (10 rounds)
- Token stored in localStorage
- Custom auth state events

### **Authorization**
- Middleware protects `/admin/*` routes
- Checks JWT token from cookies or Authorization header
- Validates role === 'admin'
- Auto-redirect to `/login` if unauthorized

### **Data Protection**
- Passwords never stored in plain text
- MongoDB connection cached globally (prevents pool exhaustion)
- Environment variables for sensitive keys

---

## 🌐 Frontend Features

### **Technologies**
- **Framework:** Next.js 16.0.10 with App Router
- **UI Library:** React 19.2.1
- **Styling:** Tailwind CSS 4
- **Icons:** React Icons
- **Markdown:** react-markdown with remark-gfm

### **User Interface**
- **Hebrew Support:** RTL text direction with `dir="auto"`
- **Loading States:** Spinners during auth checks and API calls
- **Error Handling:** User-friendly error messages
- **Responsive Design:** Mobile-friendly chat interface
- **Markdown Rendering:** Rich text support in chat responses

### **Client-Side Routing**
- `/` - Home page
- `/login` - Login form
- `/register` - Registration form
- `/chat` - Protected chat interface
- `/admin` - Protected admin panel (role check)

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 20+
- MongoDB Atlas account or local MongoDB
- Google AI API key (Gemini)

### **Environment Variables**
Create `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
GOOGLE_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_secret_key_min_32_characters
```

### **Installation**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### **Dependencies**
```json
{
  "@google/generative-ai": "^0.24.1",
  "mongoose": "^9.1.1",
  "bcryptjs": "^3.0.3",
  "jose": "^6.1.3",
  "next": "16.0.10",
  "react": "19.2.1",
  "react-markdown": "^10.1.0"
}
```

---

## 📊 Key Technical Decisions

### **Why MongoDB with Binary Blobs?**
- **Simplicity:** Single database for all data (users + PDFs)
- **No External Storage:** Eliminates Firebase Storage dependency
- **Atomic Operations:** File + metadata saved together
- **Easy Backup:** Complete system in one MongoDB backup

### **Why JWT over Firebase Auth?**
- **Full Control:** Custom user management
- **No Vendor Lock-in:** Framework agnostic
- **Flexible Roles:** Easy to extend (user, admin, lecturer, etc.)
- **Lightweight:** No Firebase SDK overhead

### **Why Gemini File API over Text Extraction?**
- **Better Hebrew Support:** Native PDF reading
- **Preserves Formatting:** Tables, lists, structure intact
- **No Parsing Errors:** Direct PDF processing
- **More Accurate:** Gemini reads exactly what's in the file

### **Why Librarian Architecture?**
- **Efficiency:** Only fetch relevant documents
- **Scalability:** Works with 100+ PDFs
- **Cost Optimization:** Minimize Gemini API calls
- **Better UX:** Faster responses

---

## 🔧 Development Workflow

### **File Upload Testing**
1. Register admin user in MongoDB (set role: 'admin')
2. Login as admin
3. Navigate to `/admin`
4. Upload PDF (Hebrew preferred)
5. Wait for metadata extraction (check console logs)
6. Verify in MongoDB: PdfDocument collection

### **Chat Testing**
1. Login as any user
2. Navigate to `/chat`
3. Ask question related to uploaded PDFs
4. Check console logs:
   - `📚 [FETCH MENU]` - Document retrieval
   - `🔍 [ROUTER]` - Document selection
   - `📤 [UPLOAD]` - File upload to Gemini
   - `🤖 [GENERATION]` - Response generation

### **Error Monitoring**
- All backend functions have emoji-prefixed console logs
- Rate limiting errors return Hebrew warnings (no crashes)
- MongoDB connection errors logged with details
- JWT verification failures redirect to login

---

## 📝 API Endpoints

### **POST /api/auth/register**
- Body: `{ name, email, password }`
- Returns: `{ token, user: { id, name, email, role } }`
- Status: 201 (success), 409 (duplicate email), 400 (validation error)

### **POST /api/auth/login**
- Body: `{ email, password }`
- Returns: `{ token, user: { id, name, email, role } }`
- Status: 200 (success), 401 (invalid credentials)

### **POST /api/upload**
- Headers: `Content-Type: multipart/form-data`
- Body: FormData with 'file' field (PDF)
- Returns: `{ docId, fileName, summary }`
- Status: 201 (success), 400 (invalid file), 500 (processing error)

### **POST /api/chat**
- Body: `{ message: string }`
- Returns: `{ response: string, selectedDocId: string, usedContext: boolean }`
- Status: 200 (success), 400 (invalid request), 429 (rate limited)

---

## 🐛 Troubleshooting

### **"Cannot connect to MongoDB"**
- Check `MONGODB_URI` in `.env.local`
- Verify MongoDB Atlas IP whitelist
- Test connection string in MongoDB Compass

### **"fetch failed" or "429" errors**
- Google API quota exceeded
- User sees Hebrew warning message
- Wait a few minutes and retry
- Check quota in Google AI Studio

### **"Token verification failed"**
- Check `JWT_SECRET` in `.env.local`
- Clear localStorage in browser
- Re-login to get new token

### **PDFs not uploading**
- Check file size (limit: 20MB for Gemini)
- Verify user role is 'admin'
- Check console logs for detailed errors

---

## 🚀 Deployment

### **Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables in Vercel:**
- Add all `.env.local` variables in Vercel dashboard
- MongoDB URI must allow Vercel's IP ranges
- Google API key must have Gemini API enabled

---

## 📜 License

This project is built for Braude Academic College as an educational assistant tool.

---

## 👥 Contributors

- **qassem231** - Project Creator & Lead Developer

---

## 🔮 Future Enhancements

- [ ] Support for multiple file formats (DOCX, TXT)
- [ ] Advanced search with filters (by category, keywords)
- [ ] Chat history persistence per user
- [ ] Document versioning
- [ ] Multi-language support (Arabic, English)
- [ ] Analytics dashboard for admin
- [ ] Batch PDF upload
- [ ] Document expiration/archival
- [ ] Voice input support
- [ ] Export chat conversations

---

## 📞 Support

For questions or issues, please open an issue on GitHub: [qassem231/MorehGuide](https://github.com/qassem231/MorehGuide)
