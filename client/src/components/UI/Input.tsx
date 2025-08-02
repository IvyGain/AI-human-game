import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const baseInputClasses = `
    w-full transition-all duration-200 ease-out
    placeholder-gray-400 text-white
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    rounded-xl
  `;

  const variantClasses = {
    default: `
      bg-gray-800/50 border border-gray-600/50
      hover:border-gray-500/70 focus:border-blue-500/70 focus:ring-blue-500/30
    `,
    filled: `
      bg-gray-700/70 border border-transparent
      hover:bg-gray-700/90 focus:bg-gray-700 focus:ring-blue-500/30
    `,
    outlined: `
      bg-transparent border-2 border-gray-600/50
      hover:border-gray-500/70 focus:border-blue-500 focus:ring-blue-500/30
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[2.25rem]',
    md: 'px-4 py-3 text-base min-h-[2.75rem]',
    lg: 'px-5 py-4 text-lg min-h-[3.25rem]'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  const iconPadding = {
    sm: Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
    md: Icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : '',
    lg: Icon ? (iconPosition === 'left' ? 'pl-14' : 'pr-14') : ''
  };

  const errorClasses = error 
    ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30'
    : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-200 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          className={`
            ${baseInputClasses}
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${iconPadding[size]}
            ${errorClasses}
            ${className}
          `}
          {...props}
        />
        
        {Icon && (
          <div className={`
            absolute top-1/2 transform -translate-y-1/2 text-gray-400
            ${iconPosition === 'left' ? 'left-3' : 'right-3'}
          `}>
            <Icon size={iconSizes[size]} />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-2">
          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              {error}
            </p>
          )}
          {!error && helperText && (
            <p className="text-sm text-gray-400">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;