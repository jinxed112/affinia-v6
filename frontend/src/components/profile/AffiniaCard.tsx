import React, { useState } from 'react';
import { Heart, Zap, Shield, Star, Sparkles, Eye, MapPin, User, Calendar, ChevronLeft, ChevronRight, FileText, Brain, MessageCircle, X } from 'lucide-react';

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
    attachment_style?: string;
  };
  cognitive_signals: {
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

export const AffiniaCard: React.FC<AffiniaCardProps> = (props) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Conversion mobile → JSON
  const convertMobileTextToProfileJson = (generatedProfile: string): ProfileJson | null => {
    try {
      const jsonMatch = generatedProfile.match(/PARTIE 2[^{]*(\{[\s\S]*\})/);
      
      if (jsonMatch && jsonMatch[1]) {
        const parsedJson = JSON.parse(jsonMatch[1]);
        
        return {
          authenticity_score: parsedJson.authenticity_score || 8,
          attachment_style: parsedJson.affective_indicators?.attachment_style || 'évitant',
          strength_signals: parsedJson.strength_signals || [],
          weakness_signals: parsedJson.weakness_signals || [],
          unconscious_patterns: parsedJson.unconscious_patterns || [],
          ideal_partner_traits: parsedJson.ideal_partner_traits || [],
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
      
      return {
        authenticity_score: 8,
        attachment_style: 'évitant',
        strength_signals: ['Communication directe', 'Authenticité'],
        weakness_signals: ['En cours d\'analyse'],
        unconscious_patterns: ['Patterns en cours d\'analyse'],
        ideal_partner_traits: ['Compatibilité en évaluation'],
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
      
    } catch (error) {
      console.error('❌ Erreur conversion mobile text → JSON:', error);
      return null;
    }
  };

  // Extraction propre des données
  const fullName = props.userName || props.profile?.name || 'Utilisateur';
  const userName = fullName.split(' ')[0]; // Juste le prénom
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

  // City
  const city = props.profile?.city;

  // ProfileJson - Support mobile ET desktop
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
      profileJson = convertMobileTextToProfileJson(props.questionnaire.generated_profile);
    }
  }

  // Bio
  const bio = props.profile?.bio;

  // Photo principale
  const getMainPhoto = () => {
    if (photos.length > 0) {
      return photos[currentPhotoIndex]?.photo_url;
    }
    return props.avatar || props.profile?.avatar_url;
  };

  // Si pas de profil psychologique
  if (!profileJson) {
    return (
      <div className={`w-80 h-[500px] bg-gray-800 rounded-3xl flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-white font-semibold">Questionnaire requis</p>
          <p className="text-gray-400 text-sm mt-2">Analyse psychologique manquante</p>
        </div>
      </div>
    );
  }

  // Helpers
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
      }
    };
    return types[style as keyof typeof types] || types['avoidant'];
  };

  const rarity = getRarity(profileJson.authenticity_score);
  const personalityType = getPersonalityType(profileJson.attachment_style);
  const mainPhoto = getMainPhoto();

  // Navigation photos
  const nextPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Wrapper avec contour Pokémon épais */}
      <div 
        className="w-80 h-[500px] rounded-[28px] p-2 transition-all duration-500 hover:scale-[1.02] relative shadow-2xl"
        style={{
          background: personalityType.borderStyle,
          boxShadow: `0 0 30px rgba(${personalityType.shadowColor}, 0.6), 0 10px 40px rgba(0, 0, 0, 0.4)`
        }}
      >
        {/* Carte intérieure */}
        <div 
          className="w-full h-full rounded-[20px] overflow-hidden cursor-pointer relative bg-black"
          onClick={() => setIsFlipped(!isFlipped)}
        >
        
        {/* FACE AVANT */}
        {!isFlipped && (
          <div className="relative w-full h-full">
            {/* Photo de fond */}
            <div className="absolute inset-0">
              {mainPhoto ? (
                <img 
                  src={mainPhoto} 
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-6xl">{personalityType.icon}</span>
                </div>
              )}
              {/* Overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
            </div>

            {/* Navigation photos */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Header - Nom et Type */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 gap-3">
              <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white text-lg font-bold truncate">{userName}</h2>
                    {age && (
                      <p className="text-white/80 text-sm">
                        {age} ans{city ? ` • ${city}` : ''}
                      </p>
                    )}
                  </div>
                  {/* Indicateur photos intégré */}
                  {photos.length > 1 && (
                    <div className="bg-white/20 rounded-full px-2 py-1 text-white text-xs font-bold flex-shrink-0">
                      {currentPhotoIndex + 1}/{photos.length}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bouton type plus compact */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowTypeModal(true); }}
                className={`${personalityType.color} text-white px-2.5 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-1 border border-white/20 flex-shrink-0`}
              >
                <span className="text-sm">{personalityType.icon}</span>
                <span className="text-xs font-bold">{personalityType.element}</span>
              </button>
            </div>

            {/* Footer - Score */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <span className={`font-bold ${rarity.textColor}`}>{rarity.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold text-sm">{profileJson.authenticity_score}/10</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.ceil(profileJson.authenticity_score/2) ? 'text-yellow-400 fill-current' : 'text-white/30'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FACE ARRIÈRE */}
        {isFlipped && (
          <div className="w-full h-full bg-gray-900 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-xl font-bold">Profil de {userName}</h3>
              <button
                onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              
              {/* Identité */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Identité
                </h4>
                <div className="space-y-2">
                  {age && (
                    <p className="text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      {age} ans
                    </p>
                  )}
                  {city && (
                    <p className="text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-400" />
                      {city}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {bio && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    À propos
                  </h4>
                  <p className="text-gray-300 italic">"{bio}"</p>
                </div>
              )}

              {/* Personnalité */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Personnalité
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{personalityType.icon}</span>
                    <div>
                      <p className="text-white font-medium">Type {personalityType.element}</p>
                      <p className="text-gray-400 text-sm">{personalityType.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">Style cognitif:</p>
                      <p className="text-white capitalize">{profileJson.cognitive_signals?.thinking_style}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Expression:</p>
                      <p className="text-white capitalize">{profileJson.affective_indicators?.emotion_expression}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forces */}
              {profileJson.strength_signals && profileJson.strength_signals.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Forces ({profileJson.strength_signals.length})
                  </h4>
                  <div className="space-y-2">
                    {profileJson.strength_signals.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <p className="text-gray-300 text-sm">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recherche */}
              {profileJson.ideal_partner_traits && profileJson.ideal_partner_traits.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    Recherche
                  </h4>
                  <div className="space-y-2">
                    {profileJson.ideal_partner_traits.map((trait, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-pink-400">•</span>
                        <p className="text-gray-300 text-sm">{trait}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
        
        </div>
      </div>

      {/* MODAL TYPE DE PERSONNALITÉ */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl border border-gray-700 p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${personalityType.color} flex items-center justify-center`}>
                  <span className="text-2xl">{personalityType.icon}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">Type {personalityType.element}</h3>
                  <p className="text-gray-400">{personalityType.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTypeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-4 mb-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                Style d'attachement <strong>{profileJson.attachment_style}</strong> - 
                Une personnalité unique avec ses propres patterns relationnels et émotionnels.
              </p>
            </div>

            <button
              onClick={() => setShowTypeModal(false)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </div>
  );
};