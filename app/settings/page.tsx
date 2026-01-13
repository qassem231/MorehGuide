'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiUser, FiLock, FiSliders, FiCamera, FiX, FiSave, FiCheck } from 'react-icons/fi';

type Tab = 'profile' | 'security' | 'preferences';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '' });
  const [profilePicture, setProfilePicture] = useState('');
  const [pictureInputKey, setPictureInputKey] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFormData({ name: parsed.name || '', email: parsed.email || '' });
      setProfilePicture(parsed.profilePicture || '');
    }
    setIsLoading(false);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      setMessageType('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        setProfilePicture(base64);
        setHasChanges(true);

        // Immediately save to database
        const token = localStorage.getItem('token');
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            name: formData.name,
            email: formData.email,
            profilePicture: base64
          }),
        });

        if (!res.ok) throw new Error('Failed to save profile picture');

        const userData = { ...user, profilePicture: base64 };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setMessage('Profile picture updated!');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      } catch (error: any) {
        setMessage('Failed to save picture: ' + error.message);
        setMessageType('error');
      }
      setPictureInputKey(pictureInputKey + 1);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setProfilePicture('');
      setHasChanges(true);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: formData.name,
          email: formData.email,
          profilePicture: ''
        }),
      });

      if (!res.ok) throw new Error('Failed to remove picture');

      const userData = { ...user, profilePicture: '' };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setMessage('Profile picture removed');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('Failed: ' + error.message);
      setMessageType('error');
    }
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: formData.name,
          email: formData.email,
          profilePicture
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      const userData = { ...user, ...formData, profilePicture };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      setHasChanges(false);
      setMessage('Changes saved successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('Failed to save: ' + error.message);
      setMessageType('error');
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Please log in to access settings</div>;

  const roleColor = user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-green-500/20 text-green-400 border-green-500/50';
  const roleLabel = user.role === 'admin' ? 'Lecturer' : 'Student';

  return (
    <div className="h-full bg-gradient-to-br from-brand-dark via-brand-slate to-brand-dark\">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/chat"
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <FiArrowLeft size={20} />
            Back
          </Link>
          <h1 className="text-4xl font-bold text-brand-cream">Settings</h1>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'}`}>
            {message}
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 space-y-2">
              {[
                { id: 'profile', label: 'Profile', icon: FiUser },
                { id: 'security', label: 'Security', icon: FiLock },
                { id: 'preferences', label: 'Preferences', icon: FiSliders },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as Tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-gradient-brand text-white border-l-4 border-brand-accent'
                      : 'text-brand-light hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Avatar Hero Section */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Avatar */}
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-full bg-gradient-brand flex items-center justify-center overflow-hidden border-4 border-brand-slate/50 shadow-2xl">
                        {profilePicture ? (
                          <img src={profilePicture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-6xl">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      
                      {/* Edit Overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <label htmlFor="picture-upload" className="cursor-pointer p-4">
                          <FiCamera className="w-8 h-8 text-white" />
                        </label>
                        <input
                          key={pictureInputKey}
                          id="picture-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePictureUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-brand-cream mb-2">{user.name}</h2>
                      <p className="text-brand-light/70 mb-4">{user.email}</p>
                      
                      {/* Role Pill */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`px-4 py-2 rounded-full border ${roleColor} font-semibold`}>
                          {roleLabel}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {profilePicture && (
                          <button
                            onClick={handleRemoveProfilePicture}
                            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-all border border-red-500/30"
                          >
                            <FiX size={16} />
                            Remove Picture
                          </button>
                        )}
                        <Link
                          href="/role-selection"
                          className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg transition-all border border-purple-500/30 text-center justify-center"
                        >
                          Change Role
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                    <label className="block text-sm text-brand-light/70 mb-2 font-semibold">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-brand-dark/50 border border-brand-slate/50 rounded-lg px-4 py-3 text-brand-cream focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                    <label className="block text-sm text-brand-light/70 mb-2 font-semibold">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-brand-dark/50 border border-brand-slate/50 rounded-lg px-4 py-3 text-brand-cream focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-brand-cream mb-6">Security Settings</h3>
                <div className="space-y-4">
                  <div className="bg-brand-slate/30 border border-brand-slate/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-brand-cream mb-2">Password Management</h4>
                    <p className="text-brand-light/70 mb-4">Change your password regularly to keep your account secure.</p>
                    <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-all border border-blue-500/30">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-brand-cream mb-6">Preferences</h3>
                <div className="space-y-4">
                  <div className="bg-brand-slate/30 border border-brand-slate/50 rounded-xl p-6">
                    <p className="text-brand-light/70">Preference settings coming soon...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-dark border-t border-brand-slate/30 backdrop-blur-lg p-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-brand-light">You have unsaved changes</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFormData({ name: user.name || '', email: user.email || '' });
                  setProfilePicture(user.profilePicture || '');
                  setHasChanges(false);
                }}
                className="px-6 py-2 text-brand-light hover:text-brand-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-2 bg-gradient-brand hover:shadow-brand text-white font-semibold px-6 py-2 rounded-lg transition-all"
              >
                <FiSave size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
