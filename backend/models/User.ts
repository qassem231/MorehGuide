"use server";

/**
 * USER DATABASE MODEL
 *
 * This file defines the structure of user data in MongoDB.
 *
 * Fields:
 * - name: User's full name
 * - email: User's email (unique, used for login)
 * - password: Hashed password (never stored in plain text!)
 * - role: 'student' or 'lecturer' (determines which PDFs they can see)
 * - isAdmin: true if user has admin access to upload/delete PDFs
 * - profilePicture: Base64 encoded image (optional)
 * - createdAt: When user registered
 *
 * How roles work:
 * - 'student': Can only see PDFs marked for students
 * - 'lecturer': Can see PDFs marked for lecturers
 * - isAdmin=true: Can access admin panel to manage PDFs
 */

import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for type checking
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "pending" | "student" | "lecturer";
  isAdmin: boolean;
  profilePicture?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "pending", "student", "lecturer"],
        message:
          "Role must be either user, admin, pending, student, or lecturer",
      },
      default: "pending",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

// Prevent model recompilation in development
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
