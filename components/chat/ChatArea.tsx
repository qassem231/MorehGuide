'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatArea() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'שלום! אני עוזר ה-AI של המכללה האקדמית בראודה. אני יכול לסייע במידע על נהלים ותקנות במכללה, בהתבסס על נתונים מאתר המכללה.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/chat', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data: { messages?: Message[] } = await res.json();

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  };

  loadHistory();
}, []);


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-dark">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center shadow-md">
                <FiMessageSquare className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl shadow-lg ${
                message.role === 'user'
                  ? 'bg-gradient-brand text-white rounded-br-md shadow-brand'
                  : 'bg-brand-slate/70 text-brand-cream rounded-bl-md border border-brand-slate/50 backdrop-blur-sm'
              }`}
              dir="auto"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-brand-cream">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-md font-bold mb-2 text-brand-cream">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2 text-brand-cream">{children}</h3>,
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
              <div className="flex-shrink-0 w-8 h-8 bg-brand-slate rounded-full flex items-center justify-center shadow-md">
                <FiUser className="w-4 h-4 text-brand-accent" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center shadow-md">
              <FiMessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl shadow-lg bg-brand-slate/70 text-brand-cream rounded-bl-md border border-brand-slate/50 backdrop-blur-sm">
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

      {/* Input Area */}
      <div className="p-6 border-t border-brand-slate/30 bg-brand-slate/50 backdrop-blur-sm shadow-xl">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 bg-brand-slate/70 border border-brand-slate/50 rounded-full text-brand-cream placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent disabled:opacity-50 transition-all duration-200"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-brand hover:shadow-brand text-white rounded-full transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 font-semibold"
          >
            <FiSend className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
