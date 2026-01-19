"use server";

/**
 * MONGODB DATABASE CONNECTION
 *
 * This file manages the connection to our MongoDB database.
 *
 * How it works:
 * - First API call: Creates new MongoDB connection
 * - Subsequent calls: Reuses existing connection (faster!)
 * - Uses connection caching to prevent creating too many connections
 *
 * Usage: Import and call connectToDatabase() before any database operation
 */

import mongoose from "mongoose";

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Connection caching for performance
 * This prevents creating multiple connections during development hot reloads
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB database
 * Returns: MongoDB connection object
 * Note: Reuses existing connection if available
 */
export async function connectToDatabase() {
  if (cached.conn) {
    console.log("✅ [DB]: Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("🟡 [DB]: Establishing new MongoDB connection...");
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("🟢 [DB]: MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ [DB]: MongoDB connection failed:", error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
