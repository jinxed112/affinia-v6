// OnboardingGuard.tsx - Avec route Pokédex autorisée
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useDesignSystem } from '../styles/designSystem';
import { BaseComponents } from './ui/BaseComponents';
import { Shield, Target, Brain, ArrowRight } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
  isDarkMode: boolean;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children, isDarkMode }) => {
  const location = useLocation();
  const { questionnaire, loading } = useProfile();
  const designSystem = useDesignSystem(isDarkMode);

  // Routes autorisées APRÈS avoir complété le questionnaire
  const ALLOWED_ROUTES_AFTER_QUESTIONNAIRE = [
    '/accueil',
    '/profil', 
    '/decouverte',
    '/demandes-miroir',
    '/demandes',
    '/miroir',
    '/pokedex',  // 🆕 AJOUTÉ : Pokédex autorisé après questionnaire
    '/connexions',
    '/chat',
    '/parametres'
  ];

  // Routes autorisées AVANT d'avoir complété le questionnaire
  const ALLOWED_ROUTES_BEFORE_QUESTIONNAIRE = [
    '/',
    '/profil',
    '/questionnaire',
    '/admin'
  ];

  // Vérifier si le questionnaire est complété (même logique que les autres pages)
  const hasCompletedQuestionnaire = () => {
    if (!questionnaire) return false;
    // Format desktop (JSON structuré)
    if (questionnaire.profile_json) return true;
    // Format mobile (texte brut avec données valides)
    if (questionnaire.generated_profile && questionnaire.generated_profile.length > 100) return true;
    // Fallback : si le questionnaire existe avec des answers complètes
    if (questionnaire.answers && Object.keys(questionnaire.answers).length > 2) return true;
    return false;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="text-center relative z-10">
          <div className="w-8 h-8 mx-auto mb-4">
            <div className="absolute inset-0 border border-purple-600/40 rounded-full animate-spin"></div>
            <div className="absolute inset-1 border border-purple-600/60 rounded-full animate-spin" style={{animationDuration: '2s', animationDirection: 'reverse'}}></div>
          </div>
          <p className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
            Vérification du profil...
          </p>
        </div>
      </div>
    );
  }

  const isQuestionnaireCompleted = hasCompletedQuestionnaire();
  const currentPath = location.pathname;

  // Si questionnaire complété : autoriser toutes les routes "after questionnaire"
  if (isQuestionnaireCompleted) {
    // Vérifier si on est sur une route autorisée
    const isOnAllowedRoute = ALLOWED_ROUTES_AFTER_QUESTIONNAIRE.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );

    if (isOnAllowedRoute || currentPath === '/') {
      return <>{children}</>;
    }
  }

  // Si questionnaire PAS complété : autoriser seulement les routes "before questionnaire"
  if (!isQuestionnaireCompleted) {
    const isOnAllowedRoute = ALLOWED_ROUTES_BEFORE_QUESTIONNAIRE.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );

    if (isOnAllowedRoute) {
      return <>{children}</>;
    }

    // Si on essaie d'accéder à une route protégée, rediriger vers questionnaire
    return <Navigate to="/questionnaire" replace />;
  }

  // Page de garde avec message explicatif
  return (
    <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />
      
      <div className="max-w-md mx-auto px-6 relative z-10">
        <BaseComponents.Card 
          isDarkMode={isDarkMode} 
          variant="highlighted" 
          className="p-8 text-center space-y-6"
        >
          {/* Icône principale */}
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>

          {/* Titre et message */}
          <div className="space-y-3">
            <h2 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
              Zone Protégée
            </h2>
            <p className={`text-sm leading-relaxed ${designSystem.getTextClasses('secondary')}`}>
              Cette section nécessite d'avoir complété votre questionnaire psychologique 
              pour accéder aux fonctionnalités avancées d'Affinia.
            </p>
          </div>

          {/* Fonctionnalités débloquées */}
          <div className="space-y-3">
            <h3 className={`text-sm font-medium ${designSystem.getTextClasses('primary')}`}>
              Fonctionnalités débloquées :
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-left">
                <Target className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className={`text-xs ${designSystem.getTextClasses('secondary')}`}>
                  Découverte d'âmes compatibles
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Brain className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className={`text-xs ${designSystem.getTextClasses('secondary')}`}>
                  Votre miroir psychologique complet
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Shield className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className={`text-xs ${designSystem.getTextClasses('secondary')}`}>
                  Pokédex des connexions accordées
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <BaseComponents.Button
              variant="primary"
              size="large"
              onClick={() => window.location.href = '/questionnaire'}
              className="w-full"
            >
              <Brain className="w-4 h-4 mr-2" />
              Commencer le questionnaire
              <ArrowRight className="w-4 h-4 ml-2" />
            </BaseComponents.Button>
            
            <BaseComponents.Button
              variant="secondary"
              size="medium"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Retour à l'accueil
            </BaseComponents.Button>
          </div>

          {/* Note de sécurité */}
          <div className={`text-xs ${designSystem.getTextClasses('muted')} leading-relaxed`}>
            Cette protection garantit une expérience authentique et sécurisée 
            pour tous les utilisateurs d'Affinia.
          </div>
        </BaseComponents.Card>
      </div>
    </div>
  );
};