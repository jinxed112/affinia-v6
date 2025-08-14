// AffiniaCard.tsx - Version ULTRA-OPTIMISÉE Mobile Performance
import React, { useState, useMemo, useCallback } from 'react';
import { Heart, Zap, Shield, Star, Sparkles, Eye, MapPin, User, Calendar, ChevronLeft, ChevronRight, FileText, Brain, MessageCircle, X, AlertTriangle } from 'lucide-react';

interface ProfileJson {
  authenticity_score: number;
  attachment_style?: string;
  strength_signals: string[];
  weakness_signals: string[];
  unconscious_patterns: string[];
  ideal_partner_traits: string[];
  mirroring_warning?: string;
  reliability_score?: number;
  affective_indicators?: {
    emotion_expression: string;
    defense_mechanisms: string[];
    attachment_style?: string;
  };
  cognitive_signals?: {
    language_level: string;
    thinking_style: string;
    complexity: string;
  };
}

interface ProfilePhoto {
  id: string;
  photo_url: string;
  is_primary?: boolean;
  is_main?: boolean;
  order?: number;
  photo_order?: number;
}

interface Profile {
  id?: string;
  name?: string;
  bio?: string;
  city?: string;
  avatar_url?: string;
  level?: number;
  xp?: number;
  [key: string]: any;
}

interface Questionnaire {
  answers?: any;
  profile_json?: any;
  generated_profile?: string;
  [key: string]: any;
}

interface AffiniaCardProps {
  userName?: string;
  age?: number;
  avatar?: string;
  photos?: ProfilePhoto[];
  profileJson?: ProfileJson;
  className?: string;
  profile?: Profile;
  questionnaire?: Questionnaire;
}

// 🚀 OPTIMISATION 1: Cache des conversions mobile
const mobileConversionCache = new Map<string, ProfileJson>();

