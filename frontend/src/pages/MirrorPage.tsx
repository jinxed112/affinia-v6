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

interface MirrorPageProps {
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

const MirrorPage: React.FC<MirrorPageProps> = ({ isDarkMode = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();  // ✅ CORRIGÉ : était profileId
  const designSystem = useDesignSystem(isDarkMode);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [mirrorAccess, setMirrorAccess] = useState<MirrorAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const [requestingConversation, setRequestingConversation] = useState(false);  // ✅ NOUVEAU
  const [conversationRequested, setConversationRequested] = useState(false);   // ✅ NOUVEAU

  const contentRef = useRef<HTMLDivElement>(null);
  const targetUserId = id || user?.id;  // ✅ CORRIGÉ : était profileId
  const isViewingOwnMirror = !id || id === user?.id;  // ✅ CORRIGÉ : était profileId

  // Couleurs élégantes pour les sections
  const sectionColors = [
    { bg: 'from-purple-900/10 to-indigo-900/10', accent: 'purple-400', glow: 'purple-500/20' },
    { bg: 'from-indigo-900/10 to-violet-900/10', accent: 'indigo-400', glow: 'indigo-500/20' },
    { bg: 'from-violet-900/10 to-purple-900/10', accent: 'violet-400', glow: 'violet-500/20' },
    { bg: 'from-rose-900/10 to-pink-900/10', accent: 'rose-400', glow: 'rose-500/20' },
  ];

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

  // ✅ NOUVELLE FONCTION : Demande de conversation
  const handleConversationRequest = async () => {
    if (!targetUserId || isViewingOwnMirror || conversationRequested) return;

    try {
      setRequestingConversation(true);

      // Appel à l'API pour créer une demande de conversation
      const response = await fetch('/api/conversations/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.session?.access_token}`
        },
        body: JSON.stringify({
          receiverId: targetUserId
        })
      });

      if (response.ok) {
        setConversationRequested(true);
        
        // Toast de succès
        const toast = document.createElement('div');
        toast.innerHTML = `
          <div style="
            position: fixed; top: 32px; right: 32px;
            background: rgba(16, 185, 129, 0.9); backdrop-filter: blur(12px);
            color: white; padding: 12px 20px; border-radius: 8px;
            font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
            z-index: 9999; opacity: 0; transform: translateY(-10px);
            transition: all 0.3s ease;
          ">
            Demande envoyée ! 💬
          </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.firstElementChild!.style.opacity = '1';
          toast.firstElementChild!.style.transform = 'translateY(0)';
        }, 10);
        
        setTimeout(() => {
          toast.firstElementChild!.style.opacity = '0';
          toast.firstElementChild!.style.transform = 'translateY(-10px)';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
        
      } else {
        throw new Error('Erreur lors de la demande');
      }

    } catch (error) {
      console.error('Erreur demande conversation:', error);
      
      // Toast d'erreur
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed; top: 32px; right: 32px;
          background: rgba(239, 68, 68, 0.9); backdrop-filter: blur(12px);
          color: white; padding: 12px 20px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
          z-index: 9999; opacity: 0; transform: translateY(-10px);
          transition: all 0.3s ease;
        ">
          Erreur lors de l'envoi
        </div>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.firstElementChild!.style.opacity = '1';
        toast.firstElementChild!.style.transform = 'translateY(0)';
      }, 10);
      
      setTimeout(() => {
        toast.firstElementChild!.style.opacity = '0';
        toast.firstElementChild!.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }, 3000);

    } finally {
      setRequestingConversation(false);
    }
  };

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

  const cleanText = profileData ? parseEmotionalText(profileData.generated_profile) : '';

  return (
    <div className={`min-h-screen ${designSystem.getBgClasses('primary')} relative overflow-hidden`}>
      {/* CSS pour le style raffiné */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Crimson+Text:ital@0;1&display=swap');
        
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
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
        
        .text-serif {
          font-family: 'Crimson Text', Georgia, serif;
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
        
        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }
        
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(168, 85, 247, 0.3);
          border-radius: 50%;
          animation: float 20s infinite linear;
        }
        
        @keyframes float {
          0% { transform: translateY(100vh) translateX(-10px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(10px); opacity: 0; }
        }
        
        .breathing {
          animation: breathe 4s ease-in-out infinite;
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
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

      {/* Particules flottantes subtiles */}
      <div className="floating-particles">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Progress bar ultra-fine */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-px bg-purple-600/60 transition-all duration-500"
             style={{ width: `${readingProgress}%` }} />
      </div>

      {/* Boutons flottants discrets */}
      <div className="fixed top-6 left-6 z-40">
        <button 
          className="p-3 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 transition-all duration-200 hover:bg-slate-800/80 hover:border-purple-400/30"
          onClick={() => navigate(isViewingOwnMirror ? '/profil' : '/decouverte')}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {isViewingOwnMirror && (
        <div className="fixed top-6 right-6 z-40">
          <button 
            className="p-3 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 transition-all duration-200 hover:bg-slate-800/80 hover:border-purple-400/30"
            onClick={handleMobileShare}
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Contenu principal raffiné */}
      <main className="relative z-10 px-4 pb-16 pt-6" ref={contentRef}>
        <div className="max-w-3xl mx-auto space-y-12">
          
          {/* Révélations avec typographie raffinée */}
          {cleanText && (
            <section className="space-y-8">
              {cleanText.split('\n\n').filter(p => p.trim().length > 20).map((paragraph, index) => {
                const colorScheme = sectionColors[index % sectionColors.length];
                const isVisible = visibleSections.has(index);
                
                return (
                  <div 
                    key={index}
                    data-section={index}
                    className={`fade-in ${isVisible ? 'visible' : ''} breathing`}
                    style={{ transitionDelay: `${index * 0.1}s` }}
                  >
                    <div className={`
                      relative elegant-border rounded-2xl p-6 md:p-8 
                      ${designSystem.cardBackground} subtle-shadow 
                      transition-all duration-300 hover:border-purple-400/20
                      bg-gradient-to-br ${colorScheme.bg}
                      group
                    `}>
                      
                      {/* Lueur subtile au hover */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-${colorScheme.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-xl`} />
                      
                      {/* Numéro discret et ornement */}
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
                      
                      {/* Texte principal avec typographie premium */}
                      <div className="relative">
                        {/* Guillemets décoratifs */}
                        <div className="quote-mark absolute -left-4 -top-2">"</div>
                        
                        <div className={`text-base md:text-lg leading-loose ${designSystem.getTextClasses('primary')} text-refined`}>
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
                        
                        {/* Guillemet fermant */}
                        <div className="quote-mark absolute -right-4 -bottom-2 rotate-180">"</div>
                      </div>
                      
                      {/* Constellation décorative */}
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

          {/* Section finale minimaliste avec nouveau bouton conversation */}
          <section className="text-center py-12 space-y-8">
            {/* Citation épurée */}
            <div className="max-w-lg mx-auto">
              <p className={`text-sm ${designSystem.getTextClasses('muted')} leading-relaxed text-refined italic`}>
                "Cette révélation a été tissée par l'intelligence d'Affinia, 
                analysant les subtilités pour révéler l'essence."
              </p>
            </div>
            
            {/* ✅ NOUVELLES ACTIONS avec bouton conversation */}
            <div className="space-y-4">
              {/* Bouton demande de conversation (seulement pour les autres profils) */}
              {!isViewingOwnMirror && (
                <div className="max-w-md mx-auto">
                  <div className={`p-6 rounded-2xl ${designSystem.cardBackground} elegant-border space-y-4`}>
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className={`text-lg font-medium ${designSystem.getTextClasses('primary')} text-refined`}>
                        Cette âme vous intrigue ?
                      </h3>
                      <p className={`text-sm ${designSystem.getTextClasses('secondary')} text-refined leading-relaxed`}>
                        Si cette analyse psychologique résonne avec vous, 
                        proposez une conversation pour approfondir cette connexion.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleConversationRequest}
                      disabled={requestingConversation || conversationRequested}
                      className={`
                        w-full px-6 py-3 rounded-xl font-medium text-refined transition-all duration-300
                        ${conversationRequested 
                          ? 'bg-green-600/20 border border-green-400/30 text-green-400 cursor-default' 
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25'
                        }
                        ${requestingConversation ? 'opacity-70 cursor-wait' : ''}
                        disabled:transform-none disabled:shadow-none
                      `}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {requestingConversation ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Envoi en cours...</span>
                          </>
                        ) : conversationRequested ? (
                          <>
                            <Heart className="w-4 h-4" />
                            <span>Demande envoyée ✨</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4" />
                            <span>Proposer une conversation</span>
                          </>
                        )}
                      </div>
                    </button>
                    
                    {conversationRequested && (
                      <p className={`text-xs ${designSystem.getTextClasses('muted')} text-refined italic`}>
                        Vous recevrez une notification si {mirrorAccess?.owner_name} accepte votre proposition.
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action par défaut */}
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
                      Explorer d'autres âmes
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export { MirrorPage };