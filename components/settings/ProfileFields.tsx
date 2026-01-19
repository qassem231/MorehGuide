interface ProfileFieldsProps {
  formData: { name: string; email: string };
  onInputChange: (field: string, value: string) => void;
}

export default function ProfileFields({
  formData,
  onInputChange,
}: ProfileFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-brand-slate/20 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
        <label
          htmlFor="full-name"
          className="block text-sm text-gray-700 dark:text-brand-light/70 mb-2 font-semibold"
        >
          Full Name
        </label>
        <input
          id="full-name"
          type="text"
          title="Enter your full name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => onInputChange("name", e.target.value)}
          className="w-full bg-white dark:bg-brand-dark/50 border border-gray-300 dark:border-brand-slate/50 rounded-lg px-4 py-3 text-gray-900 dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
}
