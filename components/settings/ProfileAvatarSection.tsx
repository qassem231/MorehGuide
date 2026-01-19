"use client";

import { FiCamera, FiX } from "react-icons/fi";
import Link from "next/link";

interface ProfileAvatarSectionProps {
  user: any;
  profilePicture: string;
  pictureInputKey: number;
  onPictureUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePicture: () => void;
}

export default function ProfileAvatarSection({
  user,
  profilePicture,
  pictureInputKey,
  onPictureUpload,
  onRemovePicture,
}: ProfileAvatarSectionProps) {
  const roleColor =
    user.role === "admin"
      ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50"
      : "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/50";

  const roleLabel = user.role === "admin" ? "Lecturer" : "Student";

  return (
    <div className="bg-white dark:bg-brand-slate/20 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-40 h-40 rounded-full bg-gradient-brand flex items-center justify-center overflow-hidden border-4 border-white dark:border-brand-slate/50 shadow-xl">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-6xl">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>

          {/* Edit Overlay */}
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <label
              htmlFor="picture-upload"
              className="cursor-pointer p-4"
              title="Click to upload a new profile picture"
            >
              <FiCamera className="w-8 h-8 text-white" />
            </label>
            <input
              key={pictureInputKey}
              id="picture-upload"
              type="file"
              accept="image/*"
              title="Upload a profile picture (JPG, PNG, etc.)"
              onChange={onPictureUpload}
              className="hidden"
              aria-label="Upload profile picture"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-brand-cream mb-2">
            {user.name}
          </h2>
          <p className="text-gray-500 dark:text-brand-light/70 mb-4">
            {user.email}
          </p>

          {/* Role Pill */}
          <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
            <div
              className={`px-4 py-2 rounded-full border ${roleColor} font-semibold`}
            >
              {roleLabel}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            {profilePicture && (
              <button
                onClick={onRemovePicture}
                className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 dark:border-red-500/30 px-4 py-2 rounded-lg transition-all"
              >
                <FiX size={16} />
                Remove Picture
              </button>
            )}
            <Link
              href="/role-selection"
              className="flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-600 border border-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-400 dark:border-purple-500/30 px-4 py-2 rounded-lg transition-all"
            >
              Change Role
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
