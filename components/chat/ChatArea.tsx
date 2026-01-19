'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAreaProps {
  currentChatId: string | null;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  onChatIdChange?: (chatId: string) => void;
  onNewChatCreated?: () => void;
  isGuest?: boolean;
}

export default function ChatArea({ currentChatId, messages, setMessages, onChatIdChange, onNewChatCreated, isGuest = false }: ChatAreaProps) {
  console.log('ChatArea component rendered with currentChatId:', currentChatId, 'messages count:', messages.length, 'isGuest:', isGuest);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history when currentChatId changes
  useEffect(() => {
    console.log('ChatArea useEffect triggered, currentChatId:', currentChatId);
    if (!currentChatId) {
      console.log('currentChatId is null, messages already cleared by parent');
      return;
    }

    const loadChatHistory = async () => {
      try {
        console.log('Loading chat history for:', currentChatId);
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`/api/chat?chatId=${currentChatId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data: { messages?: Message[] } = await res.json();

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          console.log('Loaded', data.messages.length, 'messages');
          setMessages(data.messages);
        } else {
          console.log('No messages found, showing initial greeting');
          setMessages([
            {
              role: 'assistant',
              content:
                'שלום! אני עוזר ה-AI של המכללה האקדמית בראודה. אני יכול לסייע במידע על נהלים ותקנות במכללה, בהתבסס על נתונים מאתר המכללה.',
            },
          ]);
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    };

    loadChatHistory();
  }, [currentChatId, setMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const userInput = input;
    
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Step 1: Create new chat if needed (skip for guests)
      let activeChatId: string | null = currentChatId;
      if (!activeChatId && !isGuest) {
        const chatRes = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            message: userInput,
            isFirstMessage: true,
          }),
        });

        if (!chatRes.ok) {
          throw new Error('Failed to create chat');
        }

        const chatData = await chatRes.json();
        activeChatId = chatData.chatId;

        if (onChatIdChange && activeChatId) {
          onChatIdChange(activeChatId);
        }

        if (onNewChatCreated) {
          onNewChatCreated();
        }
      }

      // Step 2: Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ 
          message: userInput,
          chatId: activeChatId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // FIX: Added bg-gray-50 for light mode, dark:bg-brand-dark for dark mode
    <div className="flex-1 flex flex-col h-[calc(100dvh-64px)] overflow-hidden bg-white dark:bg-slate-950 relative w-full transition-colors duration-300">
      
      {/* Top Bar with Header */}
      <div className="shrink-0 h-16 border-b border-gray-200 dark:border-brand-slate/30 bg-white/95 dark:bg-brand-dark/95 backdrop-blur-sm flex items-center px-3 sm:px-6 transition-colors duration-300">
        <span className="text-xl sm:text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">MorehGuide</span>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 pb-28 sm:pb-32 px-2 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-1 sm:space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} px-0.5 sm:px-0`}
          >
            {message.role === 'assistant' && (
              <div className="shrink-0 w-6 sm:w-8 h-6 sm:h-8 bg-gradient-brand rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                <FiMessageSquare className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85vw] sm:max-w-sm md:max-w-md lg:max-w-lg px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg ${
                message.role === 'user'
                  ? 'bg-gradient-brand text-white rounded-br-none shadow-brand text-sm sm:text-base'
                  // FIX: Light mode uses white bg + gray text. Dark mode uses slate bg + cream text.
                  : 'bg-white text-gray-800 border border-gray-200 dark:bg-brand-slate/70 dark:text-brand-cream dark:border-brand-slate/50 backdrop-blur-sm rounded-bl-none text-sm sm:text-base'
              }`}
              dir="auto"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // FIX: Added dark: prefixes to text colors so headers are visible in both modes
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-brand-cream">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-md font-bold mb-2 text-gray-900 dark:text-brand-cream">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-brand-cream">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.role === 'user' && (
              <div className="shrink-0 w-6 sm:w-8 h-6 sm:h-8 bg-gray-200 dark:bg-brand-slate rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                <FiUser className="w-3 sm:w-4 h-3 sm:h-4 text-brand-accent" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-2 sm:space-x-3 justify-start px-0.5 sm:px-0">
            <div className="shrink-0 w-6 sm:w-8 h-6 sm:h-8 bg-gradient-brand rounded-full flex items-center justify-center shadow-md">
              <FiMessageSquare className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
            </div>
            <div className="max-w-[75vw] sm:max-w-xs lg:max-w-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg bg-white text-gray-800 border border-gray-200 dark:bg-brand-slate/70 dark:text-brand-cream dark:border-brand-slate/50 rounded-bl-none backdrop-blur-sm text-sm sm:text-base">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Box */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl sm:max-w-3xl z-10">
        <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-white/80 dark:bg-brand-slate/50 backdrop-blur-sm rounded-full border border-gray-200 dark:border-brand-slate/30 shadow-lg transition-colors duration-300">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full px-3 sm:px-4 py-2 bg-white dark:bg-brand-slate/70 border border-gray-200 dark:border-brand-slate/50 rounded-full text-xs sm:text-sm text-gray-900 dark:text-brand-cream placeholder-gray-400 dark:placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:opacity-50 transition-all duration-200"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 sm:px-4 py-2 bg-gradient-brand hover:shadow-brand text-white rounded-full transition-all duration-200 flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 font-semibold text-xs sm:text-sm shrink-0"
          >
            <FiSend className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}