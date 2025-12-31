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
    <div className="w-64 bg-brand-slate/50 backdrop-blur-sm text-brand-cream flex flex-col shadow-lg border-r border-brand-slate/30">
      {/* New Chat Button */}
      <div className="p-4 border-b border-brand-slate/30">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-brand hover:shadow-brand text-white rounded-lg transition-all duration-200 font-semibold shadow-md">
          <FiPlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Previous Chats */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-brand-light/70 font-semibold px-3 py-2 uppercase tracking-wider">Recent Chats</p>
        <div className="space-y-1">
          {['Chat 1', 'Chat 2', 'Chat 3', 'Chat 4'].map((chat, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2.5 hover:bg-brand-slate/50 rounded-lg cursor-pointer transition-all duration-200 group"
            >
              <FiMessageSquare className="w-4 h-4 text-brand-light/60 group-hover:text-brand-accent" />
              <span className="text-sm text-brand-cream/80 truncate group-hover:text-brand-cream">{chat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Upload Button for Admins */}
      {userRole === 'admin' && (
        <div className="p-4 border-t border-brand-slate/30">
          <UploadButton />
        </div>
      )}

      {/* Settings Button */}
      <div className="p-4 border-t border-brand-slate/30">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-brand-slate/50 rounded-lg transition-all duration-200 font-semibold text-brand-light hover:text-brand-accent">
          <FiSettings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}