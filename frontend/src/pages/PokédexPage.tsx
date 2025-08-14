// =============================================
// POKÉDEX PAGE - Layout 2 colonnes (Gauche: Miroir, Droite: Carte)
// =============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useDesignSystem } from '../styles/designSystem';
import { BaseComponents } from '../components/ui/BaseComponents';
import { AffiniaCard } from '../components/profile/AffiniaCard';
import { parseEmotionalText, smartSplitParagraphs, extractJsonFromText } from '../utils/mirrorUtils';
import { 
  Database, X, Loader, RefreshCw, ChevronLeft, ChevronRight, 
  UserCheck, Heart, Brain, Star, ArrowUpRight, MessageCircle,
  Shield, Info, Sparkles, Eye, Target, CloudRain, Flame,
  Share2, TrendingUp, BookOpen, Search, ArrowLeft, Clock,
  Quote, Compass, Diamond, Gem, Circle
} from 'lucide-react';

interface PokédexPageProps { 
  isDarkMode: boolean 
}

interface ConnectionProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  age?: number;
  gender?: string;
  bio?: string;
  photos: any[];
  questionnaire_snippet?: any;
  connected_at: string;
}

interface MirrorData {
  generated_profile: string;
  profile_json: any;
}

function PokédexPage({ isDarkMode }: PokédexPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const design = useDesignSystem(isDarkMode);
  const [searchParams, setSearchParams] = useSearchParams();

  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [mirrorData, setMirrorData] = useState<MirrorData | null>(null);
  const [loadingMirror, setLoadingMirror] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);

  // Refs
  const mirrorContentRef = useRef<HTMLDivElement>(null);

  // Couleurs sections miroir
  const sectionColors = [
    { bg: 'from-purple-900/10 to-indigo-900/10', accent: 'purple-400', glow: 'purple-500/20' },
    { bg: 'from-indigo-900/10 to-violet-900/10', accent: 'indigo-400', glow: 'indigo-500/20' },
    { bg: 'from-violet-900/10 to-purple-900/10', accent: 'violet-400', glow: 'violet-500/20' },
    { bg: 'from-rose-900/10 to-pink-900/10', accent: 'rose-400', glow: 'rose-500/20' },
  ];

  // Filtrer les connexions selon le terme de recherche
  const filteredConnections = connections.filter(connection => 
    connection.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Connexion sélectionnée
  const selectedConnection = selectedProfileId 
    ? connections.find(c => c.id === selectedProfileId)
    : null;

  // Progress bar lecture
  useEffect(() => {
    const handleScroll = () => {
      if (!mirrorContentRef.current) return;
      const element = mirrorContentRef.current;
      const scrolled = element.scrollTop;
      const maxScroll = element.scrollHeight - element.clientHeight;
      const progress = maxScroll > 0 ? Math.min((scrolled / maxScroll) * 100, 100) : 0;
      setReadingProgress(progress);
    };

    const element = mirrorContentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [selectedConnection]);

  // Charger les connexions
  const loadConnections = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔗 Pokédex - Chargement des connexions acceptées...');

      // 1. Récupérer les demandes de miroir acceptées (où je suis le sender)
      const { data: acceptedRequests, error: requestsError } = await supabase
        .from('mirror_requests')
        .select('receiver_id, created_at, responded_at')
        .eq('sender_id', user.id)
        .eq('status', 'accepted')
        .order('responded_at', { ascending: false });

      if (requestsError) {
        throw new Error(`Erreur mirror_requests: ${requestsError.message}`);
      }

      if (!acceptedRequests || acceptedRequests.length === 0) {
        console.log('📭 Aucune connexion trouvée');
        setConnections([]);
        return;
      }

      const receiverIds = acceptedRequests.map(req => req.receiver_id);
      console.log('👥 IDs des connexions:', receiverIds);

      // 2. Récupérer les profils complets
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          avatar_url,
          city,
          bio,
          gender,
          birth_date,
          profile_photos (
            id,
            photo_url,
            is_main,
            photo_order
          )
        `)
        .in('id', receiverIds);

      if (profilesError) {
        throw new Error(`Erreur profiles: ${profilesError.message}`);
      }

      // 3. Récupérer les questionnaires (données psycho)
      const { data: questionnaires, error: questionnaireError } = await supabase
        .from('questionnaire_responses')
        .select('user_id, profile_json, generated_profile, created_at')
        .in('user_id', receiverIds);

      if (questionnaireError) {
        console.warn('⚠️ Erreur questionnaires:', questionnaireError.message);
      }

      // 4. Combiner toutes les données
      const connectionsData: ConnectionProfile[] = profiles.map(profile => {
        const request = acceptedRequests.find(req => req.receiver_id === profile.id);
        const questionnaire = questionnaires?.find(q => q.user_id === profile.id);
        
        // Calculer l'âge depuis birth_date
        let age = null;
        if (profile.birth_date) {
          const birthDate = new Date(profile.birth_date);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          city: profile.city,
          bio: profile.bio,
          age: age,
          gender: profile.gender,
          photos: profile.profile_photos || [],
          questionnaire_snippet: questionnaire?.profile_json || null,
          connected_at: request?.responded_at || request?.created_at || new Date().toISOString()
        };
      });

      console.log('✅ Connexions chargées:', connectionsData.length);
      setConnections(connectionsData);

      // Sélectionner automatiquement le premier profil ou celui de l'URL
      const userParam = searchParams.get('user');
      if (userParam && connectionsData.find(c => c.id === userParam)) {
        setSelectedProfileId(userParam);
      } else if (connectionsData.length > 0 && !selectedProfileId) {
        setSelectedProfileId(connectionsData[0].id);
      }

    } catch (err: any) {
      console.error('❌ Erreur chargement connexions pokédex:', err);
      setError(err?.message || 'Erreur de chargement des connexions');
    } finally {
      setLoading(false);
    }
  }, [user, searchParams, selectedProfileId]);

  // Charger le miroir
  const loadMirrorData = useCallback(async (profileId: string) => {
    try {
      setLoadingMirror(true);
      
      console.log('📖 Chargement miroir pour:', profileId);

      // Même logique que MirrorPage
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('questionnaire_responses')
        .select('generated_profile, profile_json, user_id')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaireError) {
        throw new Error(questionnaireError.code === 'PGRST116'
          ? 'Ce profil n\'a pas encore complété son questionnaire.'
          : 'Erreur lors de la récupération du questionnaire.');
      }

      // 🚀 NOUVEAU : Si pas de profile_json, essayer d'extraire du texte brut
      let finalProfileJson = questionnaireData.profile_json;
      
      if (!finalProfileJson || Object.keys(finalProfileJson).length === 0) {
        console.log('📱 Mode simplifié détecté, extraction JSON du texte...');
        finalProfileJson = extractJsonFromText(questionnaireData.generated_profile);
      }

      setMirrorData({
        generated_profile: questionnaireData.generated_profile || '',
        profile_json: finalProfileJson || {}
      });

      console.log('✅ Miroir chargé avec succès');

    } catch (err: any) {
      console.error('❌ Erreur chargement miroir:', err);
      setMirrorData(null);
    } finally {
      setLoadingMirror(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadConnections();
  }, [user, loadConnections]);

  // Charger le miroir quand un profil est sélectionné
  useEffect(() => {
    if (selectedProfileId) {
      loadMirrorData(selectedProfileId);
      // Mettre à jour l'URL
      setSearchParams({ user: selectedProfileId });
    } else {
      setMirrorData(null);
      setSearchParams({});
    }
  }, [selectedProfileId, loadMirrorData, setSearchParams]);

  // Transform profile data for AffiniaCard
  const toCardProps = useCallback((p: ConnectionProfile) => {
    const profile = { 
      id: p.id, 
      name: p.name, 
      bio: p.bio, 
      city: p.city, 
      avatar_url: p.avatar_url 
    };
    
    // Données complètes car accès accordé
    const questionnaire = {
      answers: { age: p.age, gender: p.gender },
      profile_json: p.questionnaire_snippet // Données psycho complètes
    };
    
    const photos = (p.photos ?? []).map((ph: any, i: number) => ({
      id: ph.id ?? `photo_${i}`,
      photo_url: ph.photo_url ?? ph.url,
      is_main: ph.is_main ?? i === 0,
      photo_order: ph.photo_order ?? i,
    }));
    
    return { profile, questionnaire, photos };
  }, []);

  // Créer conversation
  const createConversation = async (profileId: string) => {
    try {
      console.log('💬 Création conversation avec:', profileId);
      
      // Vérifier si une conversation existe déjà 
      const { data: existingConversation, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [user.id, profileId])
        .single();

      if (existingConversation) {
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Créer nouvelle conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          participants: [user.id, profileId],
          type: 'direct',
          created_by: user.id
        })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
    }
  };

  // Analyses du miroir
  const getAnalysisSections = (profileJson: any) => {
    const sections = [
      { key: 'strength_signals', title: 'Forces Dominantes', icon: Star, color: 'text-amber-500' },
      { key: 'weakness_signals', title: 'Zones Sensibles', icon: CloudRain, color: 'text-slate-400' },
      { key: 'unconscious_patterns', title: 'Patterns Inconscients', icon: Brain, color: 'text-purple-500' },
      { key: 'ideal_partner_traits', title: 'Partenaire Idéal', icon: Heart, color: 'text-rose-500' },
      { key: 'relationnal_risks', title: 'Risques Relationnels', icon: Target, color: 'text-orange-500' }
    ];

    return sections
      .map(section => ({
        ...section,
        data: profileJson[section.key]
      }))
      .filter(section => section.data && (Array.isArray(section.data) ? section.data.length > 0 : true));
  };

  // Badge nouveau (< 48h)
  const isNew = (connectedAt: string) => {
    const diffMs = Date.now() - new Date(connectedAt).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < 48;
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  // États d'erreur/loading principal
  if (error) {
    return (
      <div className={`min-h-screen ${design.getBgClasses("primary")} relative pt-20`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="text-center py-12">
          <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-8 max-w-md mx-auto">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className={`text-lg font-bold mb-2 ${design.getTextClasses('primary')}`}>
              Erreur de chargement
            </h3>
            <p className={`text-sm ${design.getTextClasses('secondary')} mb-4`}>{error}</p>
            <BaseComponents.Button variant="primary" onClick={loadConnections}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </BaseComponents.Button>
          </BaseComponents.Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${design.getBgClasses("primary")} relative pt-20`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
            <p className={`${design.getTextClasses('primary')}`}>Chargement de votre Pokédex...</p>
          </div>
        </div>
      </div>
    );
  }

  // État vide
  if (connections.length === 0) {
    return (
      <div className={`min-h-screen ${design.getBgClasses("primary")} relative pt-20`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="text-center py-12">
          <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-8 max-w-md mx-auto">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-xl font-bold mb-2 ${design.getTextClasses('primary')}`}>
              Pokédex vide
            </h3>
            <p className={`text-sm ${design.getTextClasses('secondary')} mb-6`}>
              Commencez par explorer et demander l'accès aux miroirs !
            </p>
            <BaseComponents.Button 
              variant="primary" 
              onClick={() => navigate('/decouverte')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Découvrir des âmes
            </BaseComponents.Button>
          </BaseComponents.Card>
        </div>
      </div>
    );
  }

  // Vue normale : grille de profils OU layout 2 colonnes
  const isGridView = !selectedProfileId;

  return (
    <div className={`min-h-screen ${design.getBgClasses("primary")} relative`}>
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      {/* CSS pour le style raffiné */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Crimson+Text:ital@0;1&display=swap');

        .fade-in {
          opacity: 1;
          transform: translateY(0);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .text-refined {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .elegant-border {
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .initial-letter {
          float: left;
          font-size: 4rem;
          line-height: 3rem;
          padding-right: 8px;
          padding-top: 4px;
          font-family: 'Crimson Text', serif;
          font-weight: 600;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .quote-mark {
          font-size: 2rem;
          color: rgba(168, 85, 247, 0.4);
          font-family: serif;
          line-height: 1;
        }
      `}</style>

      {isGridView ? (
        // 🔲 VUE GRILLE - Sélection des profils
        <div className="pt-20">
          {/* Header avec stats et recherche */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-float">
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h1 className={`text-4xl font-bold ${design.getTextClasses('primary')}`}>
                    Mon <span className="gradient-text">Pokédex</span>
                  </h1>
                  <p className={`text-lg ${design.getTextClasses('secondary')}`}>
                    Collection des âmes qui ont partagé leur essence
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${design.getTextClasses('primary')}`}>
                    {connections.length}
                  </div>
                  <div className={`text-sm ${design.getTextClasses('muted')}`}>
                    Connexions
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {connections.filter(c => c.questionnaire_snippet?.authenticity_score >= 9).length}
                  </div>
                  <div className={`text-sm ${design.getTextClasses('muted')}`}>
                    Légendaires
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">
                    {Math.round(connections.reduce((acc, c) => acc + (c.questionnaire_snippet?.authenticity_score || 0), 0) / connections.length) || 0}
                  </div>
                  <div className={`text-sm ${design.getTextClasses('muted')}`}>
                    Score moyen
                  </div>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une connexion..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-400'
                    } focus:ring-4 focus:ring-purple-400/20`}
                  />
                </div>
              </div>
            </div>

            {/* Grille des profils */}
            {filteredConnections.length === 0 ? (
              <div className="text-center py-12">
                <p className={`text-lg ${design.getTextClasses('secondary')}`}>
                  {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucune connexion trouvée'}
                </p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Effacer la recherche
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
                {filteredConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="group relative cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
                    onClick={() => setSelectedProfileId(connection.id)}
                  >
                    {/* Badge nouveau */}
                    {isNew(connection.connected_at) && (
                      <div className="absolute top-4 left-4 z-30 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
                        NOUVEAU
                      </div>
                    )}

                    {/* Badge pokédex */}
                    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg z-30">
                      <Database className="w-4 h-4 text-white" />
                    </div>

                    {/* Badge score */}
                    <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-xl border-2 border-white/30 z-30">
                      <span className="text-white font-bold text-sm">
                        {connection.questionnaire_snippet?.authenticity_score || '?'}
                      </span>
                    </div>

                    <AffiniaCard {...toCardProps(connection)} className="w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // 📖 VUE 2 COLONNES - Miroir + Carte
        <div className="min-h-screen">
          {/* Progress bar de lecture */}
          <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-px bg-purple-600/60 transition-all duration-500"
                 style={{ width: `${readingProgress}%` }} />
          </div>

          {/* Header navigation */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Retour */}
              <button
                onClick={() => setSelectedProfileId(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au Pokédex
              </button>

              {/* Titre */}
              {selectedConnection && (
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white">
                    Miroir de {selectedConnection.name}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {selectedConnection.city && `${selectedConnection.city} • `}
                    Connexion acceptée
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => selectedConnection && createConversation(selectedConnection.id)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-medium transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Discuter
                </button>
              </div>
            </div>
          </div>

          {/* Layout 2 colonnes */}
          <div className="pt-20 flex min-h-screen">
            {/* Desktop: 2 colonnes */}
            <div className="hidden lg:flex w-full">
              {/* Colonne gauche - Miroir (68-72%) */}
              <div className="flex-1 w-[70%] overflow-hidden">
                <div 
                  ref={mirrorContentRef}
                  className="h-screen overflow-y-auto p-8 space-y-8"
                >
                  {loadingMirror ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Loader className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
                        <p className="text-white">Chargement du miroir...</p>
                      </div>
                    </div>
                  ) : mirrorData ? (
                    <>
                      {/* Révélations avec découpage intelligent */}
                      {mirrorData.generated_profile && (
                        <section className="space-y-8">
                          {smartSplitParagraphs(parseEmotionalText(mirrorData.generated_profile)).map((paragraph, index) => {
                            const colorScheme = sectionColors[index % sectionColors.length];

                            return (
                              <div
                                key={index}
                                className="fade-in"
                                style={{ transitionDelay: `${index * 0.1}s` }}
                              >
                                <div className={`
                                  relative elegant-border rounded-2xl p-6 md:p-8
                                  ${design.cardBackground}
                                  transition-all duration-300 hover:border-purple-400/20
                                  bg-gradient-to-br ${colorScheme.bg}
                                  group
                                `}>

                                  {/* Numéro et ornement */}
                                  <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-${colorScheme.accent} to-pink-400 flex items-center justify-center`}>
                                        <span className="text-xs font-mono text-white">
                                          {String(index + 1).padStart(2, '0')}
                                        </span>
                                      </div>
                                      <div className={`h-px flex-1 bg-gradient-to-r from-${colorScheme.accent}/40 to-transparent max-w-16`} />
                                    </div>
                                    <Sparkles className={`w-4 h-4 text-${colorScheme.accent}/60`} />
                                  </div>

                                  {/* Texte principal */}
                                  <div className="relative">
                                    <div className="quote-mark absolute -left-4 -top-2">"</div>
                                    
                                    <div className={`text-base md:text-lg leading-loose ${design.getTextClasses('primary')} text-refined`}>
                                      <span className="initial-letter">
                                        {paragraph.charAt(0)}
                                      </span>
                                      <span style={{
                                        lineHeight: '1.8',
                                        letterSpacing: '0.01em',
                                        fontWeight: '400'
                                      }}>
                                        {paragraph.slice(1)}
                                      </span>
                                    </div>

                                    <div className="quote-mark absolute -right-4 -bottom-2 rotate-180">"</div>
                                  </div>

                                  {/* Constellation */}
                                  <div className="mt-6 flex justify-center">
                                    <div className="flex items-center gap-1">
                                      {[...Array(3)].map((_, i) => (
                                        <div
                                          key={i}
                                          className={`w-1 h-1 rounded-full bg-${colorScheme.accent}/60`}
                                          style={{ animationDelay: `${i * 0.5}s` }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </section>
                      )}

                      {/* Analyse technique */}
                      {mirrorData.profile_json && (
                        <section className="space-y-4">
                          <h3 className="text-white font-bold text-xl flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            Analyse Détaillée
                          </h3>
                          
                          {getAnalysisSections(mirrorData.profile_json).map((section) => (
                            <div
                              key={section.key}
                              className={`elegant-border rounded-xl p-4 ${design.cardBackground}`}
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <div className={`${section.color}`}>
                                  <section.icon className="w-4 h-4" />
                                </div>
                                <h4 className={`text-sm font-medium ${design.getTextClasses('primary')} text-refined`}>
                                  {section.title}
                                </h4>
                              </div>

                              <div className="space-y-2">
                                {Array.isArray(section.data) ? (
                                  section.data.map((item, idx) => (
                                    <div key={idx} className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                      <span className={`text-sm ${design.getTextClasses('secondary')} text-refined`}>
                                        {typeof item === 'string' ? item : JSON.stringify(item)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className={`text-sm ${design.getTextClasses('secondary')} text-refined`}>
                                    {typeof section.data === 'string' ? section.data : JSON.stringify(section.data)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </section>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-white mb-2">Miroir non disponible</p>
                        <p className="text-gray-400 text-sm">Les données du miroir n'ont pas pu être chargées</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite - Sidebar (28-32%) */}
              <div className="w-[30%] sticky top-20 h-screen overflow-y-auto bg-black/20 backdrop-blur-xl border-l border-white/10">
                <div className="p-6 space-y-6">
                  {selectedConnection && (
                    <>
                      {/* Recto - Photos */}
                      <div className="text-center">
                        <AffiniaCard {...toCardProps(selectedConnection)} className="w-full scale-90" />
                      </div>

                      {/* Verso - Infos détaillées */}
                      <div className="space-y-4">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-400" />
                          Profil Détaillé
                        </h3>

                        {/* Analyses rapides */}
                        {selectedConnection.questionnaire_snippet && (
                          <div className="space-y-3">
                            {getAnalysisSections(selectedConnection.questionnaire_snippet).slice(0, 3).map((section) => (
                              <div key={section.key} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <section.icon className={`w-4 h-4 ${section.color}`} />
                                  <span className="text-white font-medium text-sm">{section.title}</span>
                                </div>
                                <div className="space-y-1">
                                  {Array.isArray(section.data) ? (
                                    section.data.slice(0, 2).map((item, idx) => (
                                      <div key={idx} className="text-gray-300 text-xs leading-relaxed">
                                        • {typeof item === 'string' ? item : JSON.stringify(item)}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-gray-300 text-xs leading-relaxed">
                                      {typeof section.data === 'string' ? section.data : JSON.stringify(section.data)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: Layout empilé */}
            <div className="lg:hidden w-full">
              <div className="p-4 space-y-6">
                {selectedConnection && (
                  <>
                    {/* Recto - Photos */}
                    <div className="text-center">
                      <AffiniaCard {...toCardProps(selectedConnection)} className="w-full max-w-sm mx-auto" />
                    </div>

                    {/* Verso - Analyses rapides */}
                    {selectedConnection.questionnaire_snippet && (
                      <div className="space-y-3">
                        <h3 className="text-white font-bold text-lg">Analyse Express</h3>
                        {getAnalysisSections(selectedConnection.questionnaire_snippet).slice(0, 2).map((section) => (
                          <div key={section.key} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <section.icon className={`w-4 h-4 ${section.color}`} />
                              <span className="text-white font-medium text-sm">{section.title}</span>
                            </div>
                            <div className="space-y-1">
                              {Array.isArray(section.data) ? (
                                section.data.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-gray-300 text-xs leading-relaxed">
                                    • {typeof item === 'string' ? item : JSON.stringify(item)}
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-300 text-xs leading-relaxed">
                                  {typeof section.data === 'string' ? section.data : JSON.stringify(section.data)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Miroir - Texte complet */}
                    {mirrorData ? (
                      <div className="space-y-6">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-purple-400" />
                          Miroir Complet
                        </h3>
                        
                        {mirrorData.generated_profile && (
                          <div className="space-y-4">
                            {smartSplitParagraphs(parseEmotionalText(mirrorData.generated_profile)).map((paragraph, index) => (
                              <div
                                key={index}
                                className="bg-white/5 rounded-xl p-4 border border-white/10"
                              >
                                <div className="text-gray-300 leading-relaxed text-sm">
                                  {paragraph}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : loadingMirror ? (
                      <div className="text-center py-8">
                        <Loader className="w-6 h-6 text-purple-400 mx-auto mb-2 animate-spin" />
                        <p className="text-white text-sm">Chargement du miroir...</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-white text-sm">Miroir non disponible</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating refresh button (seulement en vue grille) */}
      {isGridView && (
        <button 
          onClick={loadConnections} 
          disabled={loading} 
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform border-2 border-white/20 backdrop-blur-sm z-30"
        >
          <RefreshCw className={`w-7 h-7 text-white ${loading ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}

export default PokédexPage;