// 🚀 OPTIMISATION 2: Fonction de conversion MEMOIZED
const convertMobileTextToProfileJsonMemo = (generatedProfile: string): ProfileJson | null => {
  // Check cache first
  if (mobileConversionCache.has(generatedProfile)) {
    return mobileConversionCache.get(generatedProfile)!;
  }

  let result: ProfileJson | null = null;

  try {
    // 1. Essayer d'extraire un JSON complet d'abord
    const jsonMatch = generatedProfile.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsedJson = JSON.parse(jsonMatch[1]);
      result = {
        authenticity_score: parsedJson.authenticity_score || 8,
        attachment_style: parsedJson.attachment_style || parsedJson.affective_indicators?.attachment_style || 'évitant',
        strength_signals: parsedJson.strength_signals || [],
        weakness_signals: parsedJson.weakness_signals || [],
        unconscious_patterns: parsedJson.unconscious_patterns || [],
        ideal_partner_traits: parsedJson.ideal_partner_traits || [],
        mirroring_warning: parsedJson.mirroring_warning,
        reliability_score: parsedJson.reliability_score || 0.8,
        affective_indicators: {
          emotion_expression: parsedJson.affective_indicators?.emotion_expression || 'modérée',
          defense_mechanisms: parsedJson.affective_indicators?.defense_mechanisms || [],
          attachment_style: parsedJson.affective_indicators?.attachment_style || parsedJson.attachment_style || 'évitant'
        },
        cognitive_signals: {
          language_level: parsedJson.cognitive_signals?.language_level || 'élevé',
          thinking_style: parsedJson.cognitive_signals?.thinking_style || 'analytique',
          complexity: parsedJson.cognitive_signals?.complexity || 'Complexité élevée'
        }
      };
    }

    // 2. Si pas de JSON, essayer d'extraire depuis "PARTIE 2"
    if (!result) {
      const partie2Match = generatedProfile.match(/PARTIE 2[^{]*(\{[\s\S]*\})/);
      if (partie2Match && partie2Match[1]) {
        const parsedJson = JSON.parse(partie2Match[1]);
        result = {
          authenticity_score: parsedJson.authenticity_score || 8,
          attachment_style: parsedJson.affective_indicators?.attachment_style || 'évitant',
          strength_signals: parsedJson.strength_signals || [],
          weakness_signals: parsedJson.weakness_signals || [],
          unconscious_patterns: parsedJson.unconscious_patterns || [],
          ideal_partner_traits: parsedJson.ideal_partner_traits || [],
          mirroring_warning: parsedJson.mirroring_warning,
          reliability_score: parsedJson.reliability_score || 0.8,
          affective_indicators: {
            emotion_expression: parsedJson.affective_indicators?.emotion_expression || 'modérée',
            defense_mechanisms: parsedJson.affective_indicators?.defense_mechanisms || [],
            attachment_style: parsedJson.affective_indicators?.attachment_style || 'évitant'
          },
          cognitive_signals: {
            language_level: parsedJson.cognitive_signals?.language_level || 'élevé',
            thinking_style: parsedJson.cognitive_signals?.thinking_style || 'analytique',
            complexity: parsedJson.cognitive_signals?.complexity || 'Complexité élevée'
          }
        };
      }
    }

    // 3. Fallback simplifié pour mobile
    if (!result) {
      result = {
        authenticity_score: 8,
        attachment_style: 'évitant',
        strength_signals: ['Communication directe', 'Authenticité'],
        weakness_signals: ['En cours d\'analyse'],
        unconscious_patterns: ['Patterns en cours d\'analyse'],
        ideal_partner_traits: ['Compatibilité en évaluation'],
        mirroring_warning: 'Profil en cours d\'analyse par notre IA',
        reliability_score: 0.85,
        affective_indicators: {
          emotion_expression: 'modérée',
          defense_mechanisms: ['Analyse en cours'],
          attachment_style: 'évitant'
        },
        cognitive_signals: {
          language_level: 'élevé',
          thinking_style: 'analytique',
          complexity: 'Profil riche et complexe'
        }
      };
    }

    // Cache le résultat
    mobileConversionCache.set(generatedProfile, result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur conversion mobile text → JSON:', error);
    
    // Fallback en cas d'erreur
    const fallback = {
      authenticity_score: 8,
      attachment_style: 'temporaire',
      strength_signals: ['Personnalité unique'],
      weakness_signals: ['En cours d\'analyse'],
      unconscious_patterns: ['Patterns en cours d\'analyse'],
      ideal_partner_traits: ['Compatibilité en évaluation'],
      mirroring_warning: 'Profil en cours d\'analyse',
      reliability_score: 0.85,
      affective_indicators: {
        emotion_expression: 'modérée',
        defense_mechanisms: ['Analyse en cours'],
        attachment_style: 'temporaire'
      },
      cognitive_signals: {
        language_level: 'élevé',
        thinking_style: 'analytique',
        complexity: 'Profil riche et complexe'
      }
    };
    
    mobileConversionCache.set(generatedProfile, fallback);
    return fallback;
  }
};

// 🚀 OPTIMISATION 3: Cache de déduction de style
const attachmentStyleCache = new Map<string, string>();

// 🚀 OPTIMISATION 4: Déduction de style MEMOIZED
const deduceAttachmentStyleMemo = (profileData: any): string => {
  const cacheKey = JSON.stringify({
    attachment_style: profileData.attachment_style,
    affective: profileData.affective_indicators?.attachment_style,
    signals: (profileData.strength_signals || []).slice(0, 2), // Seulement les 2 premiers pour le cache
    patterns: (profileData.unconscious_patterns || []).slice(0, 2)
  });

  if (attachmentStyleCache.has(cacheKey)) {
    return attachmentStyleCache.get(cacheKey)!;
  }

  let result = 'temporaire';

  // 1. Vérifier d'abord s'il y a un attachment_style direct
  if (profileData.attachment_style && profileData.attachment_style !== 'temporaire') {
    result = profileData.attachment_style;
  }
  // 2. Vérifier dans affective_indicators
  else if (profileData.affective_indicators?.attachment_style) {
    result = profileData.affective_indicators.attachment_style;
  }
  // 3. Analyse des patterns (simplifié pour mobile)
  else {
    const allText = [
      ...(profileData.strength_signals || []),
      ...(profileData.weakness_signals || []),
      ...(profileData.unconscious_patterns || []),
      profileData.mirroring_warning || ''
    ].join(' ').toLowerCase();

    // Patterns simplifiés pour performance
    if (allText.includes('retrait') || allText.includes('évitement') || allText.includes('distance')) {
      result = 'évitant';
    } else if (allText.includes('anxieux') || allText.includes('validation') || allText.includes('dépendance')) {
      result = 'ambivalent';
    } else if (allText.includes('stable') || allText.includes('équilibré') || allText.includes('confiance')) {
      result = 'secure';
    } else if (allText.includes('contradictoire') || allText.includes('oscillation')) {
      result = 'disorganized';
    }
  }

  attachmentStyleCache.set(cacheKey, result);
  return result;
};

export const AffiniaCard: React.FC<AffiniaCardProps> = (props) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // 🚀 OPTIMISATION 5: Données de base mémorisées
  const baseData = useMemo(() => {
    const fullName = props.userName || props.profile?.name || 'Utilisateur';
    const userName = fullName.split(' ')[0];
    const photos = props.photos || [];
    const className = props.className || '';

    // Age
    let age = props.age;
    if (!age && props.questionnaire?.answers) {
      const answers = typeof props.questionnaire.answers === 'string' 
        ? JSON.parse(props.questionnaire.answers) 
        : props.questionnaire.answers;
      age = answers.age;
    }

    return { fullName, userName, photos, className, age };
  }, [props.userName, props.profile?.name, props.photos, props.className, props.age, props.questionnaire?.answers]);

  // 🚀 OPTIMISATION 6: ProfileJson traité MEMOIZED
  const processedProfileJson = useMemo(() => {
    let profileJson = props.profileJson;
    
    if (!profileJson && props.questionnaire) {
      // Desktop : profile_json direct
      if (props.questionnaire.profile_json) {
        profileJson = typeof props.questionnaire.profile_json === 'string'
          ? JSON.parse(props.questionnaire.profile_json)
          : props.questionnaire.profile_json;
      }
      // Mobile : generated_profile (texte à convertir)
      else if (props.questionnaire.generated_profile) {
        profileJson = convertMobileTextToProfileJsonMemo(props.questionnaire.generated_profile);
      }
    }

    // Fallback
    if (!profileJson) {
      profileJson = {
        authenticity_score: 8,
        attachment_style: 'temporaire',
        strength_signals: ['Personnalité unique', 'Authenticité'],
        weakness_signals: ['En cours d\'analyse'],
        unconscious_patterns: ['Patterns en cours d\'analyse'],
        ideal_partner_traits: ['Compatibilité en évaluation'],
        mirroring_warning: 'Profil en cours d\'analyse par notre IA',
        reliability_score: 0.85,
        affective_indicators: {
          emotion_expression: 'modérée',
          defense_mechanisms: ['Analyse en cours'],
          attachment_style: 'temporaire'
        },
        cognitive_signals: {
          language_level: 'élevé',
          thinking_style: 'analytique',
          complexity: 'Profil riche et complexe'
        }
      };
    }

    return profileJson;
  }, [props.profileJson, props.questionnaire]);

  // 🚀 OPTIMISATION 7: Style d'attachement MEMOIZED
  const deducedAttachmentStyle = useMemo(() => {
    return deduceAttachmentStyleMemo(processedProfileJson);
  }, [processedProfileJson]);

  // 🚀 OPTIMISATION 8: Helpers MEMOIZED
  const uiData = useMemo(() => {
    const getRarity = (score: number) => {
      if (score >= 9) return { name: 'Légendaire', color: 'from-yellow-400 to-orange-500', textColor: 'text-yellow-300' };
      if (score >= 7) return { name: 'Rare', color: 'from-purple-400 to-pink-500', textColor: 'text-purple-300' };
      if (score >= 5) return { name: 'Commun', color: 'from-blue-400 to-cyan-500', textColor: 'text-blue-300' };
      return { name: 'Basique', color: 'from-gray-400 to-gray-600', textColor: 'text-gray-300' };
    };

    const getPersonalityType = (style: string) => {
      const types = {
        'évitant': { 
          name: 'Indépendant', 
          icon: '❄️', 
          element: 'Glace', 
          color: 'bg-blue-500',
          borderStyle: 'linear-gradient(145deg, #3b82f6, #06b6d4, #1e40af, #0ea5e9)',
          shadowColor: '59, 130, 246'
        },
        'avoidant': { 
          name: 'Indépendant', 
          icon: '❄️', 
          element: 'Glace', 
          color: 'bg-blue-500',
          borderStyle: 'linear-gradient(145deg, #3b82f6, #06b6d4, #1e40af, #0ea5e9)',
          shadowColor: '59, 130, 246'
        },
        'ambivalent': { 
          name: 'Émotionnel', 
          icon: '💜', 
          element: 'Psychique', 
          color: 'bg-purple-500',
          borderStyle: 'linear-gradient(145deg, #a855f7, #ec4899, #7c3aed, #f97316)',
          shadowColor: '168, 85, 247'
        },
        'secure': { 
          name: 'Équilibré', 
          icon: '💚', 
          element: 'Normal', 
          color: 'bg-green-500',
          borderStyle: 'linear-gradient(145deg, #22c55e, #10b981, #16a34a, #84cc16)',
          shadowColor: '34, 197, 94'
        },
        'disorganized': { 
          name: 'Complexe', 
          icon: '🌙', 
          element: 'Ténèbres', 
          color: 'bg-indigo-500',
          borderStyle: 'linear-gradient(145deg, #6366f1, #8b5cf6, #4f46e5, #7c3aed)',
          shadowColor: '99, 102, 241'
        },
        'temporaire': {
          name: 'Mystérieux',
          icon: '🌈',
          element: 'Spectral',
          color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500',
          borderStyle: 'linear-gradient(145deg, #8b5cf6, #ec4899, #06b6d4, #a855f7, #f472b6, #0ea5e9)',
          shadowColor: '139, 92, 246'
        }
      };
      return types[style as keyof typeof types] || types['temporaire'];
    };

    const rarity = getRarity(processedProfileJson.authenticity_score);
    const personalityType = getPersonalityType(deducedAttachmentStyle);

    return { rarity, personalityType };
  }, [processedProfileJson.authenticity_score, deducedAttachmentStyle]);

  // 🚀 OPTIMISATION 9: Photo principale MEMOIZED
  const mainPhoto = useMemo(() => {
    if (baseData.photos.length > 0) {
      return baseData.photos[currentPhotoIndex]?.photo_url;
    }
    return props.avatar || props.profile?.avatar_url;
  }, [baseData.photos, currentPhotoIndex, props.avatar, props.profile?.avatar_url]);

  // 🚀 OPTIMISATION 10: Navigation photos optimisée
  const nextPhoto = useCallback(() => {
    if (baseData.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % baseData.photos.length);
    }
  }, [baseData.photos.length]);

  const prevPhoto = useCallback(() => {
    if (baseData.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + baseData.photos.length) % baseData.photos.length);
    }
  }, [baseData.photos.length]);

  // 🚀 OPTIMISATION 11: CSS réduit pour mobile
  const rgbAnimation = useMemo(() => `
    @keyframes rgb-border-subtle {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .rgb-border-subtle {
      background: linear-gradient(
        45deg, 
        #8b5cf6, #ec4899, #06b6d4, #a855f7, #f472b6, #0ea5e9,
        #8b5cf6, #ec4899, #06b6d4
      );
      background-size: 300% 300%;
      animation: rgb-border-subtle 8s ease-in-out infinite;
    }
    
    @media (max-width: 768px) {
      .rgb-border-subtle {
        animation-duration: 4s;
      }
    }
  `, []);

  return (
    <div className={`relative ${baseData.className}`}>
      <style>{rgbAnimation}</style>
      
      {/* Wrapper avec contour optimisé */}
      <div 
        className={`w-80 h-[500px] rounded-[28px] p-2 transition-all duration-300 hover:scale-[1.01] relative shadow-2xl ${
          deducedAttachmentStyle === 'temporaire' ? 'rgb-border-subtle' : ''
        }`}
        style={{
          background: deducedAttachmentStyle === 'temporaire' 
            ? undefined 
            : uiData.personalityType.borderStyle,
          boxShadow: deducedAttachmentStyle === 'temporaire' 
            ? `0 0 25px rgba(139, 92, 246, 0.3), 0 0 50px rgba(236, 72, 153, 0.2), 0 10px 40px rgba(0, 0, 0, 0.4)`
            : `0 0 30px rgba(${uiData.personalityType.shadowColor}, 0.6), 0 10px 40px rgba(0, 0, 0, 0.4)`
        }}
      >
        {/* Carte intérieure */}
        <div 
          className="w-full h-full rounded-[20px] overflow-hidden cursor-pointer relative bg-black"
          onClick={() => setIsFlipped(!isFlipped)}
        >
        
        {/* FACE AVANT - Simplifiée mobile */}
        {!isFlipped && (
          <div className="relative w-full h-full">
            {/* Photo de fond avec lazy loading */}
            <div className="absolute inset-0">
              {mainPhoto ? (
                <img 
                  src={mainPhoto} 
                  alt={baseData.userName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-6xl">{uiData.personalityType.icon}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
            </div>

            {/* Navigation photos - Simplifiée mobile */}
            {baseData.photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            )}

            {/* Header - Optimisé mobile */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 gap-3">
              <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white text-lg font-bold truncate">{baseData.userName}</h2>
                    {baseData.age && (
                      <p className="text-white/80 text-sm">
                        {baseData.age} ans{props.profile?.city ? ` • ${props.profile.city}` : ''}
                      </p>
                    )}
                  </div>
                  {baseData.photos.length > 1 && (
                    <div className="bg-white/20 rounded-full px-2 py-1 text-white text-xs font-bold flex-shrink-0">
                      {currentPhotoIndex + 1}/{baseData.photos.length}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); setShowTypeModal(true); }}
                className={`${
                  deducedAttachmentStyle === 'temporaire' 
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500' 
                    : uiData.personalityType.color
                } text-white px-2.5 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-1 border border-white/20 flex-shrink-0`}
              >
                <span className="text-sm">{uiData.personalityType.icon}</span>
                <span className="text-xs font-bold hidden sm:inline">{uiData.personalityType.element}</span>
              </button>
            </div>

            {/* Footer - Score */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <span className={`font-bold ${uiData.rarity.textColor}`}>{uiData.rarity.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold text-sm">{processedProfileJson.authenticity_score}/10</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.ceil(processedProfileJson.authenticity_score/2) ? 'text-yellow-400 fill-current' : 'text-white/30'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FACE ARRIÈRE - Données réelles optimisées */}
        {isFlipped && (
          <div className="w-full h-full bg-gray-900 p-4 sm:p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-white text-lg sm:text-xl font-bold">Profil de {baseData.userName}</h3>
              <button
                onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Retourner la carte"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Sections simplifiées pour mobile */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Identité */}
              <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h4 className="text-white font-bold mb-2 sm:mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  Identité
                </h4>
                <div className="space-y-1 sm:space-y-2">
                  {baseData.age && (
                    <p className="text-gray-300 text-sm flex items-center gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      {baseData.age} ans
                    </p>
                  )}
                  {props.profile?.city && (
                    <p className="text-gray-300 text-sm flex items-center gap-2">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      {props.profile.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {props.profile?.bio && (
                <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <h4 className="text-white font-bold mb-2 sm:mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    À propos
                  </h4>
                  <p className="text-gray-300 text-sm italic">"{props.profile.bio}"</p>
                </div>
              )}

              {/* Personnalité */}
              <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h4 className="text-white font-bold mb-2 sm:mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  Personnalité
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl">{uiData.personalityType.icon}</span>
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">Type {uiData.personalityType.element}</p>
                      <p className="text-gray-400 text-xs sm:text-sm">{uiData.personalityType.name}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-2 sm:p-3">
                    <p className="text-blue-200 text-xs sm:text-sm">
                      <strong>Style :</strong> {deducedAttachmentStyle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Forces - Limitées pour mobile */}
              {processedProfileJson.strength_signals && processedProfileJson.strength_signals.length > 0 && (
                <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <h4 className="text-white font-bold mb-2 sm:mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    Forces ({Math.min(processedProfileJson.strength_signals.length, 3)})
                  </h4>
                  <div className="space-y-1 sm:space-y-2">
                    {processedProfileJson.strength_signals.slice(0, 3).map((strength, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300 text-xs sm:text-sm">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Points d'attention - Limités */}
              {processedProfileJson.weakness_signals && processedProfileJson.weakness_signals.length > 0 && (
                <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <h4 className="text-white font-bold mb-2 sm:mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                    Points d'attention
                  </h4>
                  <div className="space-y-1 sm:space-y-2">
                    {processedProfileJson.weakness_signals.slice(0, 2).map((weakness, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-orange-400 mt-1 flex-shrink-0 text-xs">•</span>
                        <p className="text-gray-300 text-xs sm:text-sm">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avertissement */}
              {processedProfileJson.mirroring_warning && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <h4 className="text-white font-bold mb-2 sm:mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    Avertissement
                  </h4>
                  <p className="text-red-200 text-xs sm:text-sm leading-relaxed">{processedProfileJson.mirroring_warning}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        </div>
      </div>

      {/* Modal optimisé mobile */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-700 p-4 sm:p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${
                  deducedAttachmentStyle === 'temporaire' 
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500' 
                    : uiData.personalityType.color
                } flex items-center justify-center`}>
                  <span className="text-xl sm:text-2xl">{uiData.personalityType.icon}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base">Type {uiData.personalityType.element}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">{uiData.personalityType.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTypeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                {deducedAttachmentStyle === 'temporaire' ? (
                  <>🌈 <strong>Mode Spectral temporaire</strong> - En attente de l'IA.</>
                ) : (
                  <>Style <strong>{deducedAttachmentStyle}</strong> analysé par l'IA.</>
                )}
              </p>
            </div>

            <button
              onClick={() => setShowTypeModal(false)}
              className="w-full py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-medium transition-colors text-sm sm:text-base"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </div>
  );
};