'use client';

import { useRef } from 'react';
import { FiCloud } from 'react-icons/fi';

export default function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
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

      if (response.ok) {
        alert('PDF uploaded successfully!');
      } else {
        alert('Failed to upload PDF');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading PDF');
    }

    // Reset the input
    event.target.value = '';
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
    </>
  );
}