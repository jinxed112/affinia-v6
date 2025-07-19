import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Zap, 
  Brain, 
  Heart, 
  Eye, 
  Users,
  TrendingUp,
  Target,
  Star
} from 'lucide-react';
import { AffiniaCard } from './AffiniaCard';
import { InsightCard } from './InsightCard';

interface ProfileJson {
  authenticity_score: number;
  attachment_style: string;
  strength_signals: string[];
  weakness_signals: string[];
  unconscious_patterns: string[];
  ideal_partner_traits: string[];
  reliability_score: number;
  affective_indicators: {
    emotion_expression: string;
    defense_mechanisms: string[];
  };
  cognitive_signals: {
    language_level: string;
    thinking_style: string;
    complexity: string;
  };
  // Ajout de propriétés optionnelles pour les nouvelles sections
  trait_observations?: {
    cognitive?: string[];
    emotional?: string[];
    social?: string[];
  };
  relationnal_risks?: string[];
  mirroring_warning?: string;
}

interface MirrorInsightPanelProps {
  userName?: string;
  age?: number;
  avatar?: string;
  profileJson?: ProfileJson;
  isDarkMode?: boolean;
}

export const MirrorInsightPanel: React.FC<MirrorInsightPanelProps> = ({
  userName = 'Dresseur',
  age,
  avatar,
  profileJson,
  isDarkMode = true
}) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!profileJson) {
    return (
      <div className={`transition-all duration-500 ${
        isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className={`rounded-xl p-8 text-center border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-100 border-gray-300'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <Brain className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Analyse non disponible
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Complétez votre questionnaire pour voir vos insights psychologiques détaillés.
          </p>
        </div>
      </div>
    );
  }

  // Préparer les données pour les cartes d'insights
  const insightData = [
    {
      title: 'Forces principales',
      icon: <Zap className="w-5 h-5" />,
      items: profileJson.strength_signals || [],
      colorScheme: 'green' as const,
      defaultOpen: true
    },
    {
      title: 'Points de fragilité',
      icon: <Shield className="w-5 h-5" />,
      items: profileJson.weakness_signals || [],
      colorScheme: 'red' as const,
      defaultOpen: false
    },
    {
      title: 'Mécanismes inconscients',
      icon: <Brain className="w-5 h-5" />,
      items: [
        ...(profileJson.unconscious_patterns || []),
        ...(profileJson.affective_indicators?.defense_mechanisms || [])
      ].filter(Boolean),
      colorScheme: 'purple' as const,
      defaultOpen: false
    },
    {
      title: 'Indicateurs cognitifs',
      icon: <TrendingUp className="w-5 h-5" />,
      items: [
        `Niveau linguistique: ${profileJson.cognitive_signals?.language_level || 'Non défini'}`,
        `Style de pensée: ${profileJson.cognitive_signals?.thinking_style || 'Non défini'}`,
        `Complexité: ${profileJson.cognitive_signals?.complexity || 'Non définie'}`,
        `Expression émotionnelle: ${profileJson.affective_indicators?.emotion_expression || 'Non définie'}`,
        ...(profileJson.trait_observations?.cognitive || [])
      ].filter(item => !item.includes('Non défini')),
      colorScheme: 'blue' as const,
      defaultOpen: false
    },
    {
      title: 'Risques relationnels',
      icon: <AlertTriangle className="w-5 h-5" />,
      items: profileJson.relationnal_risks || [],
      colorScheme: 'orange' as const,
      defaultOpen: false
    },
    {
      title: 'Profil idéal recherché',
      icon: <Heart className="w-5 h-5" />,
      items: profileJson.ideal_partner_traits || [],
      colorScheme: 'pink' as const,
      defaultOpen: false
    }
  ];

  // Filtrer les cartes qui ont du contenu
  const validInsights = insightData.filter(insight => insight.items.length > 0);

  return (
    <div className={`space-y-6 transition-all duration-500 ${
      isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Affinia Card */}
      <div className="flex justify-center">
        <AffiniaCard
          userName={userName}
          age={age}
          avatar={avatar}
          profileJson={profileJson}
          className="mx-auto"
        />
      </div>

      {/* Scores de fiabilité et authenticité */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-lg p-4 text-center ${
          isDarkMode 
            ? 'bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/30' 
            : 'bg-gradient-to-br from-yellow-100 to-amber-100 border border-yellow-300'
        }`}>
          <Star className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {profileJson.authenticity_score}/10
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
            Authenticité
          </p>
        </div>
        
        <div className={`rounded-lg p-4 text-center ${
          isDarkMode 
            ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30' 
            : 'bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300'
        }`}>
          <Target className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {Math.round(profileJson.reliability_score * 100)}%
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
            Fiabilité
          </p>
        </div>
      </div>

      {/* Style d'attachement */}
      <div className={`rounded-lg p-4 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-purple-900/30 to-violet-900/30 border border-purple-500/30' 
          : 'bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-300'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500/10'
          }`}>
            <Users className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Style d'attachement
            </h4>
            <p className={`text-sm capitalize ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              {profileJson.attachment_style}
            </p>
          </div>
        </div>
      </div>

      {/* Cartes d'insights dépliables */}
      <div className="space-y-4">
        {validInsights.map((insight, index) => (
          <InsightCard
            key={insight.title}
            title={insight.title}
            icon={insight.icon}
            items={insight.items}
            colorScheme={insight.colorScheme}
            defaultOpen={insight.defaultOpen}
            animationDelay={200 + (index * 100)}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      {/* Avertissement miroir s'il existe */}
      {profileJson.mirroring_warning && (
        <div className={`rounded-lg p-4 border ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-500/30' 
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <div>
              <h4 className={`font-semibold mb-1 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>
                Avertissement miroir
              </h4>
              <p className={`text-sm ${
                isDarkMode ? 'text-red-200' : 'text-red-700'
              }`}>
                {profileJson.mirroring_warning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Note finale */}
      <div className={`rounded-lg p-4 border ${
        isDarkMode 
          ? 'bg-blue-900/20 border-blue-500/30' 
          : 'bg-blue-50 border-blue-300'
      }`}>
        <p className={`text-xs flex items-start ${
          isDarkMode ? 'text-blue-300' : 'text-blue-800'
        }`}>
          <Eye className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Ces insights sont générés par analyse IA de vos réponses au questionnaire. 
            Ils révèlent des patterns inconscients et des tendances psychologiques profondes.
          </span>
        </p>
      </div>
    </div>
  );
};