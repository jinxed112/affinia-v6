// =============================================
// MIROIR PAGE - Version moderne clean
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryService } from '../services/discoveryService';
import { supabase } from '../lib/supabase';
import { 
  Heart, Brain, Zap, Shield, Sparkles, ArrowLeft, Share2,
  Eye, Target, Flame, CloudRain, Star, User, TrendingUp, Lock, 
  AlertCircle, Calendar, Clock, Scroll, BookOpen, Feather
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

interface EmotionalPhrase {
  text: string;
  intensity: 'high' | 'medium' | 'low';
  type: 'insight' | 'paradox' | 'strength' | 'vulnerability';
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
  const [currentSection, setCurrentSection] = useState(0);

  // Déterminer quel profil afficher
  const targetUserId = profileId || user?.id;
  const isViewingOwnMirror = !profileId || profileId === user?.id;

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

      console.log('🔍 MiroirPage: Récupération des données du miroir pour:', targetUserId);

      // Récupérer d'abord le questionnaire
      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('questionnaire_responses')
        .select('generated_profile, profile_json, user_id')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaireError) {
        console.error('❌ Erreur questionnaire:', questionnaireError);
        
        if (questionnaireError.code === 'PGRST116') {
          setError('Ce profil n\'a pas encore complété son questionnaire.');
        } else {
          setError('Erreur lors de la récupération du questionnaire.');
        }
        setLoading(false);
        return;
      }

      // Récupérer ensuite les infos du profil
      const { data: profileInfo, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url, city')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil:', profileError);
        setError('Erreur lors de la récupération du profil.');
        setLoading(false);
        return;
      }

      console.log('✅ Données questionnaire récupérées:', questionnaireData);
      console.log('✅ Données profil récupérées:', profileInfo);

      // Préparer les données combinées
      setProfileData({
        generated_profile: questionnaireData.generated_profile || '',
        profile_json: questionnaireData.profile_json || {},
        user_id: questionnaireData.user_id,
        profile_info: profileInfo
      });

      // Définir les permissions d'accès
      setMirrorAccess({
        can_view: true,
        is_owner: isViewingOwnMirror,
        owner_name: profileInfo?.name || 'Utilisateur',
        owner_avatar: profileInfo?.avatar_url
      });

      // Enregistrer la lecture du miroir si ce n'est pas le propriétaire
      if (!isViewingOwnMirror) {
        await discoveryService.recordMirrorRead(targetUserId!);
      }

    } catch (err) {
      console.error('❌ Erreur lors de la récupération du miroir:', err);
      setError('Impossible de charger ce miroir.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de partage mobile améliorée
  const handleMobileShare = async () => {
    const ownerName = profileData?.profile_info?.name || 'Utilisateur';
    const shareTitle = `✨ Découvrez le miroir psychologique de ${ownerName} sur Affinia`;
    const shareText = `🔮 J'ai découvert une analyse psychologique fascinante sur Affinia ! 

🌟 Cette personne révèle des aspects profonds de sa personnalité à travers son miroir de l'âme.

💫 Affinia utilise l'IA pour créer des profils psychologiques authentiques qui révèlent votre vraie nature.

🚀 Découvrez votre propre miroir et connectez-vous avec des âmes compatibles !`;

    const shareUrl = `https://affinia.app/miroir/${targetUserId}`;

    // Vérifier si l'API Web Share est disponible (mobile)
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Partage annulé ou erreur:', error);
      }
    } else {
      // Fallback pour desktop : copier le lien et ouvrir les options
      const fullShareText = `${shareText}\n\n👉 ${shareUrl}`;
      
      // Copier dans le presse-papier
      navigator.clipboard.writeText(fullShareText).then(() => {
        // Créer des liens de partage pour différentes plateformes
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        
        // Afficher un menu de partage personnalisé
        const shareMenu = document.createElement('div');
        shareMenu.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 20px; border-radius: 15px; max-width: 400px; text-align: center;">
              <h3 style="margin-bottom: 15px; color: #333;">Partager ce miroir</h3>
              <p style="margin-bottom: 20px; color: #666; font-size: 14px;">Lien copié dans le presse-papier !</p>
              <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 15px;">
                <a href="${whatsappUrl}" target="_blank" style="padding: 10px 15px; background: #25D366; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">WhatsApp</a>
                <a href="${facebookUrl}" target="_blank" style="padding: 10px 15px; background: #1877F2; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Facebook</a>
                <a href="${twitterUrl}" target="_blank" style="padding: 10px 15px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Twitter</a>
              </div>
              <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 20px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer;">Fermer</button>
            </div>
          </div>
        `;
        document.body.appendChild(shareMenu);
      });
    }
  };

  // Parser le texte pour détecter les phrases émotionnellement fortes
  const parseEmotionalText = (rawText: string): { cleanText: string, emotionalPhrases: EmotionalPhrase[] } => {
    if (!rawText) return { cleanText: '', emotionalPhrases: [] };

    let cleanText = rawText
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

    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    const emotionalPhrases: EmotionalPhrase[] = [];

    sentences.forEach(sentence => {
      if (!sentence) return;

      let intensity: 'high' | 'medium' | 'low' = 'low';
      let type: 'insight' | 'paradox' | 'strength' | 'vulnerability' = 'insight';

      if (/\btu\s|ton\s|ta\s|tes\s/i.test(sentence)) {
        intensity = 'high';
      }

      if (/mais|cependant|pourtant|n'est pas|alors que/i.test(sentence)) {
        type = 'paradox';
        intensity = 'medium';
      }

      if (/capable|fort|puissant|talent|don|excell/i.test(sentence)) {
        type = 'strength';
        intensity = 'medium';
      }

      if (/peur|blessure|douleur|fragile|sensible|vulnérable/i.test(sentence)) {
        type = 'vulnerability';
        intensity = 'high';
      }

      if (/comprendre|réalise|découvre|révèle|essence|profond/i.test(sentence)) {
        type = 'insight';
        intensity = 'high';
      }

      if (intensity !== 'low' || sentence.length > 50) {
        emotionalPhrases.push({
          text: sentence.trim(),
          intensity,
          type
        });
      }
    });

    return { cleanText, emotionalPhrases };
  };

  const { cleanText, emotionalPhrases } = profileData ? parseEmotionalText(profileData.generated_profile) : { cleanText: '', emotionalPhrases: [] };

  // Sections de navigation automatique unifiées
  const analysisSections = [
    { 
      key: 'strength_signals', 
      title: 'Forces Dominantes', 
      icon: <Star className="w-5 h-5" />, 
      emoji: '⭐', 
      gradient: 'from-blue-500 to-cyan-500',
      synthesis: mirrorAccess?.is_owner ? 'Tu rayonnes même sans le savoir' : 'Cette personne rayonne naturellement'
    },
    { 
      key: 'weakness_signals', 
      title: 'Zones Sensibles', 
      icon: <CloudRain className="w-5 h-5" />, 
      emoji: '🌧️', 
      gradient: 'from-gray-500 to-slate-500',
      synthesis: mirrorAccess?.is_owner ? 'Ta vulnérabilité est ta plus belle force' : 'La vulnérabilité comme force'
    },
    { 
      key: 'unconscious_patterns', 
      title: 'Patterns Inconscients', 
      icon: <Brain className="w-5 h-5" />, 
      emoji: '🧠', 
      gradient: 'from-purple-500 to-violet-500',
      synthesis: mirrorAccess?.is_owner ? 'Tu cherches la clarté même dans le chaos' : 'Patterns de pensée révélateurs'
    },
    { 
      key: 'ideal_partner_traits', 
      title: 'Partenaire Idéal', 
      icon: <Heart className="w-5 h-5" />, 
      emoji: '💫', 
      gradient: 'from-pink-500 to-rose-500',
      synthesis: mirrorAccess?.is_owner ? 'Ton âme sœur te comprendra sans mots' : 'Recherche d\'une connexion profonde'
    },
    { 
      key: 'relationnal_risks', 
      title: 'Risques Relationnels', 
      icon: <Target className="w-5 h-5" />, 
      emoji: '⚠️', 
      gradient: 'from-orange-500 to-red-500',
      synthesis: mirrorAccess?.is_owner ? 'Tes défenses cachent ton cœur tendre' : 'Zones d\'attention relationnelle'
    }
  ];

  useEffect(() => {
    if (profileData?.profile_json && Object.keys(profileData.profile_json).length > 0) {
      const interval = setInterval(() => {
        setCurrentSection(prev => (prev + 1) % analysisSections.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [profileData]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />
        <div className="text-center relative z-10">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <Heart className="absolute inset-0 m-auto w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <p className={`text-lg font-medium ${designSystem.getTextClasses('primary')}`}>
            {isViewingOwnMirror ? 'Révélation de votre miroir...' : 'Accès au miroir en cours...'}
          </p>
        </div>
      </div>
    );
  }

  // Affichage si pas d'accès au miroir
  if (!mirrorAccess?.can_view) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <Lock className={`w-16 h-16 mx-auto mb-4 ${designSystem.getTextClasses('muted')}`} />
          <h2 className={`text-xl font-bold mb-4 ${designSystem.getTextClasses('primary')}`}>
            Miroir Privé
          </h2>
          <p className={`mb-6 ${designSystem.getTextClasses('secondary')}`}>
            Ce miroir n'est pas accessible. Vous devez demander l'autorisation au propriétaire.
          </p>
          <div className="space-y-3">
            <BaseComponents.Button
              variant="primary"
              size="large"
              onClick={() => navigate('/decouverte')}
            >
              Retour à la découverte
            </BaseComponents.Button>
            <BaseComponents.Button
              variant="secondary"
              size="large"
              onClick={() => navigate('/demandes-miroir')}
            >
              Mes demandes
            </BaseComponents.Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <CloudRain className={`w-16 h-16 mx-auto mb-4 ${designSystem.getTextClasses('muted')}`} />
          <h2 className={`text-xl font-bold mb-4 ${designSystem.getTextClasses('primary')}`}>
            Miroir non disponible
          </h2>
          <p className={`mb-6 ${designSystem.getTextClasses('secondary')}`}>
            {error}
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
    <div className={`min-h-screen transition-all duration-500 ${designSystem.getBgClasses('primary')}`}>
      {/* Styles CSS modernes */}
      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .card-hover {
          transition: all 0.2s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      
      {/* Background mystique unifié */}
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="high" />

      {/* Container principal */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        
        {/* Header simplifié */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(isViewingOwnMirror ? '/profil' : '/decouverte')}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
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
                
                <div>
                  <h1 className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                    {isViewingOwnMirror 
                      ? 'Votre Miroir de l\'Âme' 
                      : `Miroir de ${profileData.profile_info?.name || 'l\'Utilisateur'}`}
                  </h1>
                  <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                    {profileData.profile_info?.city && `📍 ${profileData.profile_info.city}`}
                    {!isViewingOwnMirror && mirrorAccess?.access_expires && (
                      <span className="ml-2 text-orange-400">
                        • Accès temporaire
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Badge accès temporaire uniquement */}
            {!isViewingOwnMirror && mirrorAccess?.access_expires && (
              <BaseComponents.Badge variant="warning" isDarkMode={isDarkMode}>
                <Clock className="w-3 h-3 mr-1" />
                Accès temporaire
              </BaseComponents.Badge>
            )}
          </div>
        </div>
        
        {/* Grid principal : Analyse + Texte */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          
          {/* Colonne gauche : Analyse structurée */}
          <div className="space-y-8">

            {profileData.profile_json && Object.keys(profileData.profile_json).length > 0 ? (
              <div className="space-y-6">
                {analysisSections.map((section, index) => {
                  const data = profileData.profile_json[section.key];
                  if (!data || (Array.isArray(data) && data.length === 0)) return null;

                  const isActive = index === currentSection;

                  return (
                    <BaseComponents.Card
                      key={section.key}
                      isDarkMode={isDarkMode}
                      variant={isActive ? "highlighted" : "default"}
                      className={`p-6 cursor-pointer transition-all duration-300 ${
                        isActive ? 'border-purple-500/30 shadow-lg' : ''
                      }`}
                      onClick={() => setCurrentSection(index)}
                    >
                      {/* Header simplifié */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${section.gradient} text-white`}>
                            {section.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{section.emoji}</span>
                              <h3 className={`text-base font-semibold ${designSystem.getTextClasses('primary')}`}
                                  style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                                {section.title}
                              </h3>
                            </div>
                            <p className={`text-xs ${designSystem.getTextClasses('muted')}`}
                               style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                              {section.synthesis}
                            </p>
                          </div>
                        </div>
                        
                        {/* Indicateur d'activité */}
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        )}
                      </div>
                      
                      {/* Contenu adapté selon la section */}
                      {section.key === 'ideal_partner_traits' ? (
                        <BaseComponents.Card 
                          isDarkMode={isDarkMode}
                          variant="glass"
                          className="p-5 border border-pink-500/20"
                        >
                          <div className="text-center mb-4">
                            <span className="text-2xl">🔮</span>
                            <p className={`text-sm font-medium mt-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}
                               style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                              {isViewingOwnMirror ? 'Votre Partenaire Idéal' : 'Partenaire Recherché'}
                            </p>
                          </div>
                          {Array.isArray(data) && (
                            <div className="space-y-3">
                              {data.slice(0, 3).map((item, idx) => (
                                <BaseComponents.Card 
                                  key={idx} 
                                  isDarkMode={isDarkMode} 
                                  variant="default" 
                                  className="p-3 text-center hover:shadow-md transition-shadow"
                                >
                                  <span className={`text-sm leading-relaxed ${designSystem.getTextClasses('secondary')}`}
                                        style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                                    ✨ {typeof item === 'string' ? item : item.text || item.description || JSON.stringify(item)}
                                  </span>
                                </BaseComponents.Card>
                              ))}
                            </div>
                          )}
                        </BaseComponents.Card>
                      ) : (
                        Array.isArray(data) ? (
                          <div className="space-y-3">
                            {data.slice(0, 4).map((item, idx) => (
                              <BaseComponents.Card 
                                key={idx} 
                                isDarkMode={isDarkMode} 
                                variant="default" 
                                className="p-4 hover:shadow-md transition-shadow"
                              >
                                <span className={`text-sm leading-relaxed ${designSystem.getTextClasses('secondary')}`}
                                      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                                  • {typeof item === 'string' ? item : item.text || item.description || JSON.stringify(item)}
                                </span>
                              </BaseComponents.Card>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-sm leading-relaxed ${designSystem.getTextClasses('secondary')}`}
                             style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                            {typeof data === 'string' ? data : JSON.stringify(data)}
                          </p>
                        )
                      )}

                      {/* Score de fiabilité simplifié */}
                      {section.key === 'strength_signals' && profileData.profile_json.reliability_score && (
                        <div className="mt-5 pt-4 border-t border-gray-600/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-green-500" />
                              <span className={`text-xs ${designSystem.getTextClasses('muted')}`}
                                    style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                                Fiabilité de l'analyse
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-1.5 rounded-full ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                                  style={{ width: `${profileData.profile_json.reliability_score * 100}%` }}
                                />
                              </div>
                              <BaseComponents.Badge variant="success" isDarkMode={isDarkMode}>
                                {Math.round(profileData.profile_json.reliability_score * 100)}%
                              </BaseComponents.Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </BaseComponents.Card>
                  );
                })}

                {/* Navigation dots simplifiée */}
                <div className="flex justify-center gap-2 mt-6">
                  {analysisSections.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSection(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentSection
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 scale-125'
                          : isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-8">
                <p className={`text-center ${designSystem.getTextClasses('muted')}`}>
                  Analyse en cours de génération...
                </p>
              </BaseComponents.Card>
            )}
          </div>

          {/* COLONNE DROITE : Révélations Dramatiques */}
          <div className="lg:col-span-2">
            {cleanText && (
              <div className="space-y-8">
                {/* Header dramatique */}
                <div className="mb-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-2 h-16 bg-gradient-to-b from-purple-500 via-pink-500 to-purple-600 rounded-full"></div>
                    <div>
                      <h3 className={`text-3xl font-bold ${designSystem.getTextClasses('primary')} tracking-tight`}
                          style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                        {isViewingOwnMirror ? 'Votre Vérité Révélée' : 'Analyse de l\'Âme'}
                      </h3>
                      <p className={`text-lg mt-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium`}
                         style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                        Les profondeurs de votre être dévoilées
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Révélations uniformes ultra-puissantes */}
                <div className="space-y-8">
                  {cleanText.split('\n\n').filter(p => p.trim().length > 20).map((paragraph, index) => {
                    return (
                      <div key={index} className="group relative">
                        {/* Card principale avec effet dramatique */}
                        <BaseComponents.Card
                          isDarkMode={isDarkMode}
                          variant="default"
                          className="relative overflow-hidden p-10 transition-all duration-700 hover:shadow-2xl hover:scale-[1.02] border-0"
                          style={{
                            background: isDarkMode 
                              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(236, 72, 153, 0.06) 50%, rgba(139, 92, 246, 0.06) 100%)'
                              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(236, 72, 153, 0.04) 50%, rgba(139, 92, 246, 0.04) 100%)',
                            borderLeft: '4px solid',
                            borderImage: 'linear-gradient(to bottom, #8B5CF6, #EC4899, #8B5CF6) 1'
                          }}
                        >
                          {/* Effet de brillance au hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          {/* Ornement en haut à droite */}
                          <div className="absolute top-6 right-6 w-8 h-8 opacity-20">
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                          </div>
                          
                          {/* Texte révélation */}
                          <div className="relative z-10">
                            <p className={`text-xl leading-relaxed font-medium ${designSystem.getTextClasses('primary')}`}
                            style={{ 
                              fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
                              lineHeight: '1.9',
                              letterSpacing: '0.02em',
                              fontWeight: '500'
                            }}>
                              {paragraph}
                            </p>
                          </div>
                          
                          {/* Signature énergétique en bas */}
                          <div className="mt-8 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                              <div className="w-3 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                              <div className="w-1 h-1 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                            </div>
                            <span className={`text-xs font-mono ${designSystem.getTextClasses('muted')} opacity-50`}>
                              {String(index + 1).padStart(2, '0')} / {cleanText.split('\n\n').filter(p => p.trim().length > 20).length.toString().padStart(2, '0')}
                            </span>
                          </div>
                        </BaseComponents.Card>
                      </div>
                    );
                  })}
                </div>
                
                {/* Footer dramatique */}
                <div className="mt-16 pt-12 border-t border-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20">
                  <div className="text-center space-y-8">
                    
                    {/* Signature émotionnelle */}
                    <div className="max-w-md mx-auto">
                      <p className={`text-base font-medium leading-relaxed ${designSystem.getTextClasses('secondary')}`}
                         style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                        Cette révélation de votre essence profonde a été tissée par l'intelligence d'Affinia, 
                        analysant les subtilités de votre âme pour révéler qui vous êtes vraiment.
                      </p>
                    </div>
                    
                    {/* Actions selon le type d'utilisateur */}
                    <div className="space-y-4">
                      {/* Action principale - Partage (uniquement pour son propre miroir) */}
                      {isViewingOwnMirror && (
                        <BaseComponents.Button 
                          variant="primary" 
                          size="large"
                          onClick={handleMobileShare}
                          className="group relative overflow-hidden px-8 py-4"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center gap-3">
                            <Share2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <span className="font-medium">Partager cette révélation</span>
                          </div>
                        </BaseComponents.Button>
                      )}
                      
                      {/* Action secondaire pour visiteurs */}
                      {!isViewingOwnMirror && (
                        <BaseComponents.Button 
                          variant="secondary" 
                          size="medium"
                          onClick={() => navigate('/decouverte')}
                          className="group"
                        >
                          <Eye className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                          Explorer d'autres âmes
                        </BaseComponents.Button>
                      )}
                    </div>
                    
                    {/* Citation finale */}
                    <div className="pt-8">
                      <p className={`text-sm italic ${designSystem.getTextClasses('muted')} max-w-lg mx-auto`}
                         style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
                        "Connaître les autres, c'est sagesse. Se connaître soi-même, c'est sagesse supérieure."
                      </p>
                      <p className={`text-xs mt-2 ${designSystem.getTextClasses('muted')}`}>
                        — Affinia AI, révélateur d'âmes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { MiroirPage };