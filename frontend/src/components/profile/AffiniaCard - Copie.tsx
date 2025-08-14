import React, { useState } from 'react';
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
      
      return null;
      
    } catch (error) {
      console.error('❌ Erreur conversion mobile text → JSON:', error);
      return null;
    }
  };

  // 🧠 DÉDUCTION INTELLIGENTE DU STYLE D'ATTACHEMENT
  const deduceAttachmentStyle = (profileData: any): string => {
    if (profileData.attachment_style) {
      return profileData.attachment_style;
    }

    // Analyser les patterns et signaux pour déduire le type
    const allText = [
      ...(profileData.strength_signals || []),
      ...(profileData.weakness_signals || []),
      ...(profileData.unconscious_patterns || []),
      profileData.mirroring_warning || ''
    ].join(' ').toLowerCase();

    // Patterns évitants
    if (allText.includes('retrait') || 
        allText.includes('se replier') || 
        allText.includes('évitement') ||
        allText.includes('distance') ||
        allText.includes('solitude') ||
        allText.includes('se ressourcer seul')) {
      return 'évitant';
    }

    // Patterns anxieux/ambivalents
    if (allText.includes('anxieux') || 
        allText.includes('validation') || 
        allText.includes('dépendance') ||
        allText.includes('demande constante') ||
        allText.includes('fusionnel')) {
      return 'ambivalent';
    }

    // Patterns sécures
    if (allText.includes('stable') || 
        allText.includes('équilibré') || 
        allText.includes('sûr') ||
        allText.includes('constance')) {
      return 'secure';
    }

    // Patterns désorganisés
    if (allText.includes('contradictoire') || 
        allText.includes('oscillation') || 
        allText.includes('saboter') ||
        allText.includes('complexe')) {
      return 'disorganized';
    }

    return 'temporaire';
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

  // ProfileJson - Support mobile ET desktop avec vraie structure DB
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

  // Si toujours pas de profil psychologique - Fallback avec style RGB temporaire
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

  // Bio
  const bio = props.profile?.bio;

  // Photo principale
  const getMainPhoto = () => {
    if (photos.length > 0) {
      return photos[currentPhotoIndex]?.photo_url;
    }
    return props.avatar || props.profile?.avatar_url;
  };

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
      },
      // 🌈 STYLE TEMPORAIRE RGB
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

  // ✅ DÉDUIRE LE VRAI STYLE D'ATTACHEMENT
  const deducedAttachmentStyle = deduceAttachmentStyle(profileJson);
  const rarity = getRarity(profileJson.authenticity_score);
  const personalityType = getPersonalityType(deducedAttachmentStyle);
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

  // 🌈 Style CSS pour l'animation RGB CONTOURS SEULEMENT
  const rgbAnimation = `
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
      animation: rgb-border-subtle 12s ease-in-out infinite;
    }
    
    .rgb-border-subtle .card-inner {
      background: inherit;
    }
  `;

  return (
    <div className={`relative ${className}`}>
      <style>{rgbAnimation}</style>
      
      {/* Wrapper avec contour - RGB animé CONTOURS SEULEMENT si temporaire */}
      <div 
        className={`w-80 h-[500px] rounded-[28px] p-2 transition-all duration-500 hover:scale-[1.02] relative shadow-2xl ${
          deducedAttachmentStyle === 'temporaire' ? 'rgb-border-subtle' : ''
        }`}
        style={{
          background: deducedAttachmentStyle === 'temporaire' 
            ? undefined // Utilise l'animation CSS
            : personalityType.borderStyle,
          boxShadow: deducedAttachmentStyle === 'temporaire' 
            ? `0 0 25px rgba(139, 92, 246, 0.3), 0 0 50px rgba(236, 72, 153, 0.2), 0 10px 40px rgba(0, 0, 0, 0.4)`
            : `0 0 30px rgba(${personalityType.shadowColor}, 0.6), 0 10px 40px rgba(0, 0, 0, 0.4)`
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
              
              {/* Bouton type */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowTypeModal(true); }}
                className={`${
                  deducedAttachmentStyle === 'temporaire' 
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500' 
                    : personalityType.color
                } text-white px-2.5 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-1 border border-white/20 flex-shrink-0`}
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

        {/* FACE ARRIÈRE - VRAIES DONNÉES */}
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
                  {deducedAttachmentStyle === 'temporaire' && (
                    <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                      <p className="text-purple-200 text-sm">
                        🌈 <strong>Mode Spectral :</strong> Ce profil attend l'activation de notre IA pour révéler son vrai type psychologique !
                      </p>
                    </div>
                  )}
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-200 text-sm">
                      <strong>Style d'attachement :</strong> {deducedAttachmentStyle} (déduit de l'analyse psychologique)
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ VRAIES FORCES */}
              {profileJson.strength_signals && profileJson.strength_signals.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Forces ({profileJson.strength_signals.length})
                  </h4>
                  <div className="space-y-2">
                    {profileJson.strength_signals.map((strength, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300 text-sm">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ VRAIES FAIBLESSES */}
              {profileJson.weakness_signals && profileJson.weakness_signals.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    Points d'attention ({profileJson.weakness_signals.length})
                  </h4>
                  <div className="space-y-2">
                    {profileJson.weakness_signals.map((weakness, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-orange-400 mt-1 flex-shrink-0">•</span>
                        <p className="text-gray-300 text-sm">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ PATTERNS INCONSCIENTS */}
              {profileJson.unconscious_patterns && profileJson.unconscious_patterns.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-400" />
                    Patterns inconscients ({profileJson.unconscious_patterns.length})
                  </h4>
                  <div className="space-y-2">
                    {profileJson.unconscious_patterns.map((pattern, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                        <p className="text-gray-300 text-sm">{pattern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ PARTENAIRE IDÉAL */}
              {profileJson.ideal_partner_traits && profileJson.ideal_partner_traits.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    Partenaire idéal ({profileJson.ideal_partner_traits.length})
                  </h4>
                  <div className="space-y-2">
                    {profileJson.ideal_partner_traits.map((trait, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-pink-400 mt-1 flex-shrink-0">•</span>
                        <p className="text-gray-300 text-sm">{trait}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ AVERTISSEMENT MIROIR */}
              {profileJson.mirroring_warning && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    Avertissement relationnel
                  </h4>
                  <p className="text-red-200 text-sm leading-relaxed">{profileJson.mirroring_warning}</p>
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
                <div className={`w-12 h-12 rounded-2xl ${
                  deducedAttachmentStyle === 'temporaire' 
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500' 
                    : personalityType.color
                } flex items-center justify-center`}>
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
              {deducedAttachmentStyle === 'temporaire' ? (
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    🌈 <strong>Mode Spectral temporaire</strong> - Ce profil affiche des couleurs RGB en attendant l'activation de notre intelligence artificielle.
                  </p>
                  <p className="text-purple-200 text-xs leading-relaxed">
                    Notre algorithme d'analyse psychologique va bientôt révéler le vrai style d'attachement, les patterns comportementaux et calculer la compatibilité avec votre profil !
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Style d'attachement <strong>{deducedAttachmentStyle}</strong> déduit à partir de l'analyse psychologique complète.
                  </p>
                  <p className="text-blue-200 text-xs leading-relaxed">
                    Ce profil a été analysé par notre IA et révèle des patterns comportementaux authentiques, des forces uniques et des besoins relationnels spécifiques.
                  </p>
                </div>
              )}
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