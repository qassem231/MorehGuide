'use client';

import { forwardRef } from 'react';

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
  const inputClasses = `block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 
    ${
      error
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900 placeholder-red-300 dark:bg-red-500/5 dark:text-red-100 dark:border-red-500/50'
        : `
          border-gray-300 bg-white text-gray-900 placeholder-gray-400 hover:bg-gray-50 focus:ring-brand-accent focus:border-brand-accent focus:ring-offset-white
          dark:border-brand-slate/50 dark:bg-brand-slate/50 dark:text-brand-cream dark:placeholder-brand-light/60 dark:hover:bg-brand-slate/70 dark:focus:ring-offset-brand-dark
          `
    } 
    ${className}`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-brand-cream">
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
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;