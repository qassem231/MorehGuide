# MorehGuide - File Classification & Next.js Best Practices

## FRONTEND FILES (add "use client")
These are UI components and client-side pages that use React hooks and interactivity.

### Pages
- app/page.tsx - Home/redirect page ✅ ALREADY HAS 'use client'
- app/chat/page.tsx - Chat interface ✅ ALREADY HAS 'use client'
- app/login/page.tsx - Login page ✅ ALREADY HAS 'use client'
- app/register/page.tsx - Registration page ✅ ALREADY HAS 'use client'
- app/settings/page.tsx - User settings page ✅ ALREADY HAS 'use client'
- app/admin/files/page.tsx - Admin file manager ✅ ALREADY HAS 'use client'
- app/admin/setup/page.tsx - Admin setup page ✅ ALREADY HAS 'use client'
- app/role-selection/page.tsx - Role selection page ✅ ALREADY HAS 'use client'
- app/setup/page.tsx - Initial setup page ✅ ALREADY HAS 'use client'
- app/layout.tsx - Root layout with Navbar ✅ FIXED - Added 'use client'

### Components
- components/Navbar.tsx - Navigation bar ✅ ALREADY HAS 'use client'
- components/RoleSelectionModal.tsx - Role selection modal ✅ ALREADY HAS 'use client'
- components/chat/ChatArea.tsx - Chat UI ✅ ALREADY HAS 'use client'
- components/chat/Sidebar.tsx - Sidebar navigation ✅ ALREADY HAS 'use client'
- components/admin/UploadButton.tsx - Upload button ✅ ALREADY HAS 'use client'
- components/auth/LoginForm.tsx - Login form ✅ ALREADY HAS 'use client'
- components/auth/RegisterForm.tsx - Registration form ✅ ALREADY HAS 'use client'
- components/ui/Button.tsx - Reusable button ✅ ALREADY HAS 'use client'
- components/ui/Input.tsx - Reusable input ✅ ALREADY HAS 'use client'

---

## BACKEND FILES (add "use server")
These handle server operations, database access, and API integrations.

### API Routes (Server)
- app/api/upload/route.ts - File upload ✅ ALREADY HAS 'use server'
- app/api/setup/route.ts - Setup endpoint ✅ ALREADY HAS 'use server'
- app/api/chat/route.ts - Chat endpoint ✅ ALREADY HAS 'use server'
- app/api/chats/route.ts - Chat list endpoint ✅ ALREADY HAS 'use server'
- app/api/chats/[id]/route.ts - Chat detail endpoint ✅ ALREADY HAS 'use server'
- app/api/auth/login/route.ts - Login endpoint ✅ ALREADY HAS 'use server'
- app/api/auth/register/route.ts - Registration endpoint ✅ ALREADY HAS 'use server'
- app/api/user/profile/route.ts - Profile endpoint ✅ FIXED - Added 'use server'
- app/api/user/update-role/route.ts - Role update endpoint ✅ FIXED - Added 'use server'
- app/api/admin/files/route.ts - Admin files endpoint ✅ FIXED - Added 'use server'
- app/api/admin/files/[id]/route.ts - Admin file detail ✅ ALREADY HAS 'use server'
- app/api/admin/files/delete/route.ts - Admin delete endpoint ✅ FIXED - Added 'use server'
- app/api/admin/migrate/route.ts - Admin migration endpoint ✅ ALREADY HAS 'use server'
- app/api/admin/promote/route.ts - Admin promote endpoint ✅ FIXED - Added 'use server'
- app/api/admin/setup/route.ts - Admin setup endpoint ✅ ALREADY HAS 'use server'

### Backend Services
- backend/gemini.ts - Gemini AI integration ✅ ALREADY HAS 'use server'
- backend/storage.ts - File upload & metadata ✅ ALREADY HAS 'use server'
- backend/models/User.ts - User Mongoose schema ✅ ALREADY HAS 'use server'
- backend/models/Chat.ts - Chat Mongoose schema ✅ ALREADY HAS 'use server'
- backend/models/ChatHistory.ts - Chat history Mongoose schema ✅ ALREADY HAS 'use server'
- backend/models/PdfDocument.ts - PDF document Mongoose schema ✅ ALREADY HAS 'use server'

### Library Files (Backend)
- lib/db.ts - MongoDB connection ✅ ALREADY HAS 'use server'
- lib/auth.ts - JWT utilities ✅ ALREADY HAS 'use server'

### Middleware
- middleware.ts - Next.js middleware ✅ ALREADY HAS 'use server' (correct for edge runtime)

### Config
- next.config.ts - Configuration file (NO directive needed - not executed in runtime)

---

## SHARED FILES (NO directive needed)
These files contain only constants, types, or utility functions. They're safe for both client and server.

### None currently identified
Note: Files like UI components that only export simple elements without hooks could be considered shared,
but they still need 'use client' if they might be used in client contexts.

---

## SECURITY CHECK SUMMARY ✅
**API Keys & Secrets Location:**
- GOOGLE_API_KEY - Used in: backend/gemini.ts ✅ (use server)
- GOOGLE_API_KEY - Used in: backend/storage.ts ✅ (use server)
- MongoDB URI - Used in: lib/db.ts (needs use server)
- JWT_SECRET - Used in: lib/auth.ts (needs use server)

**Status:** ✅ No sensitive data in 'use client' files. All API keys only in backend/server files.

---

## ACTION ITEMS

### ✅ ALL COMPLETE!

**FRONTEND FILES - ALL HAVE 'use client':**
- ✅ app/page.tsx
- ✅ app/chat/page.tsx
- ✅ app/login/page.tsx
- ✅ app/register/page.tsx
- ✅ app/settings/page.tsx
- ✅ app/admin/files/page.tsx
- ✅ app/admin/setup/page.tsx
- ✅ app/role-selection/page.tsx
- ✅ app/setup/page.tsx
- ✅ app/layout.tsx (FIXED)
- ✅ All components in /components

**BACKEND FILES - ALL HAVE 'use server':**
- ✅ All API routes in /api
- ✅ All backend services (/backend)
- ✅ All models (/backend/models)
- ✅ All library files (/lib)
- ✅ middleware.ts
- ✅ app/api/user/profile/route.ts (FIXED)
- ✅ app/api/user/update-role/route.ts (FIXED)
- ✅ app/api/admin/files/route.ts (FIXED)
- ✅ app/api/admin/files/delete/route.ts (FIXED)
- ✅ app/api/admin/promote/route.ts (FIXED)
