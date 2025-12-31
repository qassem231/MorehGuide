import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Only protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log(`🔐 [MIDDLEWARE]: Checking admin access for ${request.nextUrl.pathname}`);

    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value;

    if (!token) {
      console.warn('⚠️ [MIDDLEWARE]: No token provided, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token
    const payload = await verifyToken(token);

    if (!payload) {
      console.warn('⚠️ [MIDDLEWARE]: Invalid token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user is admin
    if (payload.role !== 'admin') {
      console.warn(`⚠️ [MIDDLEWARE]: User ${payload.email} is not admin, access denied`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log(`✅ [MIDDLEWARE]: Admin access granted for ${payload.email}`);
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which paths should be protected
export const config = {
  matcher: ['/admin/:path*'],
};
