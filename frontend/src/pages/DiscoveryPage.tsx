// =============================================
// PAGE DÉCOUVERTE - Frontend avec cartes Affinia
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryService } from '../services/discoveryService';
import { useDesignSystem, UnifiedAnimations } from '../styles/designSystem';
import { BaseComponents } from '../components/ui/BaseComponents';
import { AffiniaCard } from '../components/profile/AffiniaCard';
import { 
  Search, Filter, MapPin, Heart, Lock, Unlock, Users, 
  Loader, RefreshCw, AlertCircle, Eye, Calendar, Sparkles,
  MessageCircle, Star
} from 'lucide-react';
import type { 
  DiscoveryProfile, 
  DiscoveryFilters, 
  MirrorRequestResponse 
} from '../../../shared/types/discovery';

interface DiscoveryPageProps {
  isDarkMode: boolean;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const designSystem = useDesignSystem(isDarkMode);

  // États principaux
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États des filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DiscoveryFilters>({
    gender: 'all',
    min_age: 18,
    max_age: 99,
    max_distance_km: 50,
    sort_by: 'distance',
    limit: 20,
    offset: 0
  });

  // États des interactions
  const [requestingMirror, setRequestingMirror] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Charger les profils au montage et quand les filtres changent
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

      const response = await discoveryService.getDiscoveryProfiles(currentFilters);

      if (loadMore) {
        setProfiles(prev => [...prev, ...response.profiles]);
      } else {
        setProfiles(response.profiles);
      }

