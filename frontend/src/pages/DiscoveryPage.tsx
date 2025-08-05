// =============================================
// PAGE DÉCOUVERTE - Mobile-First Interactive
// =============================================

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Heart, Lock, Unlock, Users, 
  Loader, RefreshCw, AlertCircle, Eye, Calendar, Sparkles,
  MessageCircle, Star, X, ChevronLeft, ChevronRight, RotateCcw,
  Zap, Brain, Target, Info, Camera, Globe
} from 'lucide-react';

interface DiscoveryPageProps {
  isDarkMode: boolean;
}

// Types simulés
interface DiscoveryProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  city: string;
  bio: string;
  distance_km: number;
  avatar_url: string | null;
  photos: Array<{
    id: string;
    photo_url: string;
    is_main: boolean;
    photo_order: number;
  }>;
  mirror_visibility: 'public' | 'on_request';
  interaction_status: {
    can_request_mirror: boolean;
    mirror_request_status: 'none' | 'pending' | 'accepted' | 'rejected';
  };
  questionnaire_snippet: {
    authenticity_score: number;
    attachment_style: 'secure' | 'anxious' | 'avoidant';
    strength_signals: string[];
  };
  created_at: string;
  last_active: string;
}

interface DiscoveryFilters {
  gender: 'all' | 'male' | 'female' | 'other';
  min_age: number;
  max_age: number;
  max_distance_km: number;
  sort_by: 'distance' | 'age' | 'newest' | 'random';
  limit: number;
  offset: number;
}

// Composants simulés
const BaseComponents = {
  MysticalBackground: ({ isDarkMode, intensity }) => (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 opacity-50" />
  )
};

