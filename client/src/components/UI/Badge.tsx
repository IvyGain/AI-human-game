import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-full
    transition-all duration-150 ease-out
  `;

  const variantClasses = {
    default: 'bg-gray-700/80 text-gray-200 border border-gray-600/50',
    success: 'bg-green-600/20 text-green-300 border border-green-500/50',
    warning: 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/50',
    danger: 'bg-red-600/20 text-red-300 border border-red-500/50',
    info: 'bg-blue-600/20 text-blue-300 border border-blue-500/50',
    outline: 'bg-transparent text-gray-300 border border-gray-500/50'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs min-h-[1.25rem]',
    md: 'px-3 py-1 text-sm min-h-[1.5rem]',
    lg: 'px-4 py-1.5 text-base min-h-[1.75rem]'
  };

  return (
    <span
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;