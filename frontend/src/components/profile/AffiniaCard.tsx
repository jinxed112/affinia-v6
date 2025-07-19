import React, { useState } from 'react';
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
  [key: string]: any;
}

interface Questionnaire {
  answers?: any;
  profile_json?: any;
  [key: string]: any;
}

interface AffiniaCardProps {
  // Props principales (compatibilité avec usage existant)
  userName?: string;
  age?: number;
  avatar?: string;
  photos?: ProfilePhoto[];
  profileJson?: ProfileJson;
  className?: string;
  
  // 🆕 Props pour extraction automatique (optionnelles)
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
  
  // Nouveaux props pour extraction automatique
  profile,
  questionnaire
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 🔧 Extraction automatique des données depuis profile et questionnaire
  const extractUserData = () => {
    console.log('🔍 AffiniaCard - Debug extraction:', {
      profile: profile,
      questionnaire: questionnaire,
      propUserName,
      propAge,
      propAvatar,
      propProfileJson
    });

    // Nom : prop > profile.name > fallback
    const userName = propUserName || profile?.name || 'Dresseur';
    
    // Âge : prop > questionnaire.answers.age
    let age = propAge;
    if (!age && questionnaire?.answers) {
      const answers = typeof questionnaire.answers === 'string' 
        ? JSON.parse(questionnaire.answers) 
        : questionnaire.answers;
      age = answers.age || null;
      console.log('🎯 Age extrait du questionnaire:', age, 'depuis:', answers);
    }
    
    // Avatar : prop > profile.avatar_url
    const avatar = propAvatar || profile?.avatar_url;
    
    // ProfileJson : prop > questionnaire.profile_json
    let profileJson = propProfileJson;
    if (!profileJson && questionnaire?.profile_json) {
      profileJson = typeof questionnaire.profile_json === 'string'
        ? JSON.parse(questionnaire.profile_json)
        : questionnaire.profile_json;
      console.log('🎯 ProfileJson extrait:', profileJson);
    }
    
    // Bio : profile.bio
    const bio = profile?.bio;
    
    // City : profile.city
    const city = profile?.city;
    
    // Genre : questionnaire.answers.gender
    let gender = null;
    if (questionnaire?.answers) {
      const answers = typeof questionnaire.answers === 'string' 
        ? JSON.parse(questionnaire.answers) 
        : questionnaire.answers;
      gender = answers.gender || null;
      console.log('🎯 Genre extrait:', gender, 'depuis:', answers);
    }
    
    const extractedData = {
      userName,
      age,
      avatar,
      profileJson,
      bio,
      city,
      gender
    };

    console.log('✅ Données extraites finales:', extractedData);
    
    return extractedData;
  };

  const userData = extractUserData();

  // 🆕 LOG DEMANDÉ
  console.log('🎴 AffiniaCard - Rendu avec:', {
    isFlipped,
    hasProfileJson: !!userData.profileJson,
    userData: userData
  });

