'use client';

import { forwardRef } from 'react';

/**
 * Reusable Input component with validation states
 * Supports labels, error messages, and custom styling
 * Used in forms throughout the application
 */
interface InputProps {
  label?: string;
  error?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
}

/**
 * Input component
 * @param label - Display label above input
 * @param error - Error message to show (changes styling to red)
 * @param type - HTML input type (default: 'text')
 * @param placeholder - Placeholder text
 * @param value - Current input value
 * @param onChange - Fired when input changes
 * @param onKeyPress - Fired when key pressed (useful for Enter handling)
 * @param required - Mark as required
 * @param disabled - Disable the input
 * @param className - Additional Tailwind classes
 * @param id - HTML id attribute
 * @param name - HTML name attribute
 * @param autoComplete - HTML autocomplete attribute
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyPress,
  required = false,
  disabled = false,
  className = '',
  id,
  name,
  autoComplete,
}, ref) => {
  const inputClasses = `block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
    error
      ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500 bg-red-500/5'
      : 'border-brand-slate/50 focus:ring-brand-accent focus:border-brand-accent bg-brand-slate/50 hover:bg-brand-slate/70'
  } text-brand-cream placeholder-brand-light/60 ${className}`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-brand-cream">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={inputClasses}
      />
      {error && (
        <p className="text-sm text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;