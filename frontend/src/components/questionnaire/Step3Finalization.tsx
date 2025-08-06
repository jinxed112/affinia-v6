// frontend/src/components/questionnaire/Step3Finalization.tsx
import React from 'react';

interface Step3FinalizationProps {
  isDarkMode: boolean;
}

const Step3Finalization: React.FC<Step3FinalizationProps> = ({ isDarkMode }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className={`p-8 rounded-2xl border ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700 text-white' 
          : 'bg-white/80 border-gray-200 text-gray-800'
      } backdrop-blur-sm`}>
        
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Step 3 - En Construction
          </h2>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            La génération de profil IA arrive bientôt !
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDarkMode 
            ? 'bg-blue-900/20 border-blue-800 text-blue-200' 
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚡</span>
            <h3 className="font-semibold">Fonctionnalité en développement</h3>
          </div>
          
          <p className="mb-4">
            Nous travaillons actuellement sur l'intégration de l'IA pour générer 
            votre profil psychologique personnalisé.
          </p>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-current rounded-full opacity-60"></span>
              Génération de prompt sécurisé
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-current rounded-full opacity-60"></span>
              Analyse psychologique via IA
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-current rounded-full opacity-60"></span>
              Profil miroir personnalisé
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isDarkMode 
              ? 'bg-green-900/20 text-green-300 border border-green-800' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            <span className="text-lg">🎉</span>
            <span className="font-medium">Vos réponses ont été sauvegardées !</span>
          </div>
          <p className={`text-sm mt-3 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Vous pouvez continuer pour découvrir la communauté Affinia.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step3Finalization;
