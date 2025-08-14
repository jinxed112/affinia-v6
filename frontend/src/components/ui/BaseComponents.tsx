// src/components/ui/BaseComponents.tsx - VERSION CORRIGÉE SANS CONFLITS
import React, { memo, useMemo, useCallback } from 'react';
import { useDesignSystem } from '../../styles/designSystem';

// Interface pour les props communes
interface BaseProps {
  children: React.ReactNode;
  className?: string;
  isDarkMode: boolean;
}

// 🚀 Hook de détection mobile memoized
const useMobileDetection = () => {
  return useMemo(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
    const isSlowDevice = 'connection' in navigator ? 
      (navigator as any).connection?.effectiveType === 'slow-2g' || 
      (navigator as any).connection?.effectiveType === '2g' 
      : false;
    
    return { isMobile, isSlowDevice };
  }, []);
};

// Background mystique ULTRA-OPTIMISÉ
interface MysticalBackgroundProps {
  isDarkMode: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export const MysticalBackground: React.FC<MysticalBackgroundProps> = memo(({
  isDarkMode,
  intensity = 'medium'
}) => {
  const { isMobile, isSlowDevice } = useMobileDetection();

  const particleCount = useMemo(() => {
    if (isSlowDevice) return 3;
    if (isMobile) return 8;
    return 20;
  }, [isMobile, isSlowDevice]);

  const classes = useMemo(() => {
    const opacityMap = {
      low: isDarkMode ? 'opacity-5' : 'opacity-10',
      medium: isDarkMode ? (isMobile ? 'opacity-10' : 'opacity-20') : (isMobile ? 'opacity-15' : 'opacity-30'),
      high: isDarkMode ? (isMobile ? 'opacity-20' : 'opacity-40') : (isMobile ? 'opacity-25' : 'opacity-50')
    };

    return {
      container: `fixed inset-0 overflow-hidden pointer-events-none ${opacityMap[intensity]}`,
      orb1: `absolute top-1/4 -left-1/4 ${isMobile ? 'w-48 h-48' : 'w-96 h-96'} bg-gradient-to-r from-purple-600/30 to-pink-600/20 rounded-full ${isMobile ? 'blur-2xl' : 'blur-3xl'} ${isSlowDevice ? '' : 'animate-pulse'}`,
      orb2: `absolute bottom-1/4 -right-1/4 ${isMobile ? 'w-48 h-48' : 'w-96 h-96'} bg-gradient-to-r from-cyan-600/20 to-blue-600/30 rounded-full ${isMobile ? 'blur-2xl' : 'blur-3xl'} ${isSlowDevice ? '' : 'animate-pulse'}`,
      orb3: `absolute top-3/4 left-1/2 ${isMobile ? 'w-32 h-32' : 'w-64 h-64'} bg-gradient-to-r from-orange-600/15 to-yellow-600/25 rounded-full ${isMobile ? 'blur-xl' : 'blur-3xl'} ${isSlowDevice ? '' : 'animate-pulse'}`,
    };
  }, [isDarkMode, intensity, isMobile, isSlowDevice]);

  const particles = useMemo(() => {
    if (isSlowDevice) return [];
    
    return [...Array(particleCount)].map((_, i) => (
      <div
        key={i}
        className={`absolute w-1 h-1 bg-purple-400 rounded-full opacity-60 ${isMobile ? 'animate-pulse' : 'animate-float'}`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: isMobile ? `${8 + Math.random() * 4}s` : `${15 + Math.random() * 10}s`
        }}
      />
    ));
  }, [particleCount, isMobile, isSlowDevice]);

  return (
    <div className={classes.container}>
      <div className={classes.orb1} />
      <div 
        className={classes.orb2} 
        style={{ animationDelay: isSlowDevice ? '0s' : '2s' }} 
      />
      <div 
        className={classes.orb3} 
        style={{ animationDelay: isSlowDevice ? '0s' : '4s' }} 
      />
      {particles}
    </div>
  );
});

MysticalBackground.displayName = 'MysticalBackground';

// Carte base ULTRA-OPTIMISÉE
interface CardProps extends BaseProps {
  variant?: 'default' | 'highlighted' | 'glass';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = memo(({
  children,
  className = '',
  variant = 'default',
  isDarkMode,
  hover = true,
  onClick
}) => {
  const designSystem = useDesignSystem(isDarkMode);
  const { isMobile, isSlowDevice } = useMobileDetection();

  const cardClasses = useMemo(() => {
    const baseClasses = designSystem.getCardClasses(variant);
    const hoverClasses = hover && !isSlowDevice ? (isMobile ? 'hover:scale-[1.01]' : 'hover:scale-[1.02]') : '';
    const transitionClasses = isSlowDevice ? 'transition-none' : 'transition-all duration-300';
    
    return `${baseClasses} ${hoverClasses} ${transitionClasses} ${className}`;
  }, [designSystem, variant, hover, className, isMobile, isSlowDevice]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Titre de section MEMOIZED
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isDarkMode: boolean;
}

export const SectionTitle: React.FC<SectionTitleProps> = memo(({
  title,
  subtitle,
  icon,
  isDarkMode
}) => {
  const designSystem = useDesignSystem(isDarkMode);
  const { isMobile, isSlowDevice } = useMobileDetection();

  const classes = useMemo(() => ({
    container: 'text-center mb-8 sm:mb-12',
    iconWrapper: 'flex justify-center mb-4 sm:mb-6',
    iconBackground: `absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl ${isSlowDevice ? '' : 'blur-xl sm:blur-2xl opacity-40 animate-pulse'}`,
    iconContainer: 'relative bg-gradient-to-r from-purple-600 to-pink-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl',
    title: `text-2xl sm:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4 tracking-tight ${designSystem.getTextClasses('primary')}`,
    subtitle: `text-base sm:text-xl max-w-3xl mx-auto ${designSystem.getTextClasses('secondary')}`
  }), [designSystem, isSlowDevice]);

  return (
    <div className={classes.container}>
      {icon && (
        <div className={classes.iconWrapper}>
          <div className="relative">
            <div className={classes.iconBackground} />
            <div className={classes.iconContainer}>
              {icon}
            </div>
          </div>
        </div>
      )}
      <h1 className={classes.title}>
        {title}
      </h1>
      {subtitle && (
        <p className={classes.subtitle}>
          {subtitle}
        </p>
      )}
    </div>
  );
});

SectionTitle.displayName = 'SectionTitle';

// Bouton ULTRA-OPTIMISÉ mobile
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = memo(({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  className = '',
  fullWidth = false
}) => {
  const { isMobile, isSlowDevice } = useMobileDetection();

  const buttonClasses = useMemo(() => {
    const sizeClasses = {
      small: isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm',
      medium: isMobile ? 'px-4 py-2.5 text-base' : 'px-6 py-3 text-base',
      large: isMobile ? 'px-6 py-3 text-lg' : 'px-8 py-4 text-lg'
    };

    const variantClasses = {
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg sm:shadow-2xl shadow-purple-500/20',
      secondary: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg sm:shadow-2xl shadow-blue-500/20',
      ghost: 'bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-600/50'
    };

    const baseClasses = `
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      rounded-lg sm:rounded-xl font-medium
      ${isSlowDevice ? 'transition-none' : 'transition-all duration-200'}
      ${!isSlowDevice && !disabled ? (isMobile ? 'active:scale-95' : 'transform hover:scale-105') : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${fullWidth ? 'w-full' : ''}
      focus:outline-none focus:ring-2 focus:ring-purple-500/50
    `;

    return `${baseClasses} ${className}`.trim();
  }, [size, variant, className, isMobile, isSlowDevice, disabled, fullWidth]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  }, [onClick, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick, disabled]);

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      type="button"
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// Badge MEMOIZED
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isDarkMode: boolean;
  className?: string;
  size?: 'small' | 'medium';
}

export const Badge: React.FC<BadgeProps> = memo(({
  children,
  variant = 'default',
  isDarkMode,
  className = '',
  size = 'medium'
}) => {
  const badgeClasses = useMemo(() => {
    const variantClasses = {
      default: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700',
      success: 'bg-green-500/20 text-green-400 border border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      error: 'bg-red-500/20 text-red-400 border border-red-500/30',
      info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    };

    const sizeClasses = {
      small: 'px-2 py-0.5 text-xs',
      medium: 'px-3 py-1 text-xs sm:text-sm'
    };

    return `inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  }, [variant, isDarkMode, className, size]);

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

// Spinner pour loading states
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'purple' | 'blue' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = memo(({
  size = 'medium',
  color = 'purple',
  className = ''
}) => {
  const { isSlowDevice } = useMobileDetection();

  const classes = useMemo(() => {
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-6 h-6',
      large: 'w-8 h-8'
    };

    const colorClasses = {
      purple: 'border-purple-500/30 border-t-purple-500',
      blue: 'border-blue-500/30 border-t-blue-500',
      white: 'border-white/30 border-t-white'
    };

    const animationClass = isSlowDevice ? '' : 'animate-spin';

    return `border-2 rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${animationClass} ${className}`;
  }, [size, color, className, isSlowDevice]);

  return <div className={classes} />;
});

Spinner.displayName = 'Spinner';

// Divider responsive
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  isDarkMode: boolean;
}

export const Divider: React.FC<DividerProps> = memo(({
  orientation = 'horizontal',
  className = '',
  isDarkMode
}) => {
  const classes = useMemo(() => {
    const baseClasses = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
    const orientationClasses = orientation === 'horizontal' 
      ? 'w-full h-px' 
      : 'h-full w-px';
    
    return `${baseClasses} ${orientationClasses} ${className}`;
  }, [orientation, className, isDarkMode]);

  return <div className={classes} />;
});

Divider.displayName = 'Divider';

// Export de tous les composants sous un namespace
export const BaseComponents = {
  MysticalBackground,
  Card,
  SectionTitle,
  Button,
  Badge,
  Spinner,
  Divider
} as const;

// Types pour améliorer l'IntelliSense
export type BaseComponentsType = typeof BaseComponents;