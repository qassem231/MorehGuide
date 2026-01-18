'use client';

import { useRef, useState } from 'react';
import { FiCloud, FiX } from 'react-icons/fi';

export default function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<'student' | 'lecturer' | 'everyone' | null>(null);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setSelectedFile(file);
    setShowAudienceModal(true);
    event.target.value = '';
  };

  const handleAudienceSelect = async (audience: 'student' | 'lecturer' | 'everyone') => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('audience', audience);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('PDF uploaded successfully!');
        setSelectedFile(null);
        setSelectedAudience(null);
        setShowAudienceModal(false);
        // Trigger refresh event for admin files page
        window.dispatchEvent(new Event('filesUpdated'));
      } else {
        const error = await response.json();
        alert(`Failed to upload PDF: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading PDF');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="flex items-center gap-2 bg-brand-accent hover:bg-brand-slate text-brand-dark font-bold py-2 px-4 rounded-xl w-full justify-center transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <FiCloud size={20} />
        Upload PDF
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload PDF file"
        title="Upload PDF file"
      />

      {/* Audience Selection Modal */}
      {showAudienceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-dark border border-brand-slate/30 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-cream">Who is this document for?</h3>
              <button
                onClick={() => {
                  setShowAudienceModal(false);
                  setSelectedFile(null);
                }}
                className="text-brand-light/60 hover:text-brand-light"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleAudienceSelect('student')}
                disabled={isUploading}
                className="w-full p-3 text-left bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-400 font-semibold transition-all disabled:opacity-50"
              >
                👨‍🎓 Students
              </button>

              <button
                onClick={() => handleAudienceSelect('lecturer')}
                disabled={isUploading}
                className="w-full p-3 text-left bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 rounded-lg text-sky-400 font-semibold transition-all disabled:opacity-50"
              >
                👨‍🏫 Lecturers
              </button>

              <button
                onClick={() => handleAudienceSelect('everyone')}
                disabled={isUploading}
                className="w-full p-3 text-left bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/50 rounded-lg text-slate-400 font-semibold transition-all disabled:opacity-50"
              >
                🌍 Everyone
              </button>
            </div>

            {isUploading && (
              <div className="mt-4 text-center text-brand-light/70 text-sm">
                Uploading...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}