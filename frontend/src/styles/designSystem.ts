// Design System Unifié pour Affinia - Styles et Utilitaires uniquement
// src/styles/designSystem.ts

export const DesignSystem = {
  // Couleurs principales unifiées
  colors: {
    primary: {
      gradient: 'from-purple-600 via-pink-600 to-orange-600',
      purple: {
        50: 'rgb(250, 245, 255)',
        100: 'rgb(243, 232, 255)',
        200: 'rgb(233, 213, 255)',
        300: 'rgb(216, 180, 254)',
        400: 'rgb(196, 145, 253)',
        500: 'rgb(168, 85, 247)',
        600: 'rgb(147, 51, 234)',
        700: 'rgb(126, 34, 206)',
        800: 'rgb(107, 33, 168)',
        900: 'rgb(88, 28, 135)',
      },
      pink: {
        500: 'rgb(236, 72, 153)',
        600: 'rgb(219, 39, 119)',
      },
      orange: {
        500: 'rgb(249, 115, 22)',
        600: 'rgb(234, 88, 12)',
      }
    },
    secondary: {
      blue: 'from-blue-500 to-cyan-500',
      green: 'from-green-500 to-emerald-500',
      amber: 'from-amber-500 to-yellow-500',
    },
    backgrounds: {
      dark: {
        primary: 'bg-gray-900',
        secondary: 'bg-gray-800/50',
        card: 'bg-gray-800/90',
        overlay: 'bg-gray-800/20',
      },
      light: {
        primary: 'bg-gray-50',
        secondary: 'bg-white/80',
        card: 'bg-white/90',
        overlay: 'bg-white/40',
      }
    }
  },

  // Effets et animations standardisés
  effects: {
    glow: {
      purple: 'shadow-2xl shadow-purple-500/20',
      pink: 'shadow-2xl shadow-pink-500/20',
      blue: 'shadow-2xl shadow-blue-500/20',
    },
    blur: 'backdrop-blur-xl',
    hover: 'hover:scale-105 transition-all duration-300',
    card: 'rounded-2xl border transition-all duration-300',
    glass: 'backdrop-blur-xl bg-white/10 border border-white/20',
  },

  // Typography unifiée
  typography: {
    h1: 'text-4xl lg:text-6xl font-bold tracking-tight',
    h2: 'text-2xl lg:text-3xl font-bold',
    h3: 'text-xl font-semibold',
    body: 'text-base leading-relaxed',
    small: 'text-sm',
    tiny: 'text-xs',
  },

  // Animations standardisées
  animations: {
    fadeIn: 'opacity-0 animate-pulse',
    slideUp: 'transform translate-y-4 opacity-0 transition-all duration-500',
    float: 'animate-bounce',
    glow: 'animate-pulse',
  },

  // Spacing unifié
  spacing: {
    section: 'py-12 px-4',
    card: 'p-6',
    cardLarge: 'p-8',
    container: 'max-w-6xl mx-auto',
  }
};

// Animations CSS unifiées - intégrant votre CSS existant
export const UnifiedAnimations = `
  /* Vos animations existantes intégrées */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.3); }
    50% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.6); }
  }

  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }

  /* Nouvelles animations pour cohérence */
  @keyframes float-up {
    0% { transform: translateY(100vh) scale(0); opacity: 0; }
    10% { transform: translateY(90vh) scale(1); opacity: 0.4; }
    100% { transform: translateY(-10vh) scale(0); opacity: 0; }
  }
  
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }

  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* Classes d'animation unifiées */
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    background-size: 200px 100%;
    animation: shimmer 2s infinite;
  }
  
  .animate-float-up {
    animation: float-up linear infinite;
  }
  
  .animate-glow-pulse {
    animation: glow-pulse 3s ease-in-out infinite;
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 6s ease infinite;
  }

  /* Vos effets glass intégrés */
  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .glass-dark {
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Gradient text unifié */
  .gradient-text {
    background: linear-gradient(135deg, #ec4899, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Card hover effects unifiés */
  .card-hover {
    transition: all 0.3s ease;
  }

  .card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  /* Effet mystique unifié */
  .mystical-glow {
    position: relative;
  }

  .mystical-glow::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(45deg, #8b5cf6, #ec4899, #f59e0b, #8b5cf6);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .mystical-glow:hover::before {
    opacity: 0.5;
    animation: gradient-shift 2s ease infinite;
  }
`;

// Hook pour utiliser le système de design
export const useDesignSystem = (isDarkMode: boolean) => {
  return {
    colors: DesignSystem.colors,
    getCardClasses: (variant: 'default' | 'highlighted' | 'glass' = 'default') => {
      const base = 'rounded-2xl border transition-all duration-300 hover:scale-[1.02]';
      const variants = {
        default: isDarkMode 
          ? 'bg-gray-800/50 border-gray-700/50 backdrop-blur-xl' 
          : 'bg-white/80 border-gray-200/50 backdrop-blur-xl',
        highlighted: isDarkMode
          ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/10 border-purple-500/30 backdrop-blur-xl'
          : 'bg-gradient-to-br from-purple-100/50 to-pink-100/30 border-purple-200/50 backdrop-blur-xl',
        glass: 'backdrop-blur-xl bg-white/10 border border-white/20'
      };
      return `${base} ${variants[variant]}`;
    },
    getTextClasses: (variant: 'primary' | 'secondary' | 'muted' = 'primary') => {
      const variants = {
        primary: isDarkMode ? 'text-white' : 'text-gray-900',
        secondary: isDarkMode ? 'text-gray-300' : 'text-gray-700',
        muted: isDarkMode ? 'text-gray-400' : 'text-gray-600'
      };
      return variants[variant];
    },
    getBgClasses: (variant: 'primary' | 'secondary' | 'card' = 'primary') => {
      const variants = {
        primary: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
        secondary: isDarkMode ? 'bg-gray-800' : 'bg-white',
        card: isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
      };
      return variants[variant];
    }
  };
};