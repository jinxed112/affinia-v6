// =============================================
// MIROIR PAGE - Version Premium Ultra-Belle
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
  Quote, Compass, Diamond, Gem
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const contentRef = useRef<HTMLDivElement>(null);
  const targetUserId = profileId || user?.id;
  const isViewingOwnMirror = !profileId || profileId === user?.id;

  // Mouse tracking pour les effets parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer pour les animations au scroll
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
      { threshold: 0.3, rootMargin: '-10% 0px' }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [profileData]);

  // Scroll progress
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
      
      // Toast notification élégante
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: rgba(139, 92, 246, 0.95); backdrop-filter: blur(20px);
          color: white; padding: 16px 24px; border-radius: 16px;
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
          z-index: 9999; font-family: 'Inter', sans-serif;
          animation: toastSlide 0.3s ease-out;
        ">
          ✨ Lien copié dans le presse-papier !
        </div>
        <style>
          @keyframes toastSlide {
            from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
        </style>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  const analysisSections = [
    { 
      key: 'strength_signals', 
      title: 'Forces Dominantes', 
      icon: <Star className="w-5 h-5" />, 
      emoji: '⭐', 
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      description: 'Les forces qui vous définissent'
    },
    { 
      key: 'weakness_signals', 
      title: 'Zones Sensibles', 
      icon: <CloudRain className="w-5 h-5" />, 
      emoji: '🌧️', 
      gradient: 'from-slate-500 via-gray-500 to-zinc-500',
      description: 'Votre vulnérabilité comme beauté'
    },
    { 
      key: 'unconscious_patterns', 
      title: 'Patterns Inconscients', 
      icon: <Brain className="w-5 h-5" />, 
      emoji: '🧠', 
      gradient: 'from-violet-500 via-purple-500 to-indigo-500',
      description: 'Les mécanismes cachés de votre esprit'
    },
    { 
      key: 'ideal_partner_traits', 
      title: 'Partenaire Idéal', 
      icon: <Heart className="w-5 h-5" />, 
      emoji: '💫', 
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
      description: 'L\'âme qui résonnera avec la vôtre'
    },
    { 
      key: 'relationnal_risks', 
      title: 'Risques Relationnels', 
      icon: <Target className="w-5 h-5" />, 
      emoji: '⚠️', 
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      description: 'Les écueils à naviguer ensemble'
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center overflow-hidden relative ${designSystem.getBgClasses('primary')}`}>
        {/* Background animé plus sophistiqué */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10 px-6">
          {/* Loader plus élégant */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-purple-600/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-3 border-transparent border-t-pink-500 rounded-full animate-spin" style={{animationDuration: '0.8s', animationDirection: 'reverse'}}></div>
            </div>
            <Heart className="absolute inset-0 m-auto w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          
          <div className="space-y-3">
            <h2 className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}
                style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
              {isViewingOwnMirror ? 'Révélation de votre miroir...' : 'Accès au miroir en cours...'}
            </h2>
            <p className={`text-base ${designSystem.getTextClasses('muted')}`}>
              L'âme se dévoile dans la patience
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!mirrorAccess?.can_view || error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${designSystem.getTextClasses('primary')}`}
              style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
            {error ? 'Miroir Voilé' : 'Accès Restreint'}
          </h2>
          <p className={`mb-8 leading-relaxed ${designSystem.getTextClasses('secondary')}`}>
            {error || 'Ce miroir nécessite une permission spéciale pour être contemplé.'}
          </p>
          <BaseComponents.Button
            variant="primary"
            size="large"
            onClick={() => navigate('/decouverte')}
            className="w-full"
          >
            <Compass className="w-4 h-4 mr-2" />
            Retour à l'exploration
          </BaseComponents.Button>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${designSystem.getBgClasses('primary')}`}>
      {/* CSS pour les animations premium */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .reveal-animation {
          opacity: 0;
          transform: translateY(60px) scale(0.95);
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .reveal-animation.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        
        .hero-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dark .glass-morphism {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .floating-orb {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .text-glow {
          text-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }
        
        .parallax-bg {
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
      `}</style>

      {/* Barre de progression premium */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 shadow-lg"
             style={{ 
               width: `${readingProgress}%`,
               boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
               transition: 'width 0.3s ease'
             }} />
      </div>

      {/* Background sophistiqué avec parallax */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-pink-900/5 to-blue-900/10"></div>
        <div 
          className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl floating-orb"
          style={{
            top: '10%',
            left: `${20 + mousePosition.x * 0.02}%`,
            transform: `translateX(${mousePosition.x * 0.02}px)`
          }}
        ></div>
        <div 
          className="absolute w-64 h-64 bg-pink-600/15 rounded-full blur-3xl floating-orb"
          style={{
            bottom: '20%',
            right: `${15 + mousePosition.y * 0.03}%`,
            animationDelay: '2s',
            transform: `translateY(${mousePosition.y * 0.03}px)`
          }}
        ></div>
        <div 
          className="absolute w-80 h-80 bg-blue-600/8 rounded-full blur-3xl floating-orb"
          style={{
            top: '60%',
            left: `${60 + mousePosition.x * 0.015}%`,
            animationDelay: '4s'
          }}
        ></div>
      </div>

      {/* Header premium avec glassmorphism */}
      <header className="sticky top-0 z-40 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-morphism rounded-2xl px-6 py-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(isViewingOwnMirror ? '/profil' : '/decouverte')}
                  className="group p-3 rounded-xl glass-morphism hover:scale-105 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      {profileData.profile_info?.avatar_url ? (
                        <img 
                          src={profileData.profile_info.avatar_url} 
                          alt={profileData.profile_info.name || 'Avatar'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div>
                    <h1 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}
                        style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
                      {isViewingOwnMirror 
                        ? 'Votre Miroir de l\'Âme' 
                        : `Miroir de ${profileData.profile_info?.name || 'l\'Être'}`}
                    </h1>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')} flex items-center gap-2`}>
                      <Diamond className="w-3 h-3" />
                      {profileData.profile_info?.city || 'Dimension Spirituelle'}
                    </p>
                  </div>
                </div>
              </div>

              {isViewingOwnMirror && (
                <button
                  onClick={handleMobileShare}
                  className="group p-3 rounded-xl glass-morphism hover:scale-105 transition-all duration-300"
                >
                  <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="relative z-10 px-4 pb-12" ref={contentRef}>
        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Hero Section Dramatique */}
          <section className="text-center py-16 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent rounded-3xl"></div>
            <div className="relative space-y-8">
              <div className="space-y-4">
                <h2 className="hero-text text-4xl md:text-6xl font-bold leading-tight"
                    style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
                  {isViewingOwnMirror ? 'Votre Vérité Révélée' : 'L\'Essence Dévoilée'}
                </h2>
                <p className={`text-xl md:text-2xl ${designSystem.getTextClasses('secondary')} max-w-2xl mx-auto leading-relaxed`}
                   style={{ fontFamily: '"Inter", sans-serif', fontWeight: '300' }}>
                  Les profondeurs de l'âme cristallisées en mots
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
            </div>
          </section>
          
          {/* Section Révélations avec animations au scroll */}
          {cleanText && (
            <section className="space-y-12">
              {cleanText.split('\n\n').filter(p => p.trim().length > 20).map((paragraph, index) => (
                <div 
                  key={index}
                  data-section={index}
                  className={`reveal-animation ${visibleSections.has(index) ? 'visible' : ''}`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="group relative">
                    {/* Card premium avec effet de profondeur */}
                    <div className="glass-morphism rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden transition-all duration-700 hover:shadow-purple-500/20 hover:scale-[1.02] border-0">
                      
                      {/* Effet de brillance animé */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      {/* Ornements décoratifs */}
                      <div className="absolute top-6 left-6 w-8 h-8 opacity-30">
                        <Quote className="w-full h-full text-purple-400" />
                      </div>
                      <div className="absolute bottom-6 right-6 w-6 h-6 opacity-20">
                        <Gem className="w-full h-full text-pink-400" />
                      </div>
                      
                      {/* Numéro élégant */}
                      <div className="absolute top-6 right-6">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <span className={`text-xs font-mono ${designSystem.getTextClasses('muted')}`}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Texte principal avec typographie premium */}
                      <div className="relative z-10 pt-4">
                        <p className={`text-lg md:text-xl leading-loose ${designSystem.getTextClasses('primary')}`}
                           style={{ 
                             fontFamily: '"Inter", sans-serif',
                             lineHeight: '2',
                             letterSpacing: '0.015em',
                             fontWeight: '400'
                           }}>
                          {paragraph}
                        </p>
                      </div>
                      
                      {/* Séparateur artistique */}
                      <div className="mt-8 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                          <div className="w-12 h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"></div>
                          <div className="w-1 h-1 rounded-full bg-pink-400 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Section Analyse Technique (Plus Belle) */}
          {profileData.profile_json && Object.keys(profileData.profile_json).length > 0 && (
            <section className="space-y-8">
              {/* Toggle élégant */}
              <div className="text-center">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="group glass-morphism rounded-2xl px-8 py-4 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${designSystem.getTextClasses('primary')}`}
                          style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
                        Analyse Technique Détaillée
                      </h3>
                      <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                        Les mécanismes profonds révélés
                      </p>
                    </div>
                    <div className={`transition-transform duration-300 ${showAnalysis ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              </div>

              {/* Analyse détaillée avec animations */}
              {showAnalysis && (
                <div className="space-y-6 animate-fadeIn">
                  {analysisSections.map((section, sectionIndex) => {
                    const data = profileData.profile_json[section.key];
                    if (!data || (Array.isArray(data) && data.length === 0)) return null;

                    return (
                      <div 
                        key={section.key}
                        className="glass-morphism rounded-2xl p-6 md:p-8 shadow-xl transition-all duration-500 hover:shadow-2xl"
                        style={{ animationDelay: `${sectionIndex * 0.1}s` }}
                      >
                        {/* Header de section premium */}
                        <div className="flex items-start gap-4 mb-6">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${section.gradient} text-white shadow-lg`}>
                            {section.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{section.emoji}</span>
                              <h3 className={`text-xl font-semibold ${designSystem.getTextClasses('primary')}`}
                                  style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
                                {section.title}
                              </h3>
                            </div>
                            <p className={`text-sm ${designSystem.getTextClasses('muted')} leading-relaxed`}>
                              {section.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Contenu spécialisé */}
                        {section.key === 'ideal_partner_traits' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.isArray(data) && data.slice(0, 4).map((item, idx) => (
                              <div key={idx} className="relative">
                                <div className="glass-morphism rounded-xl p-4 text-center border border-pink-500/20 hover:border-pink-500/40 transition-colors">
                                  <div className="mb-2">
                                    <Sparkles className="w-5 h-5 text-pink-400 mx-auto" />
                                  </div>
                                  <span className={`text-sm leading-relaxed ${designSystem.getTextClasses('secondary')}`}>
                                    {typeof item === 'string' ? item : JSON.stringify(item)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Array.isArray(data) ? (
                              data.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="glass-morphism rounded-xl p-4 border border-white/5 hover:border-purple-500/20 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mt-2 flex-shrink-0"></div>
                                    <span className={`text-sm leading-relaxed ${designSystem.getTextClasses('secondary')}`}>
                                      {typeof item === 'string' ? item : JSON.stringify(item)}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className={`text-sm leading-relaxed ${designSystem.getTextClasses('secondary')}`}>
                                {typeof data === 'string' ? data : JSON.stringify(data)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Score de fiabilité avec design premium */}
                        {section.key === 'strength_signals' && profileData.profile_json.reliability_score && (
                          <div className="mt-6 pt-6 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                <span className={`font-medium ${designSystem.getTextClasses('primary')}`}>
                                  Fiabilité de l'analyse
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${profileData.profile_json.reliability_score * 100}%` }}
                                  />
                                </div>
                                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold">
                                  {Math.round(profileData.profile_json.reliability_score * 100)}%
                                </div>
                              </div>
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

          {/* Section finale premium */}
          <section className="text-center py-16 space-y-12">
            {/* Citation inspirante avec design éditorial */}
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="glass-morphism rounded-3xl p-8 md:p-12 shadow-2xl">
                <Quote className="w-12 h-12 text-purple-400 mx-auto mb-6 opacity-60" />
                <blockquote className={`text-lg md:text-xl leading-relaxed ${designSystem.getTextClasses('primary')} mb-6`}
                            style={{ fontFamily: '"Playfair Display", "Georgia", serif', fontStyle: 'italic' }}>
                  "Cette révélation de votre essence profonde a été tissée par l'intelligence d'Affinia, 
                  analysant les subtilités de votre âme pour révéler qui vous êtes vraiment."
                </blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-purple-400"></div>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-purple-400"></div>
                </div>
              </div>
              
              <p className={`text-sm italic ${designSystem.getTextClasses('muted')}`}>
                "Connaître les autres, c'est sagesse. Se connaître soi-même, c'est sagesse supérieure."
              </p>
            </div>
            
            {/* Actions finales avec style premium */}
            <div className="space-y-6">
              {isViewingOwnMirror ? (
                <button
                  onClick={handleMobileShare}
                  className="group glass-morphism rounded-2xl px-8 py-4 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-purple-500/25"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${designSystem.getTextClasses('primary')}`}>
                        Partager cette révélation
                      </h3>
                      <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                        Illuminer d'autres âmes
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/decouverte')}
                  className="group glass-morphism rounded-2xl px-8 py-4 transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${designSystem.getTextClasses('primary')}`}>
                        Explorer d'autres âmes
                      </h3>
                      <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                        Continuer le voyage
                      </p>
                    </div>
                  </div>
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