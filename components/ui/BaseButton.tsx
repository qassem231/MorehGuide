import { ButtonHTMLAttributes, ReactNode } from "react";
import { IconType } from "react-icons";

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: IconType;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export default function BaseButton({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  isLoading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: BaseButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-gradient-brand hover:shadow-brand text-white shadow-md",
    secondary:
      "bg-gray-200 hover:bg-gray-300 dark:bg-brand-slate/50 dark:hover:bg-brand-slate/70 text-gray-900 dark:text-brand-cream",
    danger:
      "bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30",
    success:
      "bg-green-100 hover:bg-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30",
    outline:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-brand-slate/50 text-gray-900 dark:text-brand-cream border border-gray-300 dark:border-brand-slate/50",
    ghost:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-brand-slate/50 text-gray-900 dark:text-brand-cream",
  };

  const sizeClasses = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2 px-4 text-base",
    lg: "py-3 px-6 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          Loading...
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={20} />}
          {children}
          {Icon && iconPosition === "right" && <Icon size={20} />}
        </>
      )}
    </button>
  );
}
