/**
 * Responsive Design Utilities
 * 
 * Utilities for handling responsive design and mobile optimization.
 */

import { useEffect, useState } from 'react';

/**
 * Hook to detect screen size
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...screenSize,
    isMobile: screenSize.width < 640,
    isTablet: screenSize.width >= 640 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isLarge: screenSize.width >= 1280,
  };
}

/**
 * Hook to detect device type
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
}

/**
 * Responsive breakpoints
 */
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Get responsive class based on screen size
 */
export function getResponsiveClass(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string {
  const classes = [base];
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  return classes.join(' ');
}

/**
 * Mobile-first responsive grid classes
 */
export const GridClasses = {
  // Single column on mobile, responsive on larger screens
  responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // Two columns on mobile, more on larger screens
  twoUp: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  // Side-by-side layout
  sideBySide: 'grid grid-cols-1 lg:grid-cols-2',
  // Three columns
  threeCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
} as const;

/**
 * Mobile-first responsive spacing
 */
export const SpacingClasses = {
  // Padding
  padding: 'p-3 sm:p-4 md:p-6',
  paddingX: 'px-3 sm:px-4 md:px-6',
  paddingY: 'py-3 sm:py-4 md:py-6',
  // Margin
  margin: 'm-3 sm:m-4 md:m-6',
  marginX: 'mx-3 sm:mx-4 md:mx-6',
  marginY: 'my-3 sm:my-4 md:my-6',
  // Gap
  gap: 'gap-2 sm:gap-4 md:gap-6',
  gapX: 'gap-x-2 sm:gap-x-4 md:gap-x-6',
  gapY: 'gap-y-2 sm:gap-y-4 md:gap-y-6',
} as const;

/**
 * Mobile-first responsive text sizes
 */
export const TextClasses = {
  // Headings
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  h4: 'text-base sm:text-lg md:text-xl lg:text-2xl',
  // Body text
  body: 'text-sm sm:text-base md:text-lg',
  bodySmall: 'text-xs sm:text-sm md:text-base',
  bodyLarge: 'text-base sm:text-lg md:text-xl',
  // Captions
  caption: 'text-xs sm:text-sm',
} as const;

/**
 * Mobile-first responsive layout utilities
 */
export const LayoutClasses = {
  // Flexbox layouts
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  flexColMobile: 'flex flex-col sm:flex-row',
  flexRowMobile: 'flex flex-row sm:flex-col',
  // Grid layouts
  gridCols: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  gridCols2: 'grid grid-cols-1 lg:grid-cols-2',
  // Alignment
  center: 'flex items-center justify-center',
  centerX: 'flex justify-center',
  centerY: 'flex items-center',
  between: 'flex justify-between',
  around: 'flex justify-around',
  // Spacing
  spaceX: 'space-x-2 sm:space-x-4',
  spaceY: 'space-y-2 sm:space-y-4',
} as const;

/**
 * Mobile-first responsive container
 */
export const ContainerClasses = {
  // Standard container
  standard: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  // Narrow container
  narrow: 'max-w-4xl mx-auto px-4 sm:px-6',
  // Wide container
  wide: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8',
  // Full width
  full: 'w-full px-4 sm:px-6',
} as const;

/**
 * Mobile-first responsive visibility
 */
export const VisibilityClasses = {
  // Show on mobile only
  mobileOnly: 'block sm:hidden',
  // Show on tablet and up
  tabletUp: 'hidden sm:block',
  // Show on desktop and up
  desktopUp: 'hidden lg:block',
  // Hide on mobile
  hideMobile: 'hidden sm:block',
  // Hide on tablet
  hideTablet: 'block sm:hidden lg:block',
} as const;

/**
 * Mobile-first responsive navigation
 */
export const NavigationClasses = {
  // Mobile navigation
  mobileNav: 'flex flex-col sm:hidden',
  // Desktop navigation
  desktopNav: 'hidden sm:flex',
  // Responsive navigation
  responsiveNav: 'flex flex-col sm:flex-row',
} as const;

/**
 * Mobile-first responsive forms
 */
export const FormClasses = {
  // Form container
  container: 'space-y-4 sm:space-y-6',
  // Form group
  group: 'space-y-2 sm:space-y-3',
  // Form row (side by side on desktop)
  row: 'flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0 space-y-4',
  // Form input
  input: 'w-full px-3 py-2 text-sm sm:text-base',
  // Form button
  button: 'w-full sm:w-auto px-4 py-2 text-sm sm:text-base',
  // Form button group
  buttonGroup: 'flex flex-col sm:flex-row gap-2 sm:gap-4',
} as const;

/**
 * Mobile-first responsive cards
 */
export const CardClasses = {
  // Standard card
  standard: 'bg-white rounded-lg shadow-sm border p-4 sm:p-6',
  // Card header
  header: 'pb-3 sm:pb-4 border-b border-gray-200',
  // Card body
  body: 'py-3 sm:py-4',
  // Card footer
  footer: 'pt-3 sm:pt-4 border-t border-gray-200',
  // Card grid
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
} as const;

/**
 * Mobile-first responsive tables
 */
export const TableClasses = {
  // Table container
  container: 'overflow-x-auto',
  // Table
  table: 'min-w-full divide-y divide-gray-200',
  // Table header
  header: 'bg-gray-50',
  // Table cell
  cell: 'px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm',
  // Table header cell
  headerCell: 'px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider',
} as const;
