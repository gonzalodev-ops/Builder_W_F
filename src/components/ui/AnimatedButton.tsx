'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'purple';
  className?: string;
}

export default function AnimatedButton({
  isLoading = false,
  loadingText = 'Cargando...',
  children,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps) {
  
  const baseStyles = "px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    purple: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed bg-gray-400 text-white border-transparent hover:bg-gray-400";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
      className={`
        ${baseStyles}
        ${disabled || isLoading ? disabledStyles : variants[variant]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </motion.svg>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}