const AffiniaCard = ({ photos, profile, questionnaire, className = "" }) => (
  <div className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white ${className}`}>
    <div className="aspect-[4/5] bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-3 overflow-hidden">
      {photos && photos[0] ? (
        <img 
          src={photos[0].photo_url} 
          alt={profile.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-12 h-12 text-white/50" />
        </div>
      )}
    </div>
    <h3 className="font-bold text-lg">{profile.name}</h3>
    <p className="text-sm text-white/80 truncate">{profile.bio}</p>
    <div className="flex items-center gap-2 mt-2">
      <Star className="w-4 h-4" />
      <span className="text-sm">{questionnaire?.profile_json?.authenticity_score || 7}/10</span>
    </div>
  </div>
);

// Hooks simulés
const useDesignSystem = (isDarkMode: boolean) => ({
  getTextClasses: (variant: string) => {
    const classes = {
      primary: isDarkMode ? 'text-white' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode ? 'text-gray-400' : 'text-gray-500'
    };
    return classes[variant] || classes.primary;
  },
  getBgClasses: (variant: string) => isDarkMode ? 'bg-slate-950' : 'bg-white'
});

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ isDarkMode }) => {
  // Simulation des hooks
  const navigate = (path: string) => console.log(`Navigation vers: ${path}`);
  const user = { id: 'user123', name: 'Test User' };
  const designSystem = useDesignSystem(isDarkMode);

  // États principaux
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // États de l'interface mobile
  const [selectedProfile, setSelectedProfile] = useState<DiscoveryProfile | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // États des filtres
  const [filters, setFilters] = useState<DiscoveryFilters>({
    gender: 'all',
    min_age: 18,
    max_age: 99,
    max_distance_km: 50,
    sort_by: 'distance',
    limit: 30,
    offset: 0
  });

  // États des interactions
  const [requestingMirror, setRequestingMirror] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Charger les profils
  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user, filters]);

  const loadProfiles = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      }

      const currentFilters = loadMore 
        ? { ...filters, offset: profiles.length }
        : { ...filters, offset: 0 };

      // Simulation de données pour la démo
      const mockProfiles: DiscoveryProfile[] = Array.from({ length: 20 }, (_, i) => ({
        id: `user_${i + 1}`,
        name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'][i % 8],
        age: 22 + (i % 15),
        gender: ['female', 'male', 'other'][i % 3] as any,
        city: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'][i % 5],
        bio: `Passionné${i % 2 === 0 ? 'e' : ''} de découvertes et d'authenticité. J'aime les rencontres sincères et les conversations profondes.`,
        distance_km: 5 + (i % 45),
        avatar_url: null,
        photos: [
          {
            id: `photo_${i}_1`,
            photo_url: `https://picsum.photos/300/400?random=${i}`,
            is_main: true,
            photo_order: 0
          }
        ],
        mirror_visibility: i % 3 === 0 ? 'public' : 'on_request',
        interaction_status: {
          can_request_mirror: i % 4 !== 0,
          mirror_request_status: i % 5 === 0 ? 'pending' : i % 7 === 0 ? 'accepted' : 'none'
        },
        questionnaire_snippet: {
          authenticity_score: 6 + (i % 4),
          attachment_style: ['secure', 'anxious', 'avoidant'][i % 3] as any,
          strength_signals: [
            'Communication claire',
            'Empathie naturelle',
            'Créativité'
          ]
        },
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      }));

      if (loadMore) {
        setProfiles(prev => [...prev, ...mockProfiles]);
      } else {
        setProfiles(mockProfiles);
      }

      setHasMore(mockProfiles.length === 20);

    } catch (err) {
      console.error('❌ Erreur chargement profils:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des interactions avec les cartes
  const handleCardClick = (profile: DiscoveryProfile) => {
    if (selectedProfile?.id === profile.id && showFullscreen) {
      // Deuxième clic : flip la carte
      setIsFlipped(!isFlipped);
    } else {
      // Premier clic : ouvrir en fullscreen
      setSelectedProfile(profile);
      setShowFullscreen(true);
      setIsFlipped(false);
    }
  };

  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
    setSelectedProfile(null);
    setIsFlipped(false);
  };

  const handleMirrorRequest = async (profileId: string) => {
    try {
      setRequestingMirror(profileId);
      
      // Simulation de la requête
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showActionMessage('success', 'Demande envoyée avec succès !');
      
      setProfiles(prev => 
        prev.map(p => 
          p.id === profileId 
            ? { 
                ...p, 
                interaction_status: {
                  ...p.interaction_status,
                  mirror_request_status: 'pending',
                  can_request_mirror: false
                }
              }
            : p
        )
      );

    } catch (err) {
      showActionMessage('error', 'Erreur lors de la demande');
    } finally {
      setRequestingMirror(null);
    }
  };

  const handleViewMirror = (profileId: string) => {
    console.log(`Navigation vers /miroir/${profileId}`);
  };

  const showActionMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProfiles(true);
    }
  };

  // Transformation des données pour AffiniaCard
  const transformProfileForCard = (profile: DiscoveryProfile) => {
    const profileData = {
      id: profile.id,
      name: profile.name,
      bio: profile.bio,
      city: profile.city,
      avatar_url: profile.avatar_url
    };

    const questionnaireData = {
      answers: { age: profile.age, gender: profile.gender },
      profile_json: {
        authenticity_score: profile.questionnaire_snippet?.authenticity_score || 7,
        attachment_style: profile.questionnaire_snippet?.attachment_style || 'secure',
        strength_signals: profile.questionnaire_snippet?.strength_signals || ['Mystérieux', 'Authentique'],
        weakness_signals: ['Points à découvrir'],
        unconscious_patterns: [],
        ideal_partner_traits: [],
        reliability_score: 0.75,
        affective_indicators: { emotion_expression: 'modérée', defense_mechanisms: [] },
        cognitive_signals: { language_level: 'élevé', thinking_style: 'analytique', complexity: 'moyenne' }
      }
    };

    const photosData = profile.photos.map((photo, index) => ({
      id: photo.id || `photo_${index}`,
      photo_url: photo.photo_url || photo.url,
      is_main: photo.is_main || index === 0,
      photo_order: photo.photo_order || index
    }));

    return { profileData, questionnaireData, photosData };
  };

  if (!user) {
    console.log('Navigation vers /login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white">Veuillez vous connecter</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${designSystem.getBgClasses('primary')}`}>
      {/* CSS Mobile-First */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .mini-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        .mini-card:active {
          transform: scale(0.95);
        }
        
        .mini-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .fullscreen-modal {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .card-container {
          position: relative;
          width: 280px;
          height: 400px;
          perspective: 1000px;
        }
        
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        
        .card-inner.flipped {
          transform: rotateY(180deg);
        }
        
        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 1.5rem;
          overflow: hidden;
        }
        
        .card-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(79, 70, 229, 0.1));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin: 1rem 0;
        }
        
        .stat-item {
          text-align: center;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .filters-slider {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          z-index: 1000;
        }
        
        .filters-slider.open {
          transform: translateY(0);
        }
        
        .scroll-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .scroll-container::-webkit-scrollbar {
          display: none;
        }
        
        .pulse-border {
          border: 2px solid rgba(147, 51, 234, 0.6);
          animation: pulse-glow 2s infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            border-color: rgba(147, 51, 234, 0.6);
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
          }
          50% { 
            border-color: rgba(236, 72, 153, 0.8);
            box-shadow: 0 0 30px rgba(236, 72, 153, 0.4);
          }
        }
      `}</style>

      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      {/* Header Mobile Compact */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                Découverte ✨
              </h1>
              <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                {profiles.length} profils près de toi
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => loadProfiles()}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats rapides */}
      <div className="px-4 py-4">
        <div className="flex gap-3 overflow-x-auto scroll-container">
          <div className="flex-shrink-0 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">{profiles.length} profils</span>
            </div>
          </div>
          <div className="flex-shrink-0 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">
                {profiles.filter(p => p.mirror_visibility === 'public').length} publics
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">
                {profiles.filter(p => p.mirror_visibility === 'on_request').length} privés
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grille de mini-cartes */}
      <main className="px-4 pb-20">
        {loading && profiles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
              <p className={`${designSystem.getTextClasses('secondary')}`}>
                Chargement des profils...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profiles.map((profile) => {
                const { profileData, questionnaireData, photosData } = transformProfileForCard(profile);
                
                return (
                  <div
                    key={profile.id}
                    className={`mini-card relative ${
                      profile.mirror_visibility === 'public' ? 'pulse-border' : ''
                    }`}
                    onClick={() => handleCardClick(profile)}
                  >
                    {/* Badge de statut */}
                    <div className="absolute top-2 right-2 z-10">
                      {profile.mirror_visibility === 'public' ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Unlock className="w-3 h-3 text-white" />
                        </div>
                      ) : profile.interaction_status?.mirror_request_status === 'pending' ? (
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                      ) : profile.interaction_status?.mirror_request_status === 'accepted' ? (
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Mini carte */}
                    <div className="w-full h-48 rounded-xl overflow-hidden">
                      <AffiniaCard
                        photos={photosData}
                        profile={profileData}
                        questionnaire={questionnaireData}
                        className="transform scale-75 origin-top-left w-[133.33%] h-[133.33%]"
                      />
                    </div>

                    {/* Info rapide */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <h3 className="text-white font-bold text-sm truncate">
                        {profile.name}, {profile.age}
                      </h3>
                      <p className="text-white/80 text-xs truncate">
                        📍 {profile.city} • {profile.distance_km}km
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bouton charger plus */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Voir plus de profils
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Fullscreen */}
      {showFullscreen && selectedProfile && (
        <div className="fullscreen-modal">
          {/* Bouton fermer */}
          <button
            onClick={handleCloseFullscreen}
            className="absolute top-6 right-6 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Container de la carte */}
          <div className="card-container">
            <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
              
              {/* Face avant - Carte Affinia */}
              <div className="card-face">
                {(() => {
                  const { profileData, questionnaireData, photosData } = transformProfileForCard(selectedProfile);
                  return (
                    <AffiniaCard
                      photos={photosData}
                      profile={profileData}
                      questionnaire={questionnaireData}
                      className="w-full h-full"
                    />
                  );
                })()}
              </div>

              {/* Face arrière - Informations détaillées */}
              <div className="card-face card-back">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedProfile.name}, {selectedProfile.age}
                  </h2>
                  <p className="text-purple-300 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedProfile.city} • {selectedProfile.distance_km}km
                  </p>
                  
                  <div className="stats-grid">
                    <div className="stat-item">
                      <Brain className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-xs text-white/80">Authenticité</p>
                      <p className="font-bold text-white">
                        {selectedProfile.questionnaire_snippet?.authenticity_score || 7}/10
                      </p>
                    </div>
                    <div className="stat-item">
                      <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                      <p className="text-xs text-white/80">Attachment</p>
                      <p className="font-bold text-white text-xs">
                        {selectedProfile.questionnaire_snippet?.attachment_style || 'Secure'}
                      </p>
                    </div>
                  </div>

                  {selectedProfile.bio && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-white/90 mb-2">À propos</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {selectedProfile.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {selectedProfile.mirror_visibility === 'public' ? (
                    <button
                      onClick={() => handleViewMirror(selectedProfile.id)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Voir le miroir
                    </button>
                  ) : selectedProfile.interaction_status?.mirror_request_status === 'pending' ? (
                    <div className="w-full py-3 bg-yellow-600 rounded-xl text-white font-medium text-center flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Demande en attente
                    </div>
                  ) : selectedProfile.interaction_status?.mirror_request_status === 'accepted' ? (
                    <button
                      onClick={() => handleViewMirror(selectedProfile.id)}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Accès accordé
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMirrorRequest(selectedProfile.id)}
                      disabled={requestingMirror === selectedProfile.id}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {requestingMirror === selectedProfile.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Demander l'accès
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retourner
                    </button>
                    <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 left-6 right-6 text-center">
            <p className="text-white/60 text-sm">
              {isFlipped ? 'Tap "Retourner" pour voir la carte' : 'Tap la carte pour voir les infos'}
            </p>
          </div>
        </div>
      )}

      {/* Filtres coulissants */}
      <div className={`filters-slider ${showFilters ? 'open' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Filtres</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="p-2 rounded-full bg-white/10"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/80 mb-2">Genre</label>
            <select
              value={filters.gender || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value as any }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">Tous</option>
              <option value="male">Hommes</option>
              <option value="female">Femmes</option>
              <option value="other">Autres</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-white/80 mb-2">Distance (km)</label>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.max_distance_km || 50}
              onChange={(e) => setFilters(prev => ({ ...prev, max_distance_km: parseInt(e.target.value) }))}
              className="w-full"
            />
            <span className="text-xs text-white/60">{filters.max_distance_km || 50} km</span>
          </div>
        </div>
      </div>

      {/* Message d'action */}
      {actionMessage && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            {actionMessage.type === 'success' ? (
              <Heart className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm font-medium ${
              actionMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {actionMessage.text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};