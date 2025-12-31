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
  const inputClasses = `block w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
    error
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-brand-accent/20 focus:ring-brand-accent focus:border-brand-accent'
  } bg-brand-slate text-brand-cream placeholder-brand-cream/60 ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-brand-cream">
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
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;