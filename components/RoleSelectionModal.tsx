'use client';

import { useState } from 'react';
import { FiBookOpen, FiUserCheck } from 'react-icons/fi';

interface RoleSelectionModalProps {
  onRoleSelect: (role: 'student' | 'lecturer') => void;
}

export default function RoleSelectionModal({ onRoleSelect }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'lecturer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = async (role: 'student' | 'lecturer') => {
    console.log(`📋 [MODAL]: Role button clicked: ${role}`);
    setIsLoading(true);
    setSelectedRole(role);
    
    // Brief delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Call parent with selected role
    console.log(`✅ [MODAL]: Calling onRoleSelect with: ${role}`);
    onRoleSelect(role);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-brand-slate/95 border border-brand-slate/50 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-2">
            Select Your Role
          </h2>
          <p className="text-brand-light/70">Choose your role to access personalized content</p>
        </div>

        {/* Role Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Card */}
          <button
            onClick={() => handleRoleSelect('student')}
            disabled={isLoading}
            className="group relative"
          >
            <div
              className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 transition-all duration-300 cursor-pointer overflow-hidden
              ${selectedRole === 'student' && isLoading ? 'scale-95 opacity-50' : 'hover:scale-105 hover:border-emerald-500/50'}
              ${selectedRole === 'student' ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''}`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <FiBookOpen className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-cream">Student</h3>
                  <p className="text-sm text-brand-light/60">View student materials</p>
                </div>
              </div>
            </div>
          </button>

          {/* Lecturer Card */}
          <button
            onClick={() => handleRoleSelect('lecturer')}
            disabled={isLoading}
            className="group relative"
          >
            <div
              className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 transition-all duration-300 cursor-pointer overflow-hidden
              ${selectedRole === 'lecturer' && isLoading ? 'scale-95 opacity-50' : 'hover:scale-105 hover:border-sky-500/50'}
              ${selectedRole === 'lecturer' ? 'ring-2 ring-sky-500 bg-sky-500/10' : ''}`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <FiUserCheck className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-cream">Lecturer</h3>
                  <p className="text-sm text-brand-light/60">View lecturer materials</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
            <span className="text-sm font-semibold">Setting up...</span>
          </div>
        )}
      </div>
    </div>
  );
}
