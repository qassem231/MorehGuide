'use client';

import { FiSettings, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { FaCloudUploadAlt } from 'react-icons/fa';
import UploadButton from '../admin/UploadButton';

interface SidebarProps {
  userRole: string | null;
}

export default function Sidebar({ userRole }: SidebarProps) {
  console.log("Sidebar received userRole:", userRole);

  return (
    <div className="w-64 bg-brand-slate text-brand-cream flex flex-col shadow-lg">
      {/* New Chat Button */}
      <div className="p-4 border-b border-brand-accent/20">
        <button className="w-full flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-slate text-brand-dark rounded-xl transition-all duration-200 font-medium">
          <FiPlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Previous Chats */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {['Chat 1', 'Chat 2', 'Chat 3', 'Chat 4'].map((chat, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 hover:bg-brand-accent/20 rounded-lg cursor-pointer transition-colors"
            >
              <FiMessageSquare className="w-4 h-4 text-brand-cream/70" />
              <span className="text-sm text-brand-cream truncate">{chat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Upload Button for Admins */}
      {userRole === 'admin' && (
        <div className="p-4 border-t border-brand-accent/20">
          <UploadButton />
        </div>
      )}

      {/* Settings Button */}
      <div className="p-4 border-t border-brand-accent/20">
        <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-brand-accent/20 rounded-lg transition-colors">
          <FiSettings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}