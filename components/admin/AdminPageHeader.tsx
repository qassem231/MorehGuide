import Link from "next/link";
import { FiArrowLeft, FiCloud } from "react-icons/fi";
import BaseButton from "../ui/BaseButton";

interface AdminPageHeaderProps {
  onUploadClick: () => void;
}

export default function AdminPageHeader({
  onUploadClick,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link
          href="/chat"
          className="flex items-center gap-2 text-gray-600 dark:text-brand-light hover:text-brand-accent dark:hover:text-blue-600 font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:bg-gray-200 dark:hover:bg-brand-slate/50 text-sm sm:text-base"
        >
          <FiArrowLeft size={20} />
          Back to Chat
        </Link>
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          Admin File Manager
        </h1>
      </div>
      <BaseButton
        variant="primary"
        size="lg"
        icon={FiCloud}
        onClick={onUploadClick}
        fullWidth={false}
        className="w-full sm:w-auto"
      >
        Upload PDF
      </BaseButton>
    </div>
  );
}
