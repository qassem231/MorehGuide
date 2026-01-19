import { FiUser, FiLock, FiSliders } from "react-icons/fi";

type Tab = "profile" | "security" | "preferences";

interface SettingsSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiLock },
    { id: "preferences", label: "Preferences", icon: FiSliders },
  ];

  return (
    <div className="lg:col-span-1">
      <div className="bg-white dark:bg-brand-slate/20 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-2 shadow-sm dark:shadow-none transition-colors duration-300">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id as Tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === id
                ? "bg-gradient-brand text-white border-l-4 border-brand-accent shadow-md"
                : "text-gray-600 dark:text-brand-light hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <Icon size={18} />
            <span className="font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
