import { FiFileText, FiCheck } from "react-icons/fi";

interface FileStatsCardsProps {
  totalFiles: number;
}

export default function FileStatsCards({ totalFiles }: FileStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white dark:bg-brand-slate/30 backdrop-blur-sm border border-gray-200 dark:border-brand-slate/50 rounded-lg p-6 transition-colors duration-300 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-brand-light/70 text-sm font-semibold uppercase tracking-wide">
              Total Documents
            </p>
            <p className="text-4xl font-bold text-brand-accent mt-2">
              {totalFiles}
            </p>
          </div>
          <FiFileText className="w-12 h-12 text-brand-accent/30" />
        </div>
      </div>

      <div className="bg-white dark:bg-brand-slate/30 backdrop-blur-sm border border-gray-200 dark:border-brand-slate/50 rounded-lg p-6 transition-colors duration-300 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-brand-light/70 text-sm font-semibold uppercase tracking-wide">
              System Status
            </p>
            <div className="flex items-center gap-2 mt-2">
              <FiCheck className="w-5 h-5 text-green-500 dark:text-green-400" />
              <p className="text-2xl font-bold text-green-500 dark:text-green-400">
                Active
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
