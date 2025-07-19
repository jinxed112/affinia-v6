import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Star, X, Gem } from 'lucide-react';
import { BaseComponents } from '../ui/BaseComponents';
import { useDesignSystem } from '../../styles/designSystem';

interface QuestNotificationProps {
  result: {
    success: boolean;
    xp_gained: number;
    credits_gained: number;
    level_up: boolean;
    new_level?: number;
  } | null;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const QuestNotification: React.FC<QuestNotificationProps> = ({ 
  result, 
  onClose, 
  isDarkMode = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const designSystem = useDesignSystem(isDarkMode);

  useEffect(() => {
    if (result?.success) {
      setIsVisible(true);
      // Auto-fermer après 5 secondes
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Attendre l'animation de sortie
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [result, onClose]);

  if (!result?.success || !isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <BaseComponents.Card
        isDarkMode={isDarkMode}
        variant="highlighted"
        className="p-6 max-w-sm mystical-glow animate-shimmer border-2 border-green-500/30"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full 
              flex items-center justify-center animate-bounce shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                🎉 Quête complétée !
              </h4>
              <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                Félicitations !
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className={`p-1 rounded-full hover:bg-gray-700 transition-colors ${
              designSystem.getTextClasses('muted')
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Récompenses */}
          <div className="flex items-center space-x-4">
            {result.xp_gained > 0 && (
              <BaseComponents.Badge variant="warning" isDarkMode={isDarkMode}>
                <Zap className="w-3 h-3 mr-1" />
                +{result.xp_gained} XP
              </BaseComponents.Badge>
            )}
            
            {result.credits_gained > 0 && (
              <BaseComponents.Badge variant="default" isDarkMode={isDarkMode}>
                <Gem className="w-3 h-3 mr-1" />
                +{result.credits_gained} crédits
              </BaseComponents.Badge>
            )}
          </div>

          {/* Level up */}
          {result.level_up && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-yellow-500/30">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400 animate-spin" />
                <span className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                  🎊 NIVEAU {result.new_level} !
                </span>
              </div>
              <p className={`text-sm mt-1 ${designSystem.getTextClasses('muted')}`}>
                Vous avez atteint un nouveau niveau !
              </p>
            </div>
          )}
        </div>
      </BaseComponents.Card>
    </div>
  );
};