"use client";

import { FiCheck, FiX } from "react-icons/fi";

interface AudienceEditorProps {
  currentAudience: "student" | "lecturer" | "everyone";
  onSave: (audience: "student" | "lecturer" | "everyone") => void;
  onCancel: () => void;
  value: "student" | "lecturer" | "everyone";
  onChange: (audience: "student" | "lecturer" | "everyone") => void;
}

export default function AudienceEditor({
  currentAudience,
  onSave,
  onCancel,
  value,
  onChange,
}: AudienceEditorProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as any)}
        className="bg-white dark:bg-brand-dark/50 border border-gray-300 dark:border-brand-slate/50 rounded px-2 py-1 text-sm text-gray-900 dark:text-brand-cream focus:outline-none focus:border-brand-accent transition-colors duration-300"
        aria-label="Select audience"
      >
        <option value="student">👨‍🎓 Students</option>
        <option value="lecturer">👨‍🏫 Lecturers</option>
        <option value="everyone">🌍 Everyone</option>
      </select>
      <button
        onClick={() => onSave(value)}
        className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1"
        aria-label="Save"
      >
        <FiCheck size={18} />
      </button>
      <button
        onClick={onCancel}
        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
        aria-label="Cancel"
      >
        <FiX size={18} />
      </button>
    </div>
  );
}
