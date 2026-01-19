import { FiSave } from "react-icons/fi";
import BaseButton from "../ui/BaseButton";

interface SaveBarProps {
  hasChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function SaveBar({
  hasChanges,
  onSave,
  onCancel,
}: SaveBarProps) {
  if (!hasChanges) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-brand-dark border-t border-gray-200 dark:border-brand-slate/30 backdrop-blur-lg p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-gray-700 dark:text-brand-light">
          You have unsaved changes
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 dark:text-brand-light hover:text-gray-900 dark:hover:text-brand-accent transition-colors"
          >
            Cancel
          </button>
          <BaseButton variant="primary" icon={FiSave} onClick={onSave}>
            Save Changes
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
