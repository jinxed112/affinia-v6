import React, { useState, useRef, useEffect } from 'react';
import { Heart, Zap, Shield, Star, Sparkles, Eye, MapPin, User, Calendar, ChevronDown, ChevronRight, FileText, Brain } from 'lucide-react';

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

export const AffiniaCard: React.FC<AffiniaCardProps> = ({ 
  userName: propUserName,
  age: propAge,
  avatar: propAvatar,
  photos = [],
  profileJson: propProfileJson,
  className = "",
  profile,
  questionnaire
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showTypeExplanation, setShowTypeExplanation] = useState(false);
  const activeSectionRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers la section active
  useEffect(() => {
    if (activeSection && activeSectionRef.current) {
      setTimeout(() => {
        activeSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 150);
    }
  }, [activeSection]);

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

  // Extraction automatique des données
  const extractUserData = () => {
    const userName = propUserName || profile?.name || 'Dresseur';
    
    let age = propAge;
    if (!age && questionnaire?.answers) {
      const answers = typeof questionnaire.answers === 'string' 
        ? JSON.parse(questionnaire.answers) 
        : questionnaire.answers;
      age = answers.age || null;
    }
    
    const avatar = propAvatar || profile?.avatar_url;
    
    let profileJson = propProfileJson;
    if (!profileJson && questionnaire) {
      if (questionnaire.profile_json) {
        profileJson = typeof questionnaire.profile_json === 'string'
          ? JSON.parse(questionnaire.profile_json)
          : questionnaire.profile_json;
      } else if (questionnaire.generated_profile) {
        profileJson = convertMobileTextToProfileJson(questionnaire.generated_profile);
      }
    }
    
    const bio = profile?.bio;
    const city = profile?.city;
    const level = profile?.level;
    const xp = profile?.xp;
    
    let gender = null;
    if (questionnaire?.answers) {
      const answers = typeof questionnaire.answers === 'string' 
        ? JSON.parse(questionnaire.answers) 
        : questionnaire.answers;
      gender = answers.gender || null;
    }
    
    return {
      userName, age, avatar, profileJson, bio, city, gender, level, xp
    };
  };

  const userData = extractUserData();

  if (!userData.profileJson) {
    return (
      <div className={`w-80 h-96 bg-gray-200 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <Brain className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Questionnaire requis</p>
          <p className="text-gray-500 text-sm mt-1">Analyse psychologique en attente</p>
        </div>
      </div>
    );
  }

  // Photo sélectionnée ou première
  const getDisplayAvatar = () => {
    if (photos.length > 0) {
      if (selectedPhotoIndex < photos.length) {
        return photos[selectedPhotoIndex].photo_url;
      }
      
      const mainPhotos = photos.filter(photo => photo.is_main === true || photo.is_primary === true);
      
      if (mainPhotos.length > 0) {
        const bestMainPhoto = mainPhotos.reduce((best, current) => {
          const bestOrder = best.photo_order || best.order || 0;
          const currentOrder = current.photo_order || current.order || 0;
          return currentOrder > bestOrder ? current : best;
        });
        return bestMainPhoto.photo_url;
      }
      
      const sortedPhotos = [...photos].sort((a, b) => 
        ((a.photo_order || a.order) || 0) - ((b.photo_order || b.order) || 0)
      );
      return sortedPhotos[0].photo_url;
    }
    
    return userData.avatar;
  };

  // Changer de photo et revenir à l'avant
  const selectPhoto = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsFlipped(false);
    setActiveSection(null);
  };

  // Rareté avec contours et halo
  const getRarity = (score: number) => {
    if (score >= 9) return { 
      name: 'Authentique', 
      textColor: 'text-yellow-200',
      halo: 'rgba(255, 215, 0, 0.4)',
      borderColor: 'border-yellow-400'
    };
    if (score >= 7) return { 
      name: 'Sincère', 
      textColor: 'text-purple-200',
      halo: 'rgba(168, 85, 247, 0.4)',
      borderColor: 'border-purple-400'
    };
    if (score >= 5) return { 
      name: 'Réfléchi', 
      textColor: 'text-blue-200',
      halo: 'rgba(59, 130, 246, 0.4)',
      borderColor: 'border-blue-400'
    };
    return { 
      name: 'En découverte', 
      textColor: 'text-gray-200',
      halo: 'rgba(107, 114, 128, 0.3)',
      borderColor: 'border-gray-400'
    };
  };

  // Types de personnalité avec explications détaillées
  const getPersonalityType = (style: string) => {
    const types = {
      'ambivalent': { 
        name: 'Émotionnel', 
        description: 'Intensité et profondeur émotionnelle',
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-500',
        icon: '💜',
        element: 'Psychique',
        explanation: {
          title: 'Type Psychique - Émotionnel',
          description: 'Tu ressens les émotions avec une intensité particulière et tu cherches des connexions profondes.',
          traits: [
            'Besoin d\'intimité émotionnelle forte',
            'Sensibilité accrue aux signaux relationnels',
            'Recherche de validation et de sécurité affective',
            'Capacité d\'empathie développée'
          ],
          compatibility: 'Idéal avec des personnes rassurantes et communicatives'
        }
      },
      'secure': { 
        name: 'Équilibré', 
        description: 'Stabilité et sécurité relationnelle',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-500',
        icon: '💚',
        element: 'Normal',
        explanation: {
          title: 'Type Normal - Équilibré',
          description: 'Tu as une approche saine et équilibrée des relations, avec une bonne estime de soi.',
          traits: [
            'Confiance en soi et en les autres',
            'Communication ouverte et directe',
            'Gestion émotionnelle stable',
            'Capacité d\'intimité sans dépendance'
          ],
          compatibility: 'Compatible avec la plupart des types de personnalité'
        }
      },
      'avoidant': { 
        name: 'Indépendant', 
        description: 'Autonomie et réflexion personnelle',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500',
        icon: '💙',
        element: 'Glace',
        explanation: {
          title: 'Type Glace - Indépendant',
          description: 'Tu privilégies ton autonomie et as tendance à garder une certaine distance émotionnelle.',
          traits: [
            'Valorisation de l\'indépendance personnelle',
            'Difficulté à exprimer ses émotions',
            'Préférence pour la réflexion solitaire',
            'Besoin d\'espace personnel important'
          ],
          compatibility: 'Fonctionne bien avec des partenaires respectueux de l\'espace personnel'
        }
      },
      'évitant': { 
        name: 'Indépendant', 
        description: 'Autonomie et réflexion personnelle',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500',
        icon: '💙',
        element: 'Glace',
        explanation: {
          title: 'Type Glace - Indépendant',
          description: 'Tu privilégies ton autonomie et as tendance à garder une certaine distance émotionnelle.',
          traits: [
            'Valorisation de l\'indépendance personnelle',
            'Difficulté à exprimer ses émotions',
            'Préférence pour la réflexion solitaire',
            'Besoin d\'espace personnel important'
          ],
          compatibility: 'Fonctionne bien avec des partenaires respectueux de l\'espace personnel'
        }
      },
      'disorganized': { 
        name: 'Complexe', 
        description: 'Richesse et nuances de personnalité',
        color: 'from-indigo-500 to-purple-500',
        bgColor: 'bg-indigo-500',
        icon: '🧡',
        element: 'Ténèbres',
        explanation: {
          title: 'Type Ténèbres - Complexe',
          description: 'Tu as une personnalité riche et nuancée, avec des besoins relationnels variables.',
          traits: [
            'Comportements relationnels variables',
            'Mélange de besoin d\'intimité et de distance',
            'Richesse émotionnelle complexe',
            'Adaptabilité selon les situations'
          ],
          compatibility: 'Nécessite des partenaires patients et compréhensifs'
        }
      }
    };
    return types[style as keyof typeof types] || types['avoidant'];
  };

  const rarity = getRarity(userData.profileJson.authenticity_score);
  const personalityType = getPersonalityType(userData.profileJson.attachment_style);
  const displayAvatar = getDisplayAvatar();

  // Sections accordion
  const accordionSections = [
    {
      id: 'personal',
      icon: User,
      title: 'Identité',
      emoji: '👤',
      gradient: 'from-indigo-500 to-blue-500',
      hasContent: !!(userData.age || userData.gender || userData.city || userData.level),
      content: (
        <div className="space-y-3">
          <div className="flex gap-2">
            {userData.age && (
              <div className="flex items-center gap-1 bg-blue-500/20 rounded-lg px-3 py-2 flex-1 border border-blue-500/30">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-blue-200 text-sm font-medium">{userData.age} ans</span>
              </div>
            )}
            {userData.gender && (
              <div className="flex items-center gap-1 bg-purple-500/20 rounded-lg px-3 py-2 flex-1 border border-purple-500/30">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-purple-200 text-sm font-medium capitalize">{userData.gender}</span>
              </div>
            )}
          </div>
          {userData.city && (
            <div className="flex items-center gap-2 bg-green-500/20 rounded-lg p-3 border border-green-500/30">
              <MapPin className="w-5 h-5 text-green-400" />
              <span className="text-green-200 font-medium">{userData.city}</span>
            </div>
          )}
          {userData.level && (
            <div className="flex items-center gap-2 bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200 font-medium">Niveau {userData.level}</span>
              {userData.xp && (
                <span className="text-yellow-300 text-sm">({userData.xp} XP)</span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'personality',
      icon: Brain,
      title: 'Psyché Profonde',
      emoji: personalityType.icon,
      gradient: personalityType.color,
      hasContent: true,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-4xl mb-2 block">{personalityType.icon}</span>
            <h4 className="font-bold text-white mb-1">{personalityType.name}</h4>
            <p className="text-sm text-gray-300 mb-2">{personalityType.description}</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${personalityType.bgColor} text-white`}>
              <span className="text-sm font-medium">Type {personalityType.element}</span>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <h5 className="text-sm font-semibold text-white mb-2">Profil Cognitif</h5>
            <div className="space-y-1">
              <p className="text-sm text-gray-300 capitalize">
                <span className="text-white font-medium">Style:</span> {userData.profileJson.cognitive_signals?.thinking_style}
              </p>
              <p className="text-sm text-gray-300 capitalize">
                <span className="text-white font-medium">Expression:</span> {userData.profileJson.affective_indicators?.emotion_expression}
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-white font-medium">Complexité:</span> {userData.profileJson.cognitive_signals?.complexity}
              </p>
            </div>
          </div>

          {userData.profileJson.unconscious_patterns && userData.profileJson.unconscious_patterns.length > 0 && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <h5 className="text-sm font-semibold text-white mb-2">Patterns Inconscients</h5>
              <div className="space-y-1">
                {userData.profileJson.unconscious_patterns.slice(0, 2).map((pattern, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-purple-400 text-xs mt-0.5">🌀</span>
                    <p className="text-gray-300 text-xs">{pattern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'bio',
      icon: FileText,
      title: 'À propos',
      emoji: '📝',
      gradient: 'from-emerald-500 to-teal-500',
      hasContent: !!userData.bio,
      content: userData.bio ? (
        <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
          <div className="text-center mb-3">
            <span className="text-2xl">🌱</span>
          </div>
          <p className="text-emerald-200 text-sm leading-relaxed text-center italic">
            "{userData.bio}"
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-sm text-center py-4">À découvrir en discutant ensemble...</p>
      )
    },
    {
      id: 'strengths',
      icon: Star,
      title: 'Forces Dominantes',
      emoji: '✨',
      gradient: 'from-yellow-500 to-orange-500',
      hasContent: userData.profileJson.strength_signals?.length > 0,
      content: userData.profileJson.strength_signals?.length > 0 ? (
        <div className="space-y-3">
          <div className="text-center mb-4">
            <span className="text-2xl">✨</span>
            <p className="text-sm font-medium text-yellow-300 mt-1">Rayonnement naturel</p>
          </div>
          {userData.profileJson.strength_signals.slice(0, 4).map((strength, index) => (
            <div key={index} className="bg-yellow-500/10 rounded-lg p-3 border-l-3 border-yellow-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <p className="text-yellow-200 text-sm font-medium">{strength}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm text-center py-4">Forces en cours d'analyse...</p>
      )
    },
    {
      id: 'vulnerabilities',
      icon: Shield,
      title: 'Zones Sensibles',
      emoji: '🛡️',
      gradient: 'from-gray-500 to-slate-500',
      hasContent: userData.profileJson.weakness_signals?.length > 0,
      content: userData.profileJson.weakness_signals?.length > 0 ? (
        <div className="space-y-3">
          <div className="text-center mb-4">
            <span className="text-2xl">💧</span>
            <p className="text-sm font-medium text-slate-300 mt-1">Vulnérabilité comme force</p>
          </div>
          {userData.profileJson.weakness_signals.slice(0, 3).map((weakness, index) => (
            <div key={index} className="bg-slate-500/10 rounded-lg p-3 border-l-3 border-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <p className="text-slate-200 text-sm font-medium">{weakness}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="text-2xl">🛡️</span>
          <p className="text-gray-400 text-sm mt-2">Armure émotionnelle solide</p>
        </div>
      )
    },
    {
      id: 'seeking',
      icon: Heart,
      title: 'Âme Sœur Révélée',
      emoji: '💕',
      gradient: 'from-pink-500 to-rose-500',
      hasContent: userData.profileJson.ideal_partner_traits?.length > 0,
      content: userData.profileJson.ideal_partner_traits?.length > 0 ? (
        <div className="space-y-3">
          <div className="text-center mb-4">
            <span className="text-2xl">🔮</span>
            <p className="text-sm font-medium text-pink-300 mt-1">Destinée relationnelle</p>
          </div>
          {userData.profileJson.ideal_partner_traits.slice(0, 4).map((trait, index) => (
            <div key={index} className="bg-pink-500/10 rounded-lg p-3 text-center border border-pink-500/20">
              <div className="flex items-center justify-center gap-2">
                <span className="text-pink-400">💫</span>
                <span className="text-pink-200 text-sm font-medium">{trait}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="text-2xl">🌸</span>
          <p className="text-gray-400 text-sm mt-2">Destinée en cours d'écriture...</p>
        </div>
      )
    },
    {
      id: 'photos',
      icon: Eye,
      title: 'Galerie Visuelle',
      emoji: '📸',
      gradient: 'from-amber-500 to-orange-500',
      hasContent: photos.length > 0,
      content: photos.length > 0 ? (
        <div className="space-y-4">
          <div className="text-center mb-3">
            <span className="text-2xl">📷</span>
            <p className="text-sm font-medium text-amber-300 mt-1">
              {photos.length} moment{photos.length > 1 ? 's' : ''} capturé{photos.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`p-0.5 rounded-lg transition-all duration-200 hover:scale-105 ${
                  index === selectedPhotoIndex 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                    : 'bg-gradient-to-r from-amber-500/40 to-orange-500/40 hover:from-amber-400/80 hover:to-orange-500/80'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectPhoto(index);
                  }}
                  className="relative aspect-square rounded-md overflow-hidden w-full bg-black"
                >
                  <img 
                    src={photo.photo_url} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === selectedPhotoIndex && (
                    <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-amber-100" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 w-4 h-4 bg-black/80 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-amber-200/80">
              Photo principale : #{selectedPhotoIndex + 1}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="text-2xl">📱</span>
          <p className="text-gray-400 text-sm mt-2">Souvenirs à immortaliser...</p>
        </div>
      )
    }
  ];

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Carte avec vrai bord propre et halo */}
      <div 
        className={`w-80 h-[520px] rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 relative bg-black border-2 ${rarity.borderColor}`}
        style={{
          filter: `drop-shadow(0 0 15px ${rarity.halo})`
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        
        {/* FACE AVANT - PHOTO PURE */}
        {!isFlipped && (
          <div className="w-full h-full rounded-2xl overflow-hidden relative">
            
            {/* Photo principale FULL SIZE */}
            <div className="absolute inset-0 w-full h-full">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt={userData.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <span className="text-8xl opacity-70 text-white">{personalityType.icon}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
            </div>

            {/* Contenu par-dessus la photo */}
            <div className="absolute inset-0 flex flex-col p-4 text-white">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20 max-w-[200px]">
                  <h2 className="text-lg font-bold text-white drop-shadow-lg truncate">
                    {userData.userName}
                  </h2>
                  {userData.age && (
                    <p className="text-white/90 text-sm truncate">
                      {userData.age} ans{userData.city ? ` • ${userData.city}` : ''}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTypeExplanation(true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${personalityType.bgColor} text-white shadow-lg flex-shrink-0 hover:scale-105 transition-transform duration-200`}
                >
                  <span className="text-sm">{personalityType.icon}</span>
                  <span className="text-xs font-bold">{personalityType.element}</span>
                </button>
              </div>

              {/* Indicateur photos - Position différente pour éviter le conflit */}
              {photos.length > 1 && (
                <div className="absolute top-16 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/30 flex items-center gap-1 z-20">
                  <Eye className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-bold">
                    {selectedPhotoIndex + 1}/{photos.length}
                  </span>
                </div>
              )}

              <div className="flex-1"></div>

              {/* Forces dominantes */}
              {userData.profileJson.strength_signals?.length > 0 && (
                <div className="mb-3">
                  <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
                    <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Forces Dominantes
                    </h3>
                    <div className="space-y-1">
                      {userData.profileJson.strength_signals.slice(0, 2).map((strength, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></div>
                          <p className="text-white/90 text-xs truncate">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer avec score */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20">
                  <span className={`font-bold ${rarity.textColor}`}>{rarity.name}</span>
                  <span className="text-white/50">•</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{userData.profileJson.authenticity_score}/10</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.ceil(userData.profileJson.authenticity_score/2) ? 'text-yellow-300 fill-current' : 'text-white/40'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Icône info */}
              <div className="absolute bottom-4 right-4 z-20">
                <div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full border border-white/30 flex items-center justify-center">
                  <span className="text-white text-sm">ℹ️</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FACE ARRIÈRE - ACCORDION OPTIMISÉ */}
        {isFlipped && (
          <div className="w-full h-full rounded-2xl bg-slate-900/95 backdrop-blur-xl overflow-hidden">
            <div className="p-3 h-full flex flex-col text-white">
              
              {/* Header retour */}
              <div className="flex justify-between items-center mb-3 flex-shrink-0">
                <h3 className="text-base font-bold text-white truncate flex-1">Découvrir {userData.userName}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
                >
                  <span className="text-gray-400">Retour</span>
                  <span className="text-white">↩️</span>
                </button>
              </div>

              {/* Accordion Sections */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="space-y-2 pr-1">
                  {accordionSections.map((section) => (
                    <div 
                      key={section.id} 
                      className="border border-gray-700 rounded-lg overflow-hidden"
                      ref={activeSection === section.id ? activeSectionRef : null}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection(section.id);
                        }}
                        className="w-full flex items-center justify-between p-2.5 bg-gray-800/50 hover:bg-gray-800/70 transition-colors duration-200 group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${section.gradient} text-white transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                            <section.icon className="w-3 h-3" />
                          </div>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm flex-shrink-0">{section.emoji}</span>
                            <span className={`text-xs font-medium truncate ${
                              section.hasContent ? 'text-white' : 'text-gray-400'
                            }`}>
                              {section.title}
                            </span>
                          </div>
                          {section.hasContent && (
                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${section.gradient} animate-pulse flex-shrink-0`}></div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {activeSection === section.id ? (
                            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
                          )}
                        </div>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${
                        activeSection === section.id ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div 
                          className="p-2.5 bg-gray-900/30 overflow-y-auto max-h-40"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {section.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-2 pt-2 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  👆 Cliquez pour revenir à la photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'explication du type de personnalité - AMÉLIORÉ */}
        {showTypeExplanation && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-gray-700 p-5 max-w-sm w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              
              {/* Header avec icône et titre */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${personalityType.bgColor} flex items-center justify-center shadow-lg`}>
                    <span className="text-xl">{personalityType.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      Type {personalityType.element}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {personalityType.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTypeExplanation(false);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Description principale */}
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {personalityType.explanation.description}
                  </p>
                </div>

                {/* Caractéristiques principales */}
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Caractéristiques principales
                  </h4>
                  <div className="space-y-2">
                    {personalityType.explanation.traits.map((trait, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-800/30">
                        <span className="text-purple-400 mt-1 flex-shrink-0">•</span>
                        <span className="text-gray-300 text-sm leading-relaxed">{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compatibilité */}
                <div className={`rounded-lg p-4 border-2 ${personalityType.bgColor}/10 border-current/20`}>
                  <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                    <span className="text-lg">💕</span>
                    Compatibilité
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {personalityType.explanation.compatibility}
                  </p>
                </div>

                {/* Bouton de fermeture */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTypeExplanation(false);
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg"
                >
                  Compris ! 👍
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};