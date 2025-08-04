// =============================================
// MIROIR PAGE - Version Raffinée et Élégante
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryService } from '../services/discoveryService';
import { supabase } from '../lib/supabase';
import { 
  Heart, Brain, Zap, Shield, Sparkles, ArrowLeft, Share2,
  Eye, Target, Flame, CloudRain, Star, User, TrendingUp, Lock, 
  AlertCircle, Calendar, Clock, Scroll, BookOpen, Feather, ChevronDown, ChevronUp,
  Quote, Compass, Diamond, Gem, Circle
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
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());

  const contentRef = useRef<HTMLDivElement>(null);
  const targetUserId = profileId || user?.id;
  const isViewingOwnMirror = !profileId || profileId === user?.id;

  // Intersection Observer pour les animations subtiles
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-section') || '0');
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2, rootMargin: '-5% 0px' }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [profileData]);

  // Scroll progress minimaliste
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrolled / maxScroll) * 100, 100);
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
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

      const canView = await discoveryService.canViewMirror(targetUserId!);
      
      if (!canView && !isViewingOwnMirror) {
        setMirrorAccess({ can_view: false, is_owner: false });
        setLoading(false);
        return;
      }

      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('questionnaire_responses')
        .select('generated_profile, profile_json, user_id')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaireError) {
        setError(questionnaireError.code === 'PGRST116' 
          ? 'Ce profil n\'a pas encore complété son questionnaire.' 
          : 'Erreur lors de la récupération du questionnaire.');
        setLoading(false);
        return;
      }

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

  const handleMobileShare = async () => {
    const ownerName = profileData?.profile_info?.name || 'Utilisateur';
    const shareTitle = `✨ Découvrez le miroir psychologique de ${ownerName} sur Affinia`;
    const shareText = `🔮 J'ai découvert une analyse psychologique fascinante sur Affinia !`;
    const shareUrl = `https://affinia.app/miroir/${targetUserId}`;

    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n👉 ${shareUrl}`);
      
      // Toast notification minimaliste
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed; top: 32px; right: 32px;
          background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(12px);
          color: white; padding: 12px 20px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
          z-index: 9999; opacity: 0; transform: translateY(-10px);
          transition: all 0.3s ease;
        ">
          Lien copié
        </div>
      `;
      document.body.appendChild(toast);
      
      // Animation d'apparition
      setTimeout(() => {
        toast.firstElementChild!.style.opacity = '1';
        toast.firstElementChild!.style.transform = 'translateY(0)';
      }, 10);
      
      setTimeout(() => {
        toast.firstElementChild!.style.opacity = '0';
        toast.firstElementChild!.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }
  };

  const analysisSections = [
    { 
      key: 'strength_signals', 
      title: 'Forces Dominantes', 
      icon: <Star className="w-4 h-4" />, 
      color: 'text-amber-500'
    },
    { 
      key: 'weakness_signals', 
      title: 'Zones Sensibles', 
      icon: <CloudRain className="w-4 h-4" />, 
      color: 'text-slate-400'
    },
    { 
      key: 'unconscious_patterns', 
      title: 'Patterns Inconscients', 
      icon: <Brain className="w-4 h-4" />, 
      color: 'text-purple-500'
    },
    { 
      key: 'ideal_partner_traits', 
      title: 'Partenaire Idéal', 
      icon: <Heart className="w-4 h-4" />, 
      color: 'text-rose-500'
    },
    { 
      key: 'relationnal_risks', 
      title: 'Risques Relationnels', 
      icon: <Target className="w-4 h-4" />, 
      color: 'text-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <div className="text-center relative z-10 px-6">
          <div className="relative mb-8">
            <div className="w-8 h-8 mx-auto">
              <div className="absolute inset-0 border border-purple-600/40 rounded-full animate-spin"></div>
              <div className="absolute inset-1 border border-purple-600/60 rounded-full animate-spin" style={{animationDuration: '2s', animationDirection: 'reverse'}}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className={`text-lg font-medium ${designSystem.getTextClasses('primary')}`}
                style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: '400' }}>
              {isViewingOwnMirror ? 'Chargement de votre miroir' : 'Accès au miroir'}
            </h2>
            <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
              Patience
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!mirrorAccess?.can_view || error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <div className="w-12 h-12 mx-auto mb-6 opacity-50">
            <Lock className="w-full h-full" />
          </div>
          <h2 className={`text-xl font-medium mb-4 ${designSystem.getTextClasses('primary')}`}
              style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: '400' }}>
            {error ? 'Miroir non disponible' : 'Accès restreint'}
          </h2>
          <p className={`mb-8 leading-relaxed ${designSystem.getTextClasses('secondary')}`}>
            {error || 'Ce miroir nécessite une permission.'}
          </p>
          <button
            onClick={() => navigate('/decouverte')}
            className={`px-6 py-2 rounded-lg border transition-all duration-200 ${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className={`min-h-screen ${designSystem.getBgClasses('primary')}`}>
      {/* CSS pour le style raffiné */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
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
        
        .dark .elegant-border {
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .subtle-shadow {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .dark .subtle-shadow {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      {/* Progress bar ultra-fine */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-px bg-purple-600/60 transition-all duration-500"
             style={{ width: `${readingProgress}%` }} />
      </div>

      {/* Header minimaliste */}
      <header className="sticky top-0 z-40 py-4 px-4 backdrop-blur-md bg-opacity-80">
        <div className="max-w-3xl mx-auto">
          <div className={`elegant-border rounded-xl px-4 py-3 ${designSystem.cardBackground} subtle-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(isViewingOwnMirror ? '/profil' : '/decouverte')}
                  className={`p-2 rounded-lg transition-all duration-200 hover:bg-white/5`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    {profileData.profile_info?.avatar_url ? (
                      <img 
                        src={profileData.profile_info.avatar_url} 
                        alt={profileData.profile_info.name || 'Avatar'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div>
                    <h1 className={`text-base font-medium ${designSystem.getTextClasses('primary')} text-refined`}>
                      {isViewingOwnMirror 
                        ? 'Votre miroir' 
                        : `${profileData.profile_info?.name || 'Miroir'}`}
                    </h1>
                    <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                      {profileData.profile_info?.city || 'Affinia'}
                    </p>
                  </div>
                </div>
              </div>

              {isViewingOwnMirror && (
                <button
                  onClick={handleMobileShare}
                  className={`p-2 rounded-lg transition-all duration-200 hover:bg-white/5`}
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal raffiné */}
      <main className="relative z-10 px-4 pb-16" ref={contentRef}>
        <div className="max-w-3xl mx-auto space-y-12">
          
          {/* Titre principal épuré */}
          <section className="text-center py-12">
            <div className="space-y-4">
              <h2 className={`text-2xl md:text-3xl font-light ${designSystem.getTextClasses('primary')} text-refined`}
                  style={{ letterSpacing: '-0.02em' }}>
                {isViewingOwnMirror ? 'Votre vérité révélée' : 'Essence dévoilée'}
              </h2>
              <p className={`text-sm ${designSystem.getTextClasses('muted')} max-w-md mx-auto text-refined`}>
                Les profondeurs cristallisées
              </p>
            </div>
            
            <div className="mt-8 flex justify-center">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"></div>
            </div>
          </section>
          
          {/* Révélations avec typographie raffinée */}
          {cleanText && (
            <section className="space-y-8">
              {cleanText.split('\n\n').filter(p => p.trim().length > 20).map((paragraph, index) => (
                <div 
                  key={index}
                  data-section={index}
                  className={`fade-in ${visibleSections.has(index) ? 'visible' : ''}`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className={`elegant-border rounded-2xl p-6 md:p-8 ${designSystem.cardBackground} subtle-shadow transition-all duration-300 hover:border-purple-400/20`}>
                    
                    {/* Numéro discret */}
                    <div className="flex justify-end mb-4">
                      <span className={`text-xs font-mono ${designSystem.getTextClasses('muted')} opacity-40`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    
                    {/* Texte principal avec typographie premium */}
                    <div className="relative">
                      <p className={`text-base md:text-lg leading-loose ${designSystem.getTextClasses('primary')} text-refined`}
                         style={{ 
                           lineHeight: '1.8',
                           letterSpacing: '0.01em',
                           fontWeight: '400'
                         }}>
                        {paragraph}
                      </p>
                    </div>
                    
                    {/* Séparateur minimaliste */}
                    <div className="mt-6 flex justify-center">
                      <div className="w-6 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Analyse technique discrète */}
          {profileData.profile_json && Object.keys(profileData.profile_json).length > 0 && (
            <section className="space-y-6">
              {/* Toggle minimaliste */}
              <div className="text-center">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${designSystem.cardBackground} elegant-border hover:border-purple-400/30`}
                >
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className={`text-sm font-medium ${designSystem.getTextClasses('primary')} text-refined`}>
                    Analyse détaillée
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAnalysis ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Contenu de l'analyse */}
              {showAnalysis && (
                <div className="space-y-4">
                  {analysisSections.map((section) => {
                    const data = profileData.profile_json[section.key];
                    if (!data || (Array.isArray(data) && data.length === 0)) return null;

                    return (
                      <div 
                        key={section.key}
                        className={`elegant-border rounded-xl p-4 ${designSystem.cardBackground} subtle-shadow`}
                      >
                        {/* Header de section épuré */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`${section.color}`}>
                            {section.icon}
                          </div>
                          <h3 className={`text-sm font-medium ${designSystem.getTextClasses('primary')} text-refined`}>
                            {section.title}
                          </h3>
                        </div>
                        
                        {/* Contenu adaptatif */}
                        <div className="space-y-2">
                          {Array.isArray(data) ? (
                            data.slice(0, 3).map((item, idx) => (
                              <div key={idx} className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                <span className={`text-sm ${designSystem.getTextClasses('secondary')} text-refined`}>
                                  {typeof item === 'string' ? item : JSON.stringify(item)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className={`text-sm ${designSystem.getTextClasses('secondary')} text-refined`}>
                              {typeof data === 'string' ? data : JSON.stringify(data)}
                            </p>
                          )}
                        </div>

                        {/* Score de fiabilité discret */}
                        {section.key === 'strength_signals' && profileData.profile_json.reliability_score && (
                          <div className="mt-4 pt-3 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`${designSystem.getTextClasses('muted')} text-refined`}>
                                Fiabilité
                              </span>
                              <span className={`font-medium ${designSystem.getTextClasses('primary')}`}>
                                {Math.round(profileData.profile_json.reliability_score * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Section finale minimaliste */}
          <section className="text-center py-12 space-y-8">
            {/* Citation épurée */}
            <div className="max-w-lg mx-auto">
              <p className={`text-sm ${designSystem.getTextClasses('muted')} leading-relaxed text-refined italic`}>
                "Cette révélation a été tissée par l'intelligence d'Affinia, 
                analysant les subtilités pour révéler l'essence."
              </p>
            </div>
            
            {/* Action finale */}
            <div>
              {isViewingOwnMirror ? (
                <button
                  onClick={handleMobileShare}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${designSystem.cardBackground} elegant-border hover:border-purple-400/30`}
                >
                  <Share2 className="w-4 h-4" />
                  <span className={`text-sm font-medium ${designSystem.getTextClasses('primary')} text-refined`}>
                    Partager
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/decouverte')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${designSystem.cardBackground} elegant-border hover:border-purple-400/30`}
                >
                  <Eye className="w-4 h-4" />
                  <span className={`text-sm font-medium ${designSystem.getTextClasses('primary')} text-refined`}>
                    Explorer
                  </span>
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export { MiroirPage };