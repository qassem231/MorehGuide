import { FiFileText } from "react-icons/fi";
import FileTableRow from "./FileTableRow";

interface PdfFile {
  _id: string;
  name?: string;
  fileName?: string;
  audience?: "student" | "lecturer" | "everyone";
  uploadDate?: string;
  createdAt?: string;
}

interface FilesTableProps {
  files: PdfFile[];
  isLoading: boolean;
  editingId: string | null;
  editingAudience: "student" | "lecturer" | "everyone" | null;
  deletingId: string | null;
  onEditStart: (
    fileId: string,
    audience: "student" | "lecturer" | "everyone",
  ) => void;
  onEditCancel: () => void;
  onEditSave: (
    fileId: string,
    audience: "student" | "lecturer" | "everyone",
  ) => void;
  onEditChange: (audience: "student" | "lecturer" | "everyone") => void;
  onDelete: (fileId: string) => void;
}

export default function FilesTable({
  files,
  isLoading,
  editingId,
  editingAudience,
  deletingId,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditChange,
  onDelete,
}: FilesTableProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-brand-slate/20 backdrop-blur-sm border border-gray-200 dark:border-brand-slate/50 rounded-lg overflow-hidden shadow-lg transition-colors duration-300">
        <div className="p-8 text-center text-gray-500 dark:text-brand-light/70">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-brand-accent/30 border-t-brand-accent rounded-full"></div>
          <p className="mt-4">Loading files...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-brand-slate/20 backdrop-blur-sm border border-gray-200 dark:border-brand-slate/50 rounded-lg overflow-hidden shadow-lg transition-colors duration-300">
        <div className="p-8 text-center text-gray-400 dark:text-brand-light/50">
          <FiFileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No files found</p>
          <p className="text-sm mt-2">Upload your first PDF to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-brand-slate/20 backdrop-blur-sm border border-gray-200 dark:border-brand-slate/50 rounded-lg overflow-hidden shadow-lg transition-colors duration-300">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-brand-slate/50 border-b border-gray-200 dark:border-brand-slate/30 transition-colors duration-300">
            <tr>
              <th className="text-left py-4 px-3 sm:px-6 text-gray-700 dark:text-brand-light font-semibold text-xs sm:text-sm">
                File Name
              </th>
              <th className="text-left py-4 px-3 sm:px-6 text-gray-700 dark:text-brand-light font-semibold text-xs sm:text-sm">
                Audience
              </th>
              <th className="text-left py-4 px-3 sm:px-6 text-gray-700 dark:text-brand-light font-semibold text-xs sm:text-sm">
                Uploaded
              </th>
              <th className="text-right py-4 px-3 sm:px-6 text-gray-700 dark:text-brand-light font-semibold text-xs sm:text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-brand-slate/30 transition-colors duration-300">
            {files.map((file) => (
              <FileTableRow
                key={file._id}
                file={file}
                isEditing={editingId === file._id}
                editingAudience={editingAudience}
                isDeleting={deletingId === file._id}
                onEditStart={() =>
                  onEditStart(file._id, file.audience || "everyone")
                }
                onEditCancel={onEditCancel}
                onEditSave={(audience) => onEditSave(file._id, audience)}
                onEditChange={onEditChange}
                onDelete={() => onDelete(file._id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
