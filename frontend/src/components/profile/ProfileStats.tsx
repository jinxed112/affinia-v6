import React from 'react';
import { Star, Zap, Award, Crown, Sparkles, Calendar, Target, BarChart3, TrendingUp } from 'lucide-react';

interface ProfileStatsProps {
  isDarkMode: boolean;
  profile: any;
  questionnaire: any;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  isDarkMode, 
  profile, 
  questionnaire 
}) => {
  // Calculer la progression vers le niveau suivant
  const calculateLevelProgress = () => {
    const currentXP = profile?.xp || 0;
    const currentLevel = profile?.level || 1;
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const currentLevelXP = currentXP - xpForCurrentLevel;
    const neededForNext = xpForNextLevel - currentXP;
    const progressPercent = Math.min((currentLevelXP / 100) * 100, 100);
    
    return {
      current: currentLevelXP,
      needed: neededForNext,
      percent: progressPercent,
      nextLevel: currentLevel + 1
    };
  };

  // Extraire les données du JSON d'analyse
  const getAnalysisData = () => {
    if (!questionnaire?.profile_json) return null;
    
    const profileJson = typeof questionnaire.profile_json === 'string'
      ? JSON.parse(questionnaire.profile_json)
      : questionnaire.profile_json;
      
    return {
      authenticity: profileJson.authenticity_score || 0,
      reliability: Math.round((profileJson.reliability_score || 0) * 100),
      attachment: profileJson.affective_indicators?.attachment_style || 'N/A',
      strengths: profileJson.strength_signals?.length || 0,
    };
  };

  const levelProgress = calculateLevelProgress();
  const analysisData = getAnalysisData();

  const stats = [
    {
      label: 'Niveau',
      value: profile?.level || 1,
      icon: Crown,
      color: isDarkMode ? 'text-yellow-400' : 'text-yellow-500',
      bgColor: isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100',
    },
    {
      label: 'XP Total',
      value: profile?.xp || 0,
      icon: Zap,
      color: isDarkMode ? 'text-blue-400' : 'text-blue-500',
      bgColor: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100',
    },
    {
      label: 'Crédits',
      value: profile?.credits || 100,
      icon: Sparkles,
      color: isDarkMode ? 'text-green-400' : 'text-green-500',
      bgColor: isDarkMode ? 'bg-green-500/20' : 'bg-green-100',
    },
    {
      label: 'Complétude',
      value: '75%',
      icon: Target,
      color: isDarkMode ? 'text-orange-400' : 'text-orange-500',
      bgColor: isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100',
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Statistiques
        </h3>
      </div>

      {/* Progression du niveau */}
      <div className={`p-6 rounded-2xl ${
        isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'
      } backdrop-blur-xl`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                <Crown className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <div>
                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Niveau {profile?.level || 1}
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {levelProgress.needed} XP pour le niveau {levelProgress.nextLevel}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {levelProgress.current} XP
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                / 100 XP
              </p>
            </div>
          </div>

          <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000"
              style={{ width: `${levelProgress.percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'
              } backdrop-blur-xl`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className={`text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                </div>
                <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analyse psychologique (si disponible) */}
      {analysisData && (
        <div className={`p-6 rounded-2xl ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'
        } backdrop-blur-xl`}>
          <div className="space-y-4">
            <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Analyse Psychologique
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Authenticité
                  </span>
                  <span className={`font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {analysisData.authenticity}/10
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${(analysisData.authenticity / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Fiabilité
                  </span>
                  <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {analysisData.reliability}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${analysisData.reliability}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Style d'attachement :
                </span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analysisData.attachment}
                </span>
              </div>
              <div>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Forces détectées :
                </span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {analysisData.strengths}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge d'encouragement */}
      <div className={`p-4 rounded-xl ${
        isDarkMode ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200'
      }`}>
        <div className="flex items-center gap-3">
          <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <div>
            <p className={`font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              🚀 Continuez sur cette lancée !
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              Votre profil devient de plus en plus attractif. Plus vous l'enrichissez, 
              meilleures seront vos suggestions !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};