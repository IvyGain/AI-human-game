import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-semibold rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    active:scale-95 disabled:active:scale-100
    touch-manipulation select-none
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-purple-600 text-white
      hover:from-blue-700 hover:to-purple-700
      focus:ring-blue-500
      shadow-lg shadow-blue-500/25
      disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none
    `,
    secondary: `
      bg-gradient-to-r from-gray-700 to-gray-800 text-white
      hover:from-gray-600 hover:to-gray-700
      focus:ring-gray-500
      shadow-lg shadow-gray-500/25
      disabled:from-gray-800 disabled:to-gray-800 disabled:shadow-none
    `,
    outline: `
      bg-transparent border-2 border-gray-600 text-gray-300
      hover:bg-gray-700/50 hover:border-gray-500 hover:text-white
      focus:ring-gray-500
      disabled:border-gray-800 disabled:text-gray-600
    `,
    ghost: `
      bg-transparent text-gray-300
      hover:bg-gray-700/50 hover:text-white
      focus:ring-gray-500
      disabled:text-gray-600
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 text-white
      hover:from-red-700 hover:to-red-800
      focus:ring-red-500
      shadow-lg shadow-red-500/25
      disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[2.25rem] gap-2',
    md: 'px-4 py-3 text-base min-h-[2.75rem] gap-2',
    lg: 'px-6 py-4 text-lg min-h-[3.25rem] gap-3',
    xl: 'px-8 py-5 text-xl min-h-[3.75rem] gap-3'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
    xl: 22
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClasses = (disabled || loading) 
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
  );

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${disabledClasses}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <LoadingSpinner />}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={iconSizes[size]} />
      )}
      
      {!loading && children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={iconSizes[size]} />
      )}
    </button>
  );
};

export default Button;