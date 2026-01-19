interface SecurityTabProps {
  formData: { name: string; email: string };
  onInputChange: (field: string, value: string) => void;
}

export default function SecurityTab({
  formData,
  onInputChange,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      {/* Email Section */}
      <div className="bg-white dark:bg-brand-slate/20 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none transition-colors duration-300">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-brand-cream mb-6">
          Email Address
        </h3>
        <div className="bg-gray-50 dark:bg-brand-slate/30 border border-gray-200 dark:border-brand-slate/50 rounded-xl p-6">
          <label
            htmlFor="email-address"
            className="block text-sm text-gray-700 dark:text-brand-light/70 mb-2 font-semibold"
          >
            Email Address
          </label>
          <input
            id="email-address"
            type="email"
            title="Enter your email address"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            className="w-full bg-white dark:bg-brand-dark/50 border border-gray-300 dark:border-brand-slate/50 rounded-lg px-4 py-3 text-gray-900 dark:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 dark:text-brand-light/50 mt-2">
            Your email is used for account recovery and notifications
          </p>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-white dark:bg-brand-slate/20 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none transition-colors duration-300">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-brand-cream mb-6">
          Security Settings
        </h3>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-brand-slate/30 border border-gray-200 dark:border-brand-slate/50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-brand-cream mb-2">
              Password Management
            </h4>
            <p className="text-gray-600 dark:text-brand-light/70 mb-4">
              Change your password regularly to keep your account secure.
            </p>
            <button className="bg-blue-100 hover:bg-blue-200 text-blue-600 border border-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400 dark:border-blue-500/30 px-4 py-2 rounded-lg transition-all">
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
