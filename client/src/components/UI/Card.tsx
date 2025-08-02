import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  padding = 'md',
  onClick,
  disabled = false
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-200 ease-out';
  
  const variantClasses = {
    default: 'bg-gray-800/80 border border-gray-700/50',
    elevated: 'bg-gray-800/90 shadow-xl shadow-black/20 border border-gray-700/30',
    outlined: 'bg-transparent border-2 border-gray-600/50',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10'
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const interactiveClasses = onClick && !disabled
    ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:border-gray-600/70'
    : '';

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed'
    : '';

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${paddingClasses[padding]}
        ${interactiveClasses}
        ${disabledClasses}
        ${className}
      `}
      onClick={onClick && !disabled ? onClick : undefined}
    >
      {children}
    </div>
  );
};

export default Card;