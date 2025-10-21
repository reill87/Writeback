'use client';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color scheme */
  variant?: 'primary' | 'secondary' | 'white';
  /** Loading text */
  text?: string;
  /** Show text below spinner */
  showText?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Center the spinner in container */
  centered?: boolean;
}

/**
 * LoadingSpinner Component
 * 
 * Displays an animated loading spinner with optional text.
 * 
 * Features:
 * - Multiple sizes (sm, md, lg, xl)
 * - Color variants (primary, secondary, white)
 * - Optional loading text
 * - Centered layout option
 * - Accessible with proper ARIA labels
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  text = 'Loading...',
  showText = false,
  className = '',
  centered = false,
}: LoadingSpinnerProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };
  
  // Color classes
  const colorClasses = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    white: 'border-white',
  };
  
  // Text size classes
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  const spinner = (
    <div
      className={`
        animate-spin rounded-full border-2 border-t-transparent
        ${sizeClasses[size]}
        ${colorClasses[variant]}
        ${className}
      `}
      role="status"
      aria-label={text}
    />
  );
  
  const content = (
    <div className={`flex items-center gap-3 ${showText && size === 'sm' ? 'flex-row' : 'flex-col'}`}>
      {spinner}
      {showText && (
        <span className={`text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );
  
  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-32">
        {content}
      </div>
    );
  }
  
  return content;
}

/**
 * Inline loading spinner for buttons
 */
export function InlineSpinner({ 
  className = '' 
}: { 
  className?: string 
}) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent border-current w-4 h-4 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Page loading component
 */
export function PageLoading({ 
  text = 'Loading page...' 
}: { 
  text?: string 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner
        size="lg"
        text={text}
        showText
        centered
      />
    </div>
  );
}

/**
 * Section loading component
 */
export function SectionLoading({ 
  text = 'Loading...',
  height = 'h-32'
}: { 
  text?: string;
  height?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${height} bg-gray-50 rounded-lg`}>
      <LoadingSpinner
        size="md"
        text={text}
        showText
      />
    </div>
  );
}

/**
 * Card loading skeleton
 */
export function CardSkeleton({ 
  className = '' 
}: { 
  className?: string 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  );
}

/**
 * Text loading skeleton
 */
export function TextSkeleton({ 
  lines = 3,
  className = '' 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Button with loading state
 */
interface LoadingButtonProps {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function LoadingButton({
  loading = false,
  disabled = false,
  children,
  onClick,
  className = '',
  type = 'button',
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center
        px-4 py-2 text-sm font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${loading ? 'cursor-wait' : ''}
        ${className}
      `}
    >
      {loading && (
        <InlineSpinner className="mr-2" />
      )}
      {children}
    </button>
  );
}