  // Si pas de profileJson, on ne peut pas afficher la carte
  if (!userData.profileJson) {
    return (
      <div className={`w-80 h-96 bg-gray-200 rounded-2xl flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Questionnaire requis</p>
      </div>
    );
  }

  // Utiliser la première photo comme avatar, avec fallback
  const getDisplayAvatar = () => {
    if (photos.length > 0) {
      // Chercher toutes les photos principales
      const mainPhotos = photos.filter(photo => photo.is_main === true || photo.is_primary === true);
      
      if (mainPhotos.length > 0) {
        // Si plusieurs photos principales, prendre celle avec le photo_order le plus élevé
        const bestMainPhoto = mainPhotos.reduce((best, current) => {
          const bestOrder = best.photo_order || best.order || 0;
          const currentOrder = current.photo_order || current.order || 0;
          return currentOrder > bestOrder ? current : best;
        });
        
        return bestMainPhoto.photo_url;
      }
      
      // Sinon, prendre la première photo triée par ordre
      const sortedPhotos = [...photos].sort((a, b) => 
        ((a.photo_order || a.order) || 0) - ((b.photo_order || b.order) || 0)
      );
      return sortedPhotos[0].photo_url;
    }
    
    return userData.avatar;
  };

  const displayAvatar = getDisplayAvatar();

  // Calculer la rareté basée sur authenticity_score
  const getRarity = (score: number) => {
    if (score >= 9) return { name: 'Légendaire', color: 'from-yellow-400 to-orange-500', glow: 'shadow-[0_0_30px_rgba(255,215,0,0.8)]' };
    if (score >= 7) return { name: 'Rare', color: 'from-purple-400 to-pink-500', glow: 'shadow-[0_0_25px_rgba(168,85,247,0.6)]' };
    if (score >= 5) return { name: 'Peu Commune', color: 'from-blue-400 to-cyan-500', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]' };
    return { name: 'Commune', color: 'from-gray-400 to-gray-600', glow: 'shadow-[0_0_15px_rgba(107,114,128,0.4)]' };
  };

  // Mapper attachment_style vers type Pokémon
  const getTypeInfo = (style: string) => {
    const types = {
      'ambivalent': { name: 'Psychique', icon: '🔮', color: 'bg-purple-500' },
      'secure': { name: 'Normal', icon: '⭐', color: 'bg-gray-500' },
      'avoidant': { name: 'Glace', icon: '❄️', color: 'bg-blue-500' },
      'disorganized': { name: 'Ténèbres', icon: '🌙', color: 'bg-gray-800' }
    };
    return types[style as keyof typeof types] || types['ambivalent'];
  };

  const rarity = getRarity(userData.profileJson.authenticity_score);
  const typeInfo = getTypeInfo(userData.profileJson.attachment_style);
  const mainStrengths = userData.profileJson.strength_signals.slice(0, 3);
  const mainRisks = userData.profileJson.weakness_signals.slice(0, 2);

  // 🎯 SECTIONS ACCORDION - STYLE MIROIR PAGE
  const accordionSections = [
    {
      id: 'personal',
      icon: User,
      title: 'Infos personnelles',
      emoji: '👤',
      gradient: 'from-indigo-500 to-blue-500',
      hasContent: !!(userData.age || userData.gender),
      content: (
        <div className="space-y-3">
          <div className="flex gap-2">
            {userData.age && (
              <div className="flex items-center gap-1 bg-blue-500/20 rounded-lg px-2 py-1 flex-1 border border-blue-500/30">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span className="text-blue-200 text-xs font-medium">{userData.age} ans</span>
              </div>
            )}
            {userData.gender && (
              <div className="flex items-center gap-1 bg-purple-500/20 rounded-lg px-2 py-1 flex-1 border border-purple-500/30">
                <User className="w-3 h-3 text-purple-400" />
                <span className="text-purple-200 text-xs font-medium capitalize">{userData.gender}</span>
              </div>
            )}
          </div>
          {userData.city && (
            <div className="flex items-center gap-2 bg-green-500/20 rounded-lg p-2 border border-green-500/30">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-green-200 text-sm font-medium">{userData.city}</span>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'strengths',
      icon: Star,
      title: 'Forces Dominantes',
      emoji: '⭐',
      gradient: 'from-blue-500 to-cyan-500',
      hasContent: userData.profileJson.strength_signals?.length > 0,
      content: userData.profileJson.strength_signals?.length > 0 ? (
        <div className="space-y-2">
          <div className="text-center mb-3">
            <span className="text-2xl">✨</span>
            <p className="text-xs font-medium text-cyan-300">Rayonnement naturel</p>
          </div>
          {userData.profileJson.strength_signals.slice(0, 3).map((strength, index) => (
            <div key={index} className="bg-cyan-500/10 rounded-lg p-2 border-l-2 border-cyan-400">
              <p className="text-cyan-200 text-xs">• {strength}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Forces en cours d'analyse...</p>
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
        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
          <div className="text-center mb-2">
            <span className="text-lg">🌱</span>
          </div>
          <p className="text-emerald-200 text-xs leading-relaxed text-center italic">
            "{userData.bio}"
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Expression personnelle à venir...</p>
      )
    },
    {
      id: 'psychology',
      icon: Brain,
      title: 'Patterns Inconscients',
      emoji: '🧠',
      gradient: 'from-purple-500 to-violet-500',
      hasContent: true,
      content: (
        <div className="space-y-3">
          <div className="text-center mb-3">
            <span className="text-2xl">🔮</span>
            <p className="text-xs font-medium text-violet-300">Psyché profonde</p>
          </div>
          
          <div className="bg-violet-500/10 rounded-lg p-3 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${typeInfo.color.replace('bg-', 'bg-')}`}></div>
              <span className="text-violet-200 text-xs font-medium capitalize">{userData.profileJson.attachment_style}</span>
            </div>
            <p className="text-violet-300 text-xs">
              {userData.profileJson.cognitive_signals?.complexity}
            </p>
            <p className="text-violet-300 text-xs mt-1">
              Style: {userData.profileJson.cognitive_signals?.thinking_style}
            </p>
          </div>
          
          {userData.profileJson.unconscious_patterns && userData.profileJson.unconscious_patterns.length > 0 && (
            <div className="space-y-1">
              {userData.profileJson.unconscious_patterns.slice(0, 2).map((pattern, index) => (
                <div key={index} className="bg-violet-500/5 rounded p-2 border-l-2 border-violet-400">
                  <p className="text-violet-200 text-xs">🌀 {pattern}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'seeking',
      icon: Heart,
      title: 'Prophétie Relationnelle',
      emoji: '💫',
      gradient: 'from-pink-500 to-rose-500',
      hasContent: userData.profileJson.ideal_partner_traits?.length > 0,
      content: userData.profileJson.ideal_partner_traits?.length > 0 ? (
        <div className="bg-pink-500/10 rounded-lg p-3 border-dashed border-pink-500/30">
          <div className="text-center mb-3">
            <span className="text-2xl">🔮</span>
            <p className="text-xs font-medium text-pink-300">Âme sœur révélée</p>
          </div>
          <div className="space-y-2">
            {userData.profileJson.ideal_partner_traits.slice(0, 3).map((trait, index) => (
              <div key={index} className="bg-rose-500/10 rounded-lg p-2 text-center border border-rose-500/20">
                <span className="text-rose-200 text-xs">✨ {trait}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-2xl">🌙</span>
          <p className="text-gray-400 text-sm mt-1">Destinée en cours d'écriture...</p>
        </div>
      )
    },
    {
      id: 'vulnerabilities',
      icon: Shield,
      title: 'Zones Sensibles',
      emoji: '🌧️',
      gradient: 'from-gray-500 to-slate-500',
      hasContent: mainRisks.length > 0,
      content: mainRisks.length > 0 ? (
        <div className="space-y-2">
          <div className="text-center mb-3">
            <span className="text-2xl">💧</span>
            <p className="text-xs font-medium text-slate-300">Vulnérabilité comme force</p>
          </div>
          {mainRisks.map((risk, index) => (
            <div key={index} className="bg-slate-500/10 rounded-lg p-2 border-l-2 border-slate-400">
              <p className="text-slate-200 text-xs">🌙 {risk}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <span className="text-2xl">🛡️</span>
          <p className="text-gray-400 text-sm mt-1">Armure émotionnelle solide</p>
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
        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
          <div className="text-center mb-2">
            <span className="text-xl">📷</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-amber-200 text-xs font-medium">
              {photos.length} moment{photos.length > 1 ? 's' : ''} capturé{photos.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-amber-300 text-xs">Actif</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-2xl">📱</span>
          <p className="text-gray-400 text-sm mt-1">Souvenirs à immortaliser</p>
        </div>
      )
    }
  ];

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Carte principale avec effet 3D */}
      <div 
        className={`
          relative w-80 min-h-[480px] bg-gradient-to-br ${rarity.color} 
          rounded-2xl ${rarity.glow} transition-all duration-500 cursor-pointer
          hover:scale-105 hover:rotate-1
        `}
        onClick={() => {
          console.log('🎴 Clic sur carte - isFlipped avant:', isFlipped);
          setIsFlipped(!isFlipped);
          console.log('🎴 Clic sur carte - isFlipped après:', !isFlipped);
        }}
        style={{ 
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Face avant */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)'
          }}
        >
          {/* Bord décoratif autour de la carte */}
          <div className="absolute inset-2 rounded-xl overflow-hidden">
            {/* Photo principale en arrière-plan */}
            {displayAvatar ? (
              <img 
                src={displayAvatar} 
                alt={userData.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                <span className="text-8xl opacity-50">{typeInfo.icon}</span>
              </div>
            )}
            {/* Overlay très léger */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15"></div>
          </div>

          {/* Pattern géométrique discret */}
          <div className="absolute inset-2 opacity-3 rounded-xl overflow-hidden">
            <div className="absolute top-3 left-3 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute top-6 right-6 w-4 h-4 border border-white transform rotate-45"></div>
          </div>

          {/* Contenu très compact */}
          <div className="relative z-10 p-3 flex flex-col h-full">
            {/* Header mini */}
            <div className="relative z-10">
              <div className="bg-black/20 backdrop-blur-sm rounded px-2 py-1 border border-white/5 inline-block">
                <div className="flex items-center gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white drop-shadow-lg">{userData.userName}</h2>
                    {userData.age && <p className="text-white/90 text-xs">{userData.age} ans</p>}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${typeInfo.color} text-white`}>
                    <span className="text-xs">{typeInfo.icon}</span>
                    <span className="text-xs font-bold">{rarity.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone photo libre maximale */}
            <div className="flex-1 relative">
              {/* Éléments décoratifs minimes */}
              <div className="absolute top-2 right-1 z-20">
                <Sparkles className="w-3 h-3 text-white animate-pulse drop-shadow-lg" />
              </div>
            </div>

            {/* Infos minimales en bas */}
            <div className="relative z-10 space-y-1">
              {/* Forces ultra-compactes */}
              <div className="bg-black/20 backdrop-blur-sm rounded px-2 py-1 border border-white/5">
                <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  Forces
                </h3>
                <div className="space-y-0.5">
                  {mainStrengths.slice(0, 2).map((strength, index) => (
                    <p key={index} className="text-white text-xs opacity-90 truncate">• {strength}</p>
                  ))}
                </div>
              </div>

              {/* Score mini */}
              <div className="bg-black/20 backdrop-blur-sm rounded px-2 py-1 border border-white/5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-white/80 text-xs">Authenticité</span>
                  <span className="text-sm font-bold text-white">{userData.profileJson.authenticity_score}/10</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-2 h-2 ${i < Math.ceil(userData.profileJson.authenticity_score/2) ? 'text-yellow-300 fill-current' : 'text-white/20'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Indicateur de photos */}
            {photos.length > 0 && (
              <div className="absolute bottom-4 right-4 z-20 w-6 h-6 bg-green-500/80 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center">
                <Eye className="w-3 h-3 text-white drop-shadow-lg" />
              </div>
            )}
          </div>
        </div>

        {/* Face arrière - ACCORDION */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900/95 backdrop-blur-xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="p-4 h-full flex flex-col text-white overflow-y-auto">
            {/* Header - CLIQUABLE POUR RETOURNER */}
            <div 
              className="flex justify-between items-center mb-4 flex-shrink-0 cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => setIsFlipped(false)}
            >
              <h3 className="text-lg font-bold text-white">À propos de {userData.userName}</h3>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400">Retourner</div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <span className="text-white text-sm">↩️</span>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div 
              className="space-y-2 flex-1"
              onClick={(e) => e.stopPropagation()} // Empêche le flip seulement sur les accordions
            >
              {accordionSections.map((section) => (
                <div key={section.id} className="border border-gray-700 rounded-lg overflow-hidden">
                  {/* Header de section - STYLE MIROIR */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(section.id);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800/70 transition-colors duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-r ${section.gradient} text-white transform group-hover:scale-110 transition-transform duration-300`}>
                        <section.icon className="w-3 h-3" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{section.emoji}</span>
                        <span className={`text-sm font-medium ${
                          section.hasContent ? 'text-white' : 'text-gray-400'
                        }`}>
                          {section.title}
                        </span>
                      </div>
                      {section.hasContent && (
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${section.gradient} animate-pulse`}></div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {activeSection === section.id ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </button>
                  
                  {/* Contenu de section */}
                  <div className={`overflow-hidden transition-all duration-300 ${
                    activeSection === section.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="p-3 bg-gray-900/30">
                      {section.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer info - CLIQUABLE POUR RETOURNER */}
            <div 
              className="text-center mt-4 pt-3 border-t border-gray-700 flex-shrink-0 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors"
              onClick={() => setIsFlipped(false)}
            >
              <p className="text-xs text-gray-400 hover:text-white transition-colors">
                👆 Cliquez ici ou sur le header pour retourner la carte
              </p>
            </div>
          </div>
        </div>

        {/* Effet de brillance au hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
      </div>

      {/* Ombre portée */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
};