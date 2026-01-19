"use server";

/**
 * AUTHENTICATION UTILITIES
 *
 * This file handles:
 * - Password hashing (making passwords secure before saving to database)
 * - JWT token creation (for keeping users logged in)
 * - JWT token verification (checking if user is logged in)
 *
 * How it works:
 * 1. User registers → we hash their password with bcryptjs
 * 2. User logs in → we check password, create JWT token
 * 3. User makes requests → we verify JWT token to confirm identity
 */

import { SignJWT, jwtVerify } from "jose";
import bcryptjs from "bcryptjs";

// Secret key for signing JWT tokens (loaded from environment variables)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this",
);

/**
 * Hash a password using bcryptjs
 * Input: Plain text password like "mypassword123"
 * Output: Hashed password like "$2a$10$abc123xyz..."
 */
export async function hashPassword(password: string): Promise<string> {
  console.log("🔐 [AUTH]: Hashing password with bcryptjs");
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);
  console.log("✅ [AUTH]: Password hashed successfully");
  return hashedPassword;
}

/**
 * Verify a password against its bcryptjs hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  console.log("🔐 [AUTH]: Verifying password against hash");
  const isValid = await bcryptjs.compare(password, hash);
  if (isValid) {
    console.log("✅ [AUTH]: Password verified successfully");
  } else {
    console.log("❌ [AUTH]: Password verification failed");
  }
  return isValid;
}

/**
 * Sign a JWT token using jose
 */
export async function signToken(payload: {
  userId: string;
  email: string;
  role: string;
  isAdmin?: boolean;
  activeRole?: "student" | "lecturer";
}): Promise<string> {
  console.log(`🔑 [AUTH]: Signing JWT token for user: ${payload.email}`);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  console.log("✅ [AUTH]: JWT token signed successfully");
  return token;
}

/**
 * Verify a JWT token using jose
 */
export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
  isAdmin?: boolean;
  activeRole?: "student" | "lecturer";
} | null> {
  try {
    console.log("🔑 [AUTH]: Verifying JWT token");
    const verified = await jwtVerify(token, JWT_SECRET);
    console.log("✅ [AUTH]: JWT token verified successfully");
    return verified.payload as {
      userId: string;
      email: string;
      role: string;
      isAdmin?: boolean;
      activeRole?: "student" | "lecturer";
    };
  } catch (error) {
    console.error("❌ [AUTH]: JWT token verification failed:", error);
    return null;
  }
}
