import React from 'react';
import { Plus, Minus } from 'lucide-react';
import Button from './Button';

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  size = 'md',
  className = '',
  disabled = false
}) => {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onChange(clampedValue);
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  const buttonSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-200 mb-2">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size={buttonSizes[size]}
          icon={Minus}
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="flex-shrink-0"
        />
        
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            flex-1 max-w-20 px-3 text-center
            bg-gray-800/50 border border-gray-600/50 rounded-xl
            text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/70
            hover:border-gray-500/70
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
        />
        
        <Button
          variant="outline"
          size={buttonSizes[size]}
          icon={Plus}
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="flex-shrink-0"
        />
      </div>
    </div>
  );
};

export default NumberInput;