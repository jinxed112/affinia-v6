import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  colorScheme: 'green' | 'red' | 'orange' | 'purple' | 'blue' | 'pink' | 'gray';
  defaultOpen?: boolean;
  animationDelay?: number;
  isDarkMode?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  icon,
  items,
  colorScheme,
  defaultOpen = false,
  animationDelay = 0,
  isDarkMode = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  // Définir les couleurs selon le scheme
  const getColorClasses = () => {
    const schemes = {
      green: {
        bg: isDarkMode ? 'from-green-900/30 to-emerald-900/30' : 'from-green-50 to-emerald-50',
        border: isDarkMode ? 'border-green-500/30' : 'border-green-300',
        icon: isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
        text: isDarkMode ? 'text-green-300' : 'text-green-700',
        hover: isDarkMode ? 'hover:border-green-400 hover:shadow-green-400/20' : 'hover:border-green-400'
      },
      red: {
        bg: isDarkMode ? 'from-red-900/30 to-rose-900/30' : 'from-red-50 to-rose-50',
        border: isDarkMode ? 'border-red-500/30' : 'border-red-300',
        icon: isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600',
        text: isDarkMode ? 'text-red-300' : 'text-red-700',
        hover: isDarkMode ? 'hover:border-red-400 hover:shadow-red-400/20' : 'hover:border-red-400'
      },
      orange: {
        bg: isDarkMode ? 'from-orange-900/30 to-amber-900/30' : 'from-orange-50 to-amber-50',
        border: isDarkMode ? 'border-orange-500/30' : 'border-orange-300',
        icon: isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600',
        text: isDarkMode ? 'text-orange-300' : 'text-orange-700',
        hover: isDarkMode ? 'hover:border-orange-400 hover:shadow-orange-400/20' : 'hover:border-orange-400'
      },
      purple: {
        bg: isDarkMode ? 'from-purple-900/30 to-violet-900/30' : 'from-purple-50 to-violet-50',
        border: isDarkMode ? 'border-purple-500/30' : 'border-purple-300',
        icon: isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600',
        text: isDarkMode ? 'text-purple-300' : 'text-purple-700',
        hover: isDarkMode ? 'hover:border-purple-400 hover:shadow-purple-400/20' : 'hover:border-purple-400'
      },
      blue: {
        bg: isDarkMode ? 'from-blue-900/30 to-cyan-900/30' : 'from-blue-50 to-cyan-50',
        border: isDarkMode ? 'border-blue-500/30' : 'border-blue-300',
        icon: isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
        text: isDarkMode ? 'text-blue-300' : 'text-blue-700',
        hover: isDarkMode ? 'hover:border-blue-400 hover:shadow-blue-400/20' : 'hover:border-blue-400'
      },
      pink: {
        bg: isDarkMode ? 'from-pink-900/30 to-rose-900/30' : 'from-pink-50 to-rose-50',
        border: isDarkMode ? 'border-pink-500/30' : 'border-pink-300',
        icon: isDarkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600',
        text: isDarkMode ? 'text-pink-300' : 'text-pink-700',
        hover: isDarkMode ? 'hover:border-pink-400 hover:shadow-pink-400/20' : 'hover:border-pink-400'
      },
      gray: {
        bg: isDarkMode ? 'from-gray-800/30 to-slate-800/30' : 'from-gray-50 to-slate-50',
        border: isDarkMode ? 'border-gray-500/30' : 'border-gray-300',
        icon: isDarkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600',
        text: isDarkMode ? 'text-gray-300' : 'text-gray-700',
        hover: isDarkMode ? 'hover:border-gray-400 hover:shadow-gray-400/20' : 'hover:border-gray-400'
      }
    };
    
    return schemes[colorScheme];
  };

  const colors = getColorClasses();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`transition-all duration-500 ${
      isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
    }`}>
      <Card className={`
        group transition-all duration-300 cursor-pointer
        bg-gradient-to-br ${colors.bg} border ${colors.border} ${colors.hover}
        ${isOpen ? 'shadow-lg' : 'hover:shadow-md'}
      `}>
        <CardContent className="p-0">
          {/* Header cliquable */}
          <div 
            className="p-4 flex items-center justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon} transition-transform group-hover:scale-110`}>
                {icon}
              </div>
              <div>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {title}
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {items.length} élément{items.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
              <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>

          {/* Contenu dépliable */}
          <div className={`overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className={`px-4 pb-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="mt-3 space-y-2">
                {items.map((item, index) => (
                  <div 
                    key={index}
                    className={`
                      flex items-start space-x-2 p-2 rounded-lg transition-all duration-200
                      ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white/50 hover:bg-white/80'}
                    `}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${colors.text.replace('text-', 'bg-')}`} />
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};