interface MessageAlertProps {
  message: string;
  type: "success" | "error";
}

export default function MessageAlert({ message, type }: MessageAlertProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-6 p-4 rounded-lg ${
        type === "success"
          ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:border-green-500/50 dark:text-green-400"
          : "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-400"
      }`}
    >
      {message}
    </div>
  );
}
