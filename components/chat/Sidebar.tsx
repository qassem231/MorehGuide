'use client';

import { useEffect, useState } from 'react';
import { FiSettings, FiPlus, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { FaCloudUploadAlt } from 'react-icons/fa';
import UploadButton from '../admin/UploadButton';

interface Chat {
  _id: string;
  chatId: string;
  title: string;
}

interface SidebarProps {
  userRole: string | null;
  currentChatId: string | null;
  onChatSelect: (chatId: string | null) => void;
  refreshTrigger?: number;
}

export default function Sidebar({ userRole, currentChatId, onChatSelect, refreshTrigger }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('Sidebar received userRole:', userRole);

  // Fetch chats from API
  useEffect(() => {
    const loadChats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/chats', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Loaded chats:', data.chats);
          setChats(data.chats || []);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [refreshTrigger]);

  const handleNewChat = () => {
    console.log('New Chat button clicked, setting currentChatId to null');
    onChatSelect(null);
  };

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatMongoId: string) => {
    e.stopPropagation(); // Prevent triggering chat select
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('Attempting to delete chat:', chatMongoId);
      const res = await fetch(`/api/chats/${chatMongoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      console.log('Delete response:', res.status, responseData);

      if (!res.ok) {
        console.error('Delete failed:', responseData.error || 'Unknown error');
        throw new Error(responseData.error || 'Failed to delete chat');
      }

      // Remove from sidebar
      setChats((prev) => prev.filter((chat) => chat._id !== chatMongoId));

      // If deleted chat was active, clear it
      const deletedChat = chats.find((c) => c._id === chatMongoId);
      if (deletedChat && currentChatId === deletedChat.chatId) {
        onChatSelect(null);
      }

      console.log('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  };

  return (
    <div className="w-64 bg-brand-slate/50 backdrop-blur-sm text-brand-cream flex flex-col shadow-lg border-r border-brand-slate/30">
      {/* New Chat Button */}
      <div className="p-4 border-b border-brand-slate/30">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-brand hover:shadow-brand text-white rounded-lg transition-all duration-200 font-semibold shadow-md"
        >
          <FiPlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Previous Chats */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-brand-light/70 font-semibold px-3 py-2 uppercase tracking-wider">
          Recent Chats
        </p>
        <div className="space-y-1">
          {isLoading ? (
            <p className="text-xs text-brand-light/50 px-3 py-2">Loading chats...</p>
          ) : chats.length === 0 ? (
            <p className="text-xs text-brand-light/50 px-3 py-2">No chats yet</p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat._id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                  currentChatId === chat.chatId
                    ? 'bg-brand-slate/80 border-l-2 border-brand-accent'
                    : 'hover:bg-brand-slate/50'
                }`}
              >
                <button
                  onClick={() => handleChatSelect(chat.chatId)}
                  className="flex-1 flex items-center gap-2 text-left truncate"
                >
                  <FiMessageSquare className="w-4 h-4 text-brand-light/60 group-hover:text-brand-accent flex-shrink-0" />
                  <span className="text-sm text-brand-cream/80 group-hover:text-brand-cream truncate">
                    {chat.title}
                  </span>
                </button>
                <button
                  onClick={(e) => handleDeleteChat(e, chat._id)}
                  className="p-1.5 rounded hover:bg-red-500/20 text-brand-light/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
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