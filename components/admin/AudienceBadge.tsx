interface AudienceBadgeProps {
  audience: "student" | "lecturer" | "everyone";
}

export default function AudienceBadge({ audience }: AudienceBadgeProps) {
  const getBadgeStyles = () => {
    switch (audience) {
      case "student":
        return {
          label: "👨‍🎓 Students",
          classes:
            "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400",
        };
      case "lecturer":
        return {
          label: "👨‍🏫 Lecturers",
          classes:
            "bg-sky-100 dark:bg-sky-500/20 border-sky-200 dark:border-sky-500/50 text-sky-700 dark:text-sky-400",
        };
      default:
        return {
          label: "🌍 Everyone",
          classes:
            "bg-slate-100 dark:bg-slate-500/20 border-slate-200 dark:border-slate-500/50 text-slate-700 dark:text-slate-400",
        };
    }
  };

  const { label, classes } = getBadgeStyles();

  return (
    <div
      className={`px-3 py-1 rounded-lg border text-xs font-semibold ${classes}`}
    >
      {label}
    </div>
  );
}
