// =============================================
// MIROIR PAGE - Version Mobile-First Optimisée
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryService } from '../services/discoveryService';
import { supabase } from '../lib/supabase';
import { 
  Heart, Brain, Zap, Shield, Sparkles, ArrowLeft, Share2,
  Eye, Target, Flame, CloudRain, Star, User, TrendingUp, Lock, 
  AlertCircle, Calendar, Clock, Scroll, BookOpen, Feather, ChevronDown, ChevronUp
} from 'lucide-react';
import { useDesignSystem } from '../styles/designSystem';
import { BaseComponents } from '../components/ui/BaseComponents';

interface MiroirPageProps {
  isDarkMode?: boolean;
}

interface ProfileData {
  generated_profile: string;
  profile_json: any;
  user_id: string;
  profile_info?: {
    name: string;
    avatar_url: string | null;
    city: string | null;
  };
}

interface MirrorAccess {
  can_view: boolean;
  is_owner: boolean;
  access_expires?: string;
  owner_name?: string;
  owner_avatar?: string;
}

const MiroirPage: React.FC<MiroirPageProps> = ({ isDarkMode = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId?: string }>();
  const designSystem = useDesignSystem(isDarkMode);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [mirrorAccess, setMirrorAccess] = useState<MirrorAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Déterminer quel profil afficher
  const targetUserId = profileId || user?.id;
  const isViewingOwnMirror = !profileId || profileId === user?.id;

  // Scroll progress pour la lecture
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrolled / maxScroll) * 100, 100);
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (targetUserId) {
      checkAccessAndLoadMirror();
    }
  }, [user, targetUserId]);

  const checkAccessAndLoadMirror = async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier l'accès au miroir
      const canView = await discoveryService.canViewMirror(targetUserId!);
      
      if (!canView && !isViewingOwnMirror) {
        setMirrorAccess({
          can_view: false,
          is_owner: false
        });
        setLoading(false);
        return;
      }

      // Récupérer le questionnaire
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('questionnaire_responses')
        .select('generated_profile, profile_json, user_id')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaireError) {
        if (questionnaireError.code === 'PGRST116') {
          setError('Ce profil n\'a pas encore complété son questionnaire.');
        } else {
          setError('Erreur lors de la récupération du questionnaire.');
        }
        setLoading(false);
        return;
      }

      // Récupérer les infos du profil
      const { data: profileInfo, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url, city')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        setError('Erreur lors de la récupération du profil.');
        setLoading(false);
        return;
      }

      setProfileData({
        generated_profile: questionnaireData.generated_profile || '',
        profile_json: questionnaireData.profile_json || {},
        user_id: questionnaireData.user_id,
        profile_info: profileInfo
      });

      setMirrorAccess({
        can_view: true,
        is_owner: isViewingOwnMirror,
        owner_name: profileInfo?.name || 'Utilisateur',
        owner_avatar: profileInfo?.avatar_url
      });

      if (!isViewingOwnMirror) {
        await discoveryService.recordMirrorRead(targetUserId!);
      }

    } catch (err) {
      setError('Impossible de charger ce miroir.');
    } finally {
      setLoading(false);
    }
  };

  // Parser et nettoyer le texte
  const parseEmotionalText = (rawText: string): string => {
    if (!rawText) return '';

    return rawText
      .replace(/\*\*PARTIE\s+\d+[^*]*\*\*/g, '')
      .replace(/🔒\s*\*[a-f0-9]+\*/g, '')
      .replace(/🔐\s*[a-z0-9]+/g, '')
      .replace(/\([a-f0-9]{12,}\)/g, '')
      .replace(/[a-f0-9]{12,}/g, '')
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const cleanText = profileData ? parseEmotionalText(profileData.generated_profile) : '';

  // Fonction de partage
  const handleMobileShare = async () => {
    const ownerName = profileData?.profile_info?.name || 'Utilisateur';
    const shareTitle = `✨ Découvrez le miroir psychologique de ${ownerName} sur Affinia`;
    const shareText = `🔮 J'ai découvert une analyse psychologique fascinante sur Affinia !`;
    const shareUrl = `https://affinia.app/miroir/${targetUserId}`;

    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n👉 ${shareUrl}`);
      alert('Lien copié dans le presse-papier !');
    }
  };

  // Configuration des sections d'analyse
  const analysisSections = [
    { 
      key: 'strength_signals', 
      title: 'Forces Dominantes', 
      icon: <Star className="w-4 h-4" />, 
      emoji: '⭐', 
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      key: 'weakness_signals', 
      title: 'Zones Sensibles', 
      icon: <CloudRain className="w-4 h-4" />, 
      emoji: '🌧️', 
      gradient: 'from-gray-500 to-slate-500'
    },
    { 
      key: 'unconscious_patterns', 
      title: 'Patterns Inconscients', 
      icon: <Brain className="w-4 h-4" />, 
      emoji: '🧠', 
      gradient: 'from-purple-500 to-violet-500'
    },
    { 
      key: 'ideal_partner_traits', 
      title: 'Partenaire Idéal', 
      icon: <Heart className="w-4 h-4" />, 
      emoji: '💫', 
      gradient: 'from-pink-500 to-rose-500'
    },
    { 
      key: 'relationnal_risks', 
      title: 'Risques Relationnels', 
      icon: <Target className="w-4 h-4" />, 
      emoji: '⚠️', 
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />
        <div className="text-center relative z-10 px-4">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <Heart className="absolute inset-0 m-auto w-6 h-6 text-purple-600 animate-pulse" />
          </div>
          <p className={`text-lg font-medium ${designSystem.getTextClasses('primary')}`}>
            {isViewingOwnMirror ? 'Révélation de votre miroir...' : 'Accès au miroir en cours...'}
          </p>
        </div>
      </div>
    );
  }

  if (!mirrorAccess?.can_view || error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="text-center max-w-md mx-auto p-6 relative z-10">
          <Lock className={`w-16 h-16 mx-auto mb-4 ${designSystem.getTextClasses('muted')}`} />
          <h2 className={`text-xl font-bold mb-4 ${designSystem.getTextClasses('primary')}`}>
            {error ? 'Miroir non disponible' : 'Miroir Privé'}
          </h2>
          <p className={`mb-6 ${designSystem.getTextClasses('secondary')}`}>
            {error || 'Ce miroir n\'est pas accessible.'}
          </p>
          <BaseComponents.Button
            variant="primary"
            size="large"
            onClick={() => navigate('/decouverte')}
          >
            Retour à la découverte
          </BaseComponents.Button>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className={`min-h-screen ${designSystem.getBgClasses('primary')}`}>
      {/* Progress bar de lecture */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className={`h-1 bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300`}
             style={{ width: `${readingProgress}%` }} />
      </div>

      {/* Background mystique */}
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      {/* Container principal */}
      <div className="relative z-10">
        {/* Header compact mobile-first */}
        <header className="sticky top-0 backdrop-blur-lg bg-opacity-90 border-b border-purple-500/20 z-40 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(isViewingOwnMirror ? '/profil' : '/decouverte')}
                  className={`p-2 rounded-lg transition-all ${designSystem.cardBackground} ${designSystem.border}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    {profileData.profile_info?.avatar_url ? (
                      <img 
                        src={profileData.profile_info.avatar_url} 
                        alt={profileData.profile_info.name || 'Avatar'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  <div>
                    <h1 className={`text-lg font-bold ${designSystem.getTextClasses('primary')}`}>
                      {isViewingOwnMirror 
                        ? 'Votre Miroir' 
                        : `${profileData.profile_info?.name || 'Miroir'}`}
                    </h1>
                    <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                      {profileData.profile_info?.city && `📍 ${profileData.profile_info.city}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex items-center gap-2">
                {isViewingOwnMirror && (
                  <button
                    onClick={handleMobileShare}
                    className={`p-2 rounded-lg ${designSystem.cardBackground} ${designSystem.border}`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* SECTION 1: RÉVÉLATIONS (TEXTE EN PREMIER) */}
            {cleanText && (
              <section>
                {/* Header dramatique */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                    <div>
                      <h2 className={`text-2xl md:text-3xl font-bold ${designSystem.getTextClasses('primary')}`}>
                        {isViewingOwnMirror ? 'Votre Vérité Révélée' : 'Analyse de l\'Âme'}
                      </h2>
                      <p className={`text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium`}>
                        Les profondeurs dévoilées
                      </p>
                    </div>
                    <div className="w-1 h-12 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
                  </div>
                </div>
                
                {/* Paragraphes de révélation optimisés mobile */}
                <div className="space-y-6">
                  {cleanText.split('\n\n').filter(p => p.trim().length > 20).map((paragraph, index) => (
                    <BaseComponents.Card
                      key={index}
                      isDarkMode={isDarkMode}
                      variant="default"
                      className="p-6 md:p-8 relative overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                      {/* Ornement subtil */}
                      <div className="absolute top-4 right-4 w-6 h-6 opacity-20">
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Texte principal */}
                      <p className={`text-base md:text-lg leading-relaxed ${designSystem.getTextClasses('primary')}`}
                         style={{ 
                           fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
                           lineHeight: '1.8',
                           letterSpacing: '0.01em'
                         }}>
                        {paragraph}
                      </p>
                      
                      {/* Numérotation discrète */}
                      <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                          <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                        </div>
                        <span className={`text-xs font-mono ${designSystem.getTextClasses('muted')} opacity-40`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </BaseComponents.Card>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: ANALYSE TECHNIQUE (APRÈS LE TEXTE) */}
            {profileData.profile_json && Object.keys(profileData.profile_json).length > 0 && (
              <section>
                {/* Toggle pour afficher/masquer l'analyse */}
                <div className="text-center mb-6">
                  <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`}
                  >
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span className={`font-medium ${designSystem.getTextClasses('primary')}`}>
                      Analyse Technique Détaillée
                    </span>
                    {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Analyse détaillée (collapsible) */}
                {showAnalysis && (
                  <div className="space-y-4 animate-fadeIn">
                    {analysisSections.map((section) => {
                      const data = profileData.profile_json[section.key];
                      if (!data || (Array.isArray(data) && data.length === 0)) return null;

                      return (
                        <BaseComponents.Card
                          key={section.key}
                          isDarkMode={isDarkMode}
                          variant="default"
                          className="p-4 md:p-6"
                        >
                          {/* Header de section */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${section.gradient} text-white`}>
                              {section.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base">{section.emoji}</span>
                                <h3 className={`text-base font-semibold ${designSystem.getTextClasses('primary')}`}>
                                  {section.title}
                                </h3>
                              </div>
                            </div>
                          </div>
                          
                          {/* Contenu adaptatif */}
                          {section.key === 'ideal_partner_traits' ? (
                            <div className="space-y-3">
                              {Array.isArray(data) && data.slice(0, 3).map((item, idx) => (
                                <div key={idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-pink-500/10' : 'bg-pink-50'} text-center`}>
                                  <span className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
                                    ✨ {typeof item === 'string' ? item : JSON.stringify(item)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {Array.isArray(data) ? (
                                data.slice(0, 4).map((item, idx) => (
                                  <div key={idx} className={`p-3 rounded-lg ${designSystem.cardBackground}`}>
                                    <span className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
                                      • {typeof item === 'string' ? item : JSON.stringify(item)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
                                  {typeof data === 'string' ? data : JSON.stringify(data)}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Score de fiabilité */}
                          {section.key === 'strength_signals' && profileData.profile_json.reliability_score && (
                            <div className="mt-4 pt-4 border-t border-gray-200/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-green-500" />
                                  <span className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                                    Fiabilité
                                  </span>
                                </div>
                                <BaseComponents.Badge variant="success" isDarkMode={isDarkMode}>
                                  {Math.round(profileData.profile_json.reliability_score * 100)}%
                                </BaseComponents.Badge>
                              </div>
                            </div>
                          )}
                        </BaseComponents.Card>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 3: ACTIONS FINALES */}
            <section className="text-center py-8 space-y-6">
              {/* Citation inspirante */}
              <div className="max-w-lg mx-auto">
                <p className={`text-base font-medium leading-relaxed ${designSystem.getTextClasses('secondary')} mb-4`}
                   style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                  Cette révélation de votre essence profonde a été tissée par l'intelligence d'Affinia.
                </p>
                <p className={`text-sm italic ${designSystem.getTextClasses('muted')}`}>
                  "Connaître les autres, c'est sagesse. Se connaître soi-même, c'est sagesse supérieure."
                </p>
              </div>
              
              {/* Actions principales */}
              <div className="space-y-4">
                {isViewingOwnMirror ? (
                  <BaseComponents.Button 
                    variant="primary" 
                    size="large"
                    onClick={handleMobileShare}
                    className="w-full max-w-xs mx-auto"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager cette révélation
                  </BaseComponents.Button>
                ) : (
                  <BaseComponents.Button 
                    variant="secondary" 
                    size="large"
                    onClick={() => navigate('/decouverte')}
                    className="w-full max-w-xs mx-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Explorer d'autres âmes
                  </BaseComponents.Button>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export { MiroirPage };