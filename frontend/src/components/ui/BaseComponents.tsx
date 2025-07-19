// Composants de base réutilisables pour Affinia
// src/components/ui/BaseComponents.tsx

import React from 'react';
import { useDesignSystem } from '../../styles/designSystem';

// Interface pour les props communes
interface BaseProps {
  children: React.ReactNode;
  className?: string;
  isDarkMode: boolean;
}

// Background mystique unifié
interface MysticalBackgroundProps {
  isDarkMode: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export const MysticalBackground: React.FC<MysticalBackgroundProps> = ({ 
  isDarkMode, 
  intensity = 'medium' 
}) => {
  const opacityMap = {
    low: isDarkMode ? 'opacity-10' : 'opacity-20',
    medium: isDarkMode ? 'opacity-20' : 'opacity-30', 
    high: isDarkMode ? 'opacity-40' : 'opacity-50'
  };

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${opacityMap[intensity]}`}>
      {/* Orbes mystiques */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-pink-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-600/20 to-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-orange-600/15 to-yellow-600/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      
      {/* Particules flottantes */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
};

// Carte base standardisée
interface CardProps extends BaseProps {
  variant?: 'default' | 'highlighted' | 'glass';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default', 
  isDarkMode, 
  hover = true,
  onClick 
}) => {
  const designSystem = useDesignSystem(isDarkMode);
  const baseClasses = `${designSystem.getCardClasses(variant)} ${hover ? 'hover:scale-[1.02]' : ''}`;
  
  return (
    <div 
      className={`${baseClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Titre de section unifié
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isDarkMode: boolean;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  subtitle, 
  icon, 
  isDarkMode 
}) => {
  const designSystem = useDesignSystem(isDarkMode);
  
  return (
    <div className="text-center mb-12">
      {icon && (
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-2xl opacity-40 animate-pulse" />
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl">
              {icon}
            </div>
          </div>
        </div>
      )}
      <h1 className={`text-4xl lg:text-6xl font-bold mb-4 tracking-tight ${designSystem.getTextClasses('primary')}`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`text-xl max-w-3xl mx-auto ${designSystem.getTextClasses('secondary')}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

// Bouton unifié
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  disabled = false, 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl shadow-purple-500/20',
    secondary: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-2xl shadow-blue-500/20',
    ghost: 'bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-600/50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-xl font-medium transition-all duration-200 transform hover:scale-105
        disabled:opacity-50 disabled:transform-none
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// Badge unifié
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  isDarkMode: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  isDarkMode,
  className = '' 
}) => {
  const variantClasses = {
    default: isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Export de tous les composants sous un namespace
export const BaseComponents = {
  MysticalBackground,
  Card,
  SectionTitle,
  Button,
  Badge
};