      setHasMore(response.has_more);

    } catch (err) {
      console.error('❌ Erreur chargement profils:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProfiles(true);
    }
  };

  const handleFilterChange = (newFilters: Partial<DiscoveryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handleMirrorRequest = async (profileId: string) => {
    try {
      setRequestingMirror(profileId);
      
      const response = await discoveryService.requestMirrorAccess(profileId);
      
      if (response.success) {
        showActionMessage('success', 'Demande envoyée avec succès !');
        
        // Mettre à jour le profil dans la liste
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
      } else {
        showActionMessage('error', response.message || 'Erreur lors de la demande');
      }

    } catch (err) {
      console.error('❌ Erreur demande miroir:', err);
      showActionMessage('error', 'Erreur lors de la demande');
    } finally {
      setRequestingMirror(null);
    }
  };

  const handleViewMirror = (profileId: string) => {
    navigate(`/miroir/${profileId}`);
  };

  const showActionMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      {/* Styles CSS unifiés */}
      <style>{`
        ${UnifiedAnimations}
      `}</style>

      {/* Background mystique unifié */}
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header de la page */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-3xl font-bold flex items-center gap-3 ${designSystem.getTextClasses('primary')}`}>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-float">
                    <Search className="w-8 h-8" />
                  </div>
                  Découverte
                </h1>
                <p className={`text-lg mt-2 ${designSystem.getTextClasses('secondary')}`}>
                  Explorez les profils et découvrez leurs miroirs de l'âme
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <BaseComponents.Button
                  variant="secondary"
                  size="small"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                </BaseComponents.Button>
                
                <BaseComponents.Button
                  variant="secondary"
                  size="small"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </BaseComponents.Button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {profiles.length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Profils découverts
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>

              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-8 h-8 text-green-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {profiles.filter(p => p.mirror_visibility === 'public').length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Miroirs publics
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>

              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {profiles.filter(p => p.mirror_visibility === 'on_request').length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Miroirs privés
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-6 mb-8 mystical-glow">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Filtre genre */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
                    Genre recherché
                  </label>
                  <select
                    value={filters.gender || 'all'}
                    onChange={(e) => handleFilterChange({ gender: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="all">Tous</option>
                    <option value="male">Hommes</option>
                    <option value="female">Femmes</option>
                    <option value="other">Autres</option>
                  </select>
                </div>

                {/* Filtre âge */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
                    Âge (min-max)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={filters.min_age || 18}
                      onChange={(e) => handleFilterChange({ min_age: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20`}
                    />
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={filters.max_age || 99}
                      onChange={(e) => handleFilterChange({ max_age: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20`}
                    />
                  </div>
                </div>

                {/* Filtre distance */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
                    Distance max (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={filters.max_distance_km || 50}
                    onChange={(e) => handleFilterChange({ max_distance_km: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>

                {/* Filtre tri */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
                    Trier par
                  </label>
                  <select
                    value={filters.sort_by || 'distance'}
                    onChange={(e) => handleFilterChange({ sort_by: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="distance">Distance</option>
                    <option value="age">Âge</option>
                    <option value="newest">Plus récents</option>
                    <option value="random">Aléatoire</option>
                  </select>
                </div>
              </div>
            </BaseComponents.Card>
          )}

          {/* Grille des profils */}
          {loading && profiles.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                  Chargement des profils...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                <p className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                  {error}
                </p>
                <BaseComponents.Button
                  variant="primary"
                  size="small"
                  onClick={handleRefresh}
                  className="mt-4"
                >
                  Réessayer
                </BaseComponents.Button>
              </div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                  Aucun profil trouvé avec ces critères
                </p>
                <BaseComponents.Button
                  variant="secondary"
                  size="small"
                  onClick={() => setFilters({ gender: 'all', min_age: 18, max_age: 99, max_distance_km: 50, sort_by: 'distance', limit: 20, offset: 0 })}
                  className="mt-4"
                >
                  Réinitialiser les filtres
                </BaseComponents.Button>
              </div>
            </div>
          ) : (
            <>
              {/* Grille des cartes Affinia */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 mb-8">
                {profiles.map((profile) => (
                  <DiscoveryAffiniaCard
                    key={profile.id}
                    profile={profile}
                    isDarkMode={isDarkMode}
                    onMirrorRequest={handleMirrorRequest}
                    onViewMirror={handleViewMirror}
                    requestingMirror={requestingMirror === profile.id}
                  />
                ))}
              </div>

              {/* Bouton charger plus */}
              {hasMore && (
                <div className="flex justify-center">
                  <BaseComponents.Button
                    variant="secondary"
                    size="large"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Charger plus
                      </>
                    )}
                  </BaseComponents.Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Message d'action */}
      {actionMessage && (
        <div className="fixed top-24 right-4 z-50">
          <BaseComponents.Card
            isDarkMode={isDarkMode}
            variant="highlighted"
            className={`flex items-center gap-3 px-6 py-4 ${
              actionMessage.type === 'success'
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-red-500/50 bg-red-500/10'
            } animate-pulse-glow`}
          >
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
          </BaseComponents.Card>
        </div>
      )}
    </div>
  );
};

// ============ COMPOSANT CARTE AFFINIA POUR DISCOVERY - VERSION SIMPLIFIÉE ============

interface DiscoveryAffiniaCardProps {
  profile: DiscoveryProfile;
  isDarkMode: boolean;
  onMirrorRequest: (profileId: string) => void;
  onViewMirror: (profileId: string) => void;
  requestingMirror: boolean;
}

const DiscoveryAffiniaCard: React.FC<DiscoveryAffiniaCardProps> = ({ 
  profile, 
  isDarkMode, 
  onMirrorRequest, 
  onViewMirror,
  requestingMirror 
}) => {
  const designSystem = useDesignSystem(isDarkMode);
  
  // Transformer les données DiscoveryProfile en format pour AffiniaCard
  const transformProfileData = () => {
    // Créer un objet profile compatible
    const profileData = {
      id: profile.id,
      name: profile.name,
      bio: profile.bio,
      city: profile.city,
      avatar_url: profile.avatar_url
    };

    // Créer un objet questionnaire compatible
    const questionnaireData = {
      answers: {
        age: profile.age,
        gender: profile.gender
      },
      profile_json: profile.questionnaire_snippet ? {
        authenticity_score: profile.questionnaire_snippet.authenticity_score || 7,
        attachment_style: profile.questionnaire_snippet.attachment_style || 'secure',
        strength_signals: profile.questionnaire_snippet.strength_signals || [
          'Communication claire',
          'Empathie naturelle',
          'Stabilité émotionnelle'
        ],
        weakness_signals: [
          'Points d\'amélioration à découvrir'
        ],
        unconscious_patterns: [],
        ideal_partner_traits: [],
        reliability_score: 0.75,
        affective_indicators: {
          emotion_expression: 'modérée',
          defense_mechanisms: []
        },
        cognitive_signals: {
          language_level: 'élevé',
          thinking_style: 'analytique',
          complexity: 'moyenne'
        }
      } : {
        authenticity_score: 6,
        attachment_style: 'secure',
        strength_signals: [
          'Mystère intriguant',
          'Potentiel à découvrir',
          'Profil authentique'
        ],
        weakness_signals: [
          'Questionnaire à compléter'
        ],
        unconscious_patterns: [],
        ideal_partner_traits: [],
        reliability_score: 0.6,
        affective_indicators: {
          emotion_expression: 'modérée',
          defense_mechanisms: []
        },
        cognitive_signals: {
          language_level: 'moyen',
          thinking_style: 'intuitif',
          complexity: 'moyenne'
        }
      }
    };

    // Transformer les photos
    const photosData = profile.photos.map((photo, index) => ({
      id: photo.id || `photo_${index}`,
      photo_url: photo.photo_url || photo.url,
      is_main: photo.is_main || index === 0,
      photo_order: photo.photo_order || index
    }));

    return { profileData, questionnaireData, photosData };
  };

  const { profileData, questionnaireData, photosData } = transformProfileData();

  const getMirrorStatusButton = () => {
    const { mirror_visibility, interaction_status } = profile;
    
    if (mirror_visibility === 'public') {
      return (
        <BaseComponents.Button
          variant="success"
          size="small"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => onViewMirror(profile.id)}
        >
          <Unlock className="w-4 h-4" />
          Voir le miroir
        </BaseComponents.Button>
      );
    }
    
    if (interaction_status?.mirror_request_status === 'pending') {
      return (
        <BaseComponents.Button
          variant="warning"
          size="small"
          className="w-full flex items-center justify-center gap-2"
          disabled
        >
          <Calendar className="w-4 h-4" />
          Demande en attente
        </BaseComponents.Button>
      );
    }
    
    if (interaction_status?.mirror_request_status === 'accepted') {
      return (
        <BaseComponents.Button
          variant="success"
          size="small"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => onViewMirror(profile.id)}
        >
          <Sparkles className="w-4 h-4" />
          Accès accordé
        </BaseComponents.Button>
      );
    }
    
    if (interaction_status?.mirror_request_status === 'rejected') {
      return (
        <BaseComponents.Button
          variant="secondary"
          size="small"
          className="w-full flex items-center justify-center gap-2"
          disabled
        >
          <Lock className="w-4 h-4" />
          Accès refusé
        </BaseComponents.Button>
      );
    }
    
    return (
      <BaseComponents.Button
        variant="primary"
        size="small"
        className="w-full flex items-center justify-center gap-2"
        onClick={() => onMirrorRequest(profile.id)}
        disabled={requestingMirror}
      >
        {requestingMirror ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        Demander l'accès
      </BaseComponents.Button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Carte Affinia */}
      <div className="flex justify-center">
        <AffiniaCard
          photos={photosData}
          profile={profileData}
          questionnaire={questionnaireData}
          className="transform hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      {/* Seulement le bouton d'action - version simplifiée */}
      <div className="flex justify-center">
        {getMirrorStatusButton()}
      </div>
    </div>
  );
};