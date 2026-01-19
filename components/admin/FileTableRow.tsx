"use client";

import { FiFileText, FiTrash2, FiEdit2 } from "react-icons/fi";
import AudienceBadge from "./AudienceBadge";
import AudienceEditor from "./AudienceEditor";
import BaseButton from "../ui/BaseButton";

interface PdfFile {
  _id: string;
  name?: string;
  fileName?: string;
  audience?: "student" | "lecturer" | "everyone";
  uploadDate?: string;
  createdAt?: string;
}

interface FileTableRowProps {
  file: PdfFile;
  isEditing: boolean;
  editingAudience: "student" | "lecturer" | "everyone" | null;
  isDeleting: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: (audience: "student" | "lecturer" | "everyone") => void;
  onEditChange: (audience: "student" | "lecturer" | "everyone") => void;
  onDelete: () => void;
}

export default function FileTableRow({
  file,
  isEditing,
  editingAudience,
  isDeleting,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditChange,
  onDelete,
}: FileTableRowProps) {
  const audience = file.audience || "everyone";
  const uploadDate = file.uploadDate || file.createdAt;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-brand-slate/20 transition-colors duration-200">
      <td className="py-4 px-3 sm:px-6">
        <div className="flex items-center gap-3">
          <FiFileText className="w-5 h-5 text-brand-accent shrink-0" />
          <span className="text-gray-900 dark:text-brand-cream font-medium text-xs sm:text-sm truncate">
            {file.name || file.fileName || "Unnamed"}
          </span>
        </div>
      </td>
      <td className="py-4 px-3 sm:px-6">
        {isEditing ? (
          <AudienceEditor
            currentAudience={audience}
            value={editingAudience || audience}
            onChange={onEditChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        ) : (
          <div className="flex items-center gap-2">
            <AudienceBadge audience={audience} />
            <button
              onClick={onEditStart}
              className="p-1 text-gray-400 dark:text-brand-light/60 hover:text-brand-accent dark:hover:text-brand-accent transition-colors"
              aria-label="Edit audience"
            >
              <FiEdit2 size={16} />
            </button>
          </div>
        )}
      </td>
      <td className="py-4 px-3 sm:px-6 text-gray-600 dark:text-brand-light/70 text-xs sm:text-sm">
        {uploadDate ? new Date(uploadDate).toLocaleDateString() : "N/A"}
      </td>
      <td className="py-4 px-3 sm:px-6 text-right">
        <BaseButton
          variant="danger"
          size="sm"
          icon={FiTrash2}
          onClick={onDelete}
          disabled={isDeleting}
          className="ml-auto"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </BaseButton>
      </td>
    </tr>
  );
}
