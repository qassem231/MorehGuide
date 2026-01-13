"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiTrash2, FiFileText, FiCloud, FiArrowLeft, FiCheck, FiEdit2, FiX } from 'react-icons/fi';

export default function AdminFilesPage() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAudience, setEditingAudience] = useState<'student' | 'lecturer' | 'everyone' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const checkAuthorization = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }
      
      try {
        const user = JSON.parse(userData);
        if (!user.isAdmin) {
          console.warn('❌ Unauthorized: User is not admin');
          setError('You do not have permission to access this page');
          setTimeout(() => router.push('/chat'), 2000);
          return;
        }
        setIsAuthorized(true);
      } catch (err) {
        console.error('Error parsing user data:', err);
        router.push('/login');
      }
    };

    checkAuthorization();

    // Listen for file upload events
    const handleFilesUpdated = () => {
      loadFiles();
    };
    window.addEventListener('filesUpdated', handleFilesUpdated);
    return () => window.removeEventListener('filesUpdated', handleFilesUpdated);
  }, [router]);

  const loadFiles = async () => {
    if (!isAuthorized) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      console.log('🔄 [FRONTEND]: Loading files...');
      
      const res = await fetch('/api/admin/files', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      console.log(`📥 [FRONTEND]: API Response Status: ${res.status}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ [FRONTEND]: API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      
      const data = await res.json();
      console.log('📥 [FRONTEND]: Files Response:', data);
      console.log(`📊 [FRONTEND]: Retrieved ${data.length || 0} files`);
      
      if (data.length > 0) {
        console.log('📋 [FRONTEND]: Sample file structure:', data[0]);
      }
      
      setFiles(Array.isArray(data) ? data : (data.files || []));
    } catch (err: any) {
      console.error('❌ [FRONTEND]: Error loading files:', err);
      setError(err.message);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [isAuthorized]);

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setDeleting(fileId);
      const res = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      console.log('Delete response:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }

      alert('File deleted successfully!');
      loadFiles(); // Refresh the list
    } catch (err: any) {
      alert(`Error deleting file: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleEditAudience = async (fileId: string, newAudience: 'student' | 'lecturer' | 'everyone') => {
    try {
      console.log(`🔄 [FRONTEND]: Updating audience for file ${fileId} to ${newAudience}`);
      
      const token = localStorage.getItem('token');
      const requestBody = { audience: newAudience };
      console.log('📤 [FRONTEND]: Request body:', requestBody);
      
      const res = await fetch(`/api/admin/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await res.json();
      console.log('📥 [FRONTEND]: API Response:', responseData);
      console.log('🎯 [FRONTEND]: Response audience field:', responseData.audience);

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to update audience');
      }

      const finalAudience = responseData.audience || newAudience;
      console.log(`✅ [FRONTEND]: Using audience: ${finalAudience}`);

      // Update the file in local state with the response audience
      setFiles(prevFiles =>
        prevFiles.map(file =>
          file._id === fileId ? { ...file, audience: finalAudience } : file
        )
      );

      setEditingId(null);
      setEditingAudience(null);
      alert('Audience updated successfully!');
    } catch (err: any) {
      console.error('❌ [FRONTEND]: Error updating audience:', err);
      alert(`Error updating audience: ${err.message}`);
    }
  };

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case 'student':
        return { label: '👨‍🎓 Students', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/50', textColor: 'text-emerald-400' };
      case 'lecturer':
        return { label: '👨‍🏫 Lecturers', bgColor: 'bg-sky-500/20', borderColor: 'border-sky-500/50', textColor: 'text-sky-400' };
      default:
        return { label: '🌍 Everyone', bgColor: 'bg-slate-500/20', borderColor: 'border-slate-500/50', textColor: 'text-slate-400' };
    }
  };

  const handleMigration = async () => {
    if (!window.confirm('This will set audience to "Everyone" for all files without an audience. Continue?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Migration failed');
      }

      const data = await res.json();
      alert(`Migration completed! Updated ${data.modifiedCount} documents.`);
      loadFiles();
    } catch (err: any) {
      alert(`Migration error: ${err.message}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📤 Upload response:', data);

      if (response.ok) {
        alert('PDF uploaded successfully!');
        loadFiles(); // Refresh the list
      } else {
        alert(`Failed to upload PDF: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Error uploading PDF: ${error.message}`);
    }

    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="h-full bg-gradient-to-br from-brand-dark via-brand-slate to-brand-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Authorization Check */}
        {!isAuthorized && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 mb-6">
            <p className="font-semibold">Access Denied</p>
            <p className="text-sm mt-2">{error || 'Checking authorization...'}</p>
            {error && <p className="text-xs mt-2 text-red-300">Redirecting to chat in 2 seconds...</p>}
          </div>
        )}

        {isAuthorized && (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <Link
                  href="/chat"
                  className="flex items-center gap-2 text-brand-light hover:text-brand-accent font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:bg-brand-slate/50"
                >
                  <FiArrowLeft size={20} />
                  Back to Chat
                </Link>
                <h1 className="text-4xl font-bold bg-gradient-brand bg-clip-text text-transparent">Admin File Manager</h1>
              </div>
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 bg-gradient-brand hover:shadow-brand text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md"
              >
                <FiCloud size={20} />
                Upload PDF
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-brand-slate/30 backdrop-blur-sm border border-brand-slate/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light/70 text-sm font-semibold uppercase tracking-wide">Total Documents</p>
                <p className="text-4xl font-bold text-brand-accent mt-2">{files.length}</p>
              </div>
              <FiFileText className="w-12 h-12 text-brand-accent/30" />
            </div>
          </div>
          <div className="bg-brand-slate/30 backdrop-blur-sm border border-brand-slate/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light/70 text-sm font-semibold uppercase tracking-wide">System Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <FiCheck className="w-5 h-5 text-green-400" />
                  <p className="text-2xl font-bold text-green-400">Active</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Files Table */}
        <div className="bg-brand-slate backdrop-blur-sm border border-brand-slate/50 rounded-lg overflow-hidden shadow-lg">
          {isLoading ? (
            <div className="p-8 text-center text-brand-light/70">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-brand-accent/30 border-t-brand-accent rounded-full"></div>
              <p className="mt-4">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center text-brand-light/50">
              <FiFileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No files found</p>
              <p className="text-sm mt-2">Upload your first PDF to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-slate/50 border-b border-brand-slate/30">
                  <tr>
                    <th className="text-left py-4 px-6 text-brand-light font-semibold">File Name</th>
                    <th className="text-left py-4 px-6 text-brand-light font-semibold">Audience</th>
                    <th className="text-left py-4 px-6 text-brand-light font-semibold">Uploaded</th>
                    <th className="text-right py-4 px-6 text-brand-light font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate/30">
                  {files.map((file: any) => {
                    const badge = getAudienceBadge(file.audience || 'everyone');
                    const isEditing = editingId === file._id;
                    
                    return (
                      <tr key={file._id} className="hover:bg-brand-slate/20 transition-colors duration-200">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <FiFileText className="w-5 h-5 text-brand-accent flex-shrink-0" />
                            <span className="text-brand-cream font-medium">{file.name || file.fileName || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editingAudience || file.audience || 'everyone'}
                                onChange={(e) => setEditingAudience(e.target.value as any)}
                                className="bg-brand-dark/50 border border-brand-slate/50 rounded px-2 py-1 text-sm text-brand-cream focus:outline-none focus:border-brand-accent"
                              >
                                <option value="student">👨‍🎓 Students</option>
                                <option value="lecturer">👨‍🏫 Lecturers</option>
                                <option value="everyone">🌍 Everyone</option>
                              </select>
                              <button
                                onClick={() => handleEditAudience(file._id, editingAudience || (file.audience as any) || 'everyone')}
                                className="text-green-400 hover:text-green-300"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingAudience(null);
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <FiX size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className={`px-3 py-1 rounded-lg border ${badge.bgColor} ${badge.borderColor} text-xs font-semibold ${badge.textColor}`}>
                                {badge.label}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingId(file._id);
                                  setEditingAudience(file.audience || 'everyone');
                                }}
                                className="p-1 text-brand-light/60 hover:text-brand-accent transition-colors"
                              >
                                <FiEdit2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-brand-light/70 text-sm">
                          {file.uploadDate 
                            ? new Date(file.uploadDate).toLocaleDateString() 
                            : (file.createdAt 
                              ? new Date(file.createdAt).toLocaleDateString() 
                              : 'N/A')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteFile(file._id)}
                            disabled={deleting === file._id}
                            className="flex items-center gap-2 ml-auto bg-red-500/20 hover:bg-red-500/40 disabled:bg-brand-slate/50 text-red-400 hover:text-red-300 disabled:text-brand-light/50 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-red-500/30 hover:border-red-500/60"
                          >
                            <FiTrash2 size={16} />
                            {deleting === file._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload PDF file"
          title="Upload PDF file"
        />
          </>
        )}
      </div>
    </div>
  );
}
