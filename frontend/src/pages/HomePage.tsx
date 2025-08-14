// HomePage.tsx - LAYOUT FIXÉ + MOBILE OPTIMISÉ
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Sparkles, Shield, Star, Trophy, Zap, Brain,
  Target, Eye, Camera, Users, ChevronRight, Award,
  Plus, Circle, Check, Settings, MapPin, User,
  FileText, Calendar, ArrowRight, TrendingUp, Gem,
  MessageCircle, Mail, Bell, BookOpen
} from 'lucide-react'
import { AffiniaCard } from '../components/profile/AffiniaCard'
import { useDesignSystem } from '../styles/designSystem'
import { BaseComponents } from '../components/ui/BaseComponents'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import ProfileExtendedService from '../services/profileExtendedService'
import type { ProfilePhoto } from '../types/profile'

interface HomePageProps {
  isDarkMode?: boolean
}

// 🚀 Composant du ring de completion MEMOIZED
const CompletionRing = memo(({ percentage, isDarkMode }: { percentage: number; isDarkMode: boolean }) => {
  const ringStyle = useMemo(() => ({
    background: `conic-gradient(
      from 0deg,
      #a855f7 0deg,
      #ec4899 ${percentage * 3.6}deg,
      #374151 ${percentage * 3.6}deg,
      #374151 360deg
    )`
  }), [percentage]);

  return (
    <div className="relative flex-shrink-0">
      <div 
        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center relative"
        style={ringStyle}
      >
        <div 
          className="absolute inset-1 sm:inset-1.5 lg:inset-2 rounded-full"
          style={{ background: isDarkMode ? '#0f172a' : '#ffffff' }}
        />
        <div className="text-center relative z-10">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            {percentage}%
          </div>
          <div className="text-xs text-gray-400">
            Complet
          </div>
        </div>
      </div>

      {/* Particules - seulement sur desktop */}
      <div className="absolute inset-0 animate-spin hidden lg:block" style={{ animation: 'spin 20s linear infinite' }}>
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '1s' }} />
        <div className="absolute left-0 top-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '2s' }} />
        <div className="absolute right-0 top-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '3s' }} />
      </div>
    </div>
  );
});

CompletionRing.displayName = 'CompletionRing';

// 🚀 Composant Step MEMOIZED - MOBILE OPTIMISÉ
const CompletionStep = memo(({ 
  step, 
  index, 
  designSystem,
  isMobile 
}: { 
  step: any; 
  index: number; 
  designSystem: any;
  isMobile?: boolean;
}) => {
  const handleClick = useCallback(() => {
    step.action();
  }, [step]);

  return (
    <div
      className={`flex items-center justify-between p-3 lg:p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer ${
        step.completed
          ? 'bg-green-500/10 border border-green-500/20'
          : `${step.bgColor} border border-current/20`
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          step.completed
            ? 'bg-green-500/20 text-green-400'
            : `${step.bgColor} ${step.textColor}`
        }`}>
          <step.icon className="w-5 h-5 lg:w-6 lg:h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm lg:text-base ${designSystem.getTextClasses('primary')} truncate`}>
            {step.title}
          </h3>
          <p className={`text-xs lg:text-sm ${
            step.completed ? 'text-green-400' : step.textColor
          } truncate`}>
            {step.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
        {/* 📱 JAUGE VERTICALE MOBILE / HORIZONTALE DESKTOP */}
        {isMobile ? (
          <div className="w-2 h-12 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`w-full rounded-full transition-all duration-1000 ${
                step.completed
                  ? 'bg-gradient-to-t from-green-500 to-emerald-500'
                  : `bg-gradient-to-t ${step.color}`
              }`}
              style={{ height: `${step.progress}%` }}
            />
          </div>
        ) : (
          <div className="w-16 lg:w-24 bg-gray-700 rounded-full h-1.5 lg:h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                step.completed
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : `bg-gradient-to-r ${step.color}`
              }`}
              style={{ width: `${step.progress}%` }}
            />
          </div>
        )}

        <span className={`text-xs font-medium ${isMobile ? 'block' : 'hidden sm:block'} ${
          step.completed ? 'text-green-400' : step.textColor
        }`}>
          {step.progress}%
        </span>

        <ChevronRight className={`w-4 h-4 lg:w-5 lg:h-5 ${designSystem.getTextClasses('muted')} flex-shrink-0`} />
      </div>
    </div>
  );
});

CompletionStep.displayName = 'CompletionStep';

// 🚀 Composant Action Card MEMOIZED
const ActionCard = memo(({ 
  action, 
  designSystem 
}: { 
  action: any; 
  designSystem: any;
}) => {
  const handleClick = useCallback(() => {
    if (action.available) {
      action.action();
    }
  }, [action]);

  return (
    <BaseComponents.Card
      isDarkMode={true}
      variant="default"
      className={`p-4 lg:p-6 cursor-pointer relative overflow-hidden h-full ${
        !action.available ? 'opacity-50' : ''
      }`}
      onClick={handleClick}
      hover={action.available}
    >
      {action.badge && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
          {action.badge}
        </div>
      )}

      {!action.available && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Shield className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Questionnaire requis</p>
          </div>
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${action.bgColor} transition-transform duration-200 hover:scale-110`}>
        <action.icon className="w-6 h-6 text-white" />
      </div>

      <h3 className={`text-base lg:text-lg font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
        {action.title}
      </h3>
      <p className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
        {action.description}
      </p>
    </BaseComponents.Card>
  );
});

ActionCard.displayName = 'ActionCard';

export const HomePage: React.FC<HomePageProps> = ({ isDarkMode = true }) => {
  const { user } = useAuth()
  const { profile, questionnaire, loading, error, refreshProfile } = useProfile()
  const navigate = useNavigate()
  const designSystem = useDesignSystem(isDarkMode)

  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [isDataReady, setIsDataReady] = useState(false)

  // 🚀 Classes communes mémorisées directement
  const commonClasses = useMemo(() => ({
    // Layout
    container: 'max-w-6xl mx-auto px-4',
    section: 'py-8 sm:py-12 px-4',
    
    // Text
    textPrimary: designSystem.getTextClasses('primary'),
    textSecondary: designSystem.getTextClasses('secondary'),
    textMuted: designSystem.getTextClasses('muted'),
    
    // Backgrounds
    bgPrimary: designSystem.getBgClasses('primary'),
    bgSecondary: designSystem.getBgClasses('secondary'),
    bgCard: designSystem.getBgClasses('card'),
    
    // Utils
    gradientText: 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent',
  }), [designSystem])

  // 🚀 Vérification questionnaire MEMOIZED
  const hasCompletedQuestionnaire = useMemo(() => {
    if (!questionnaire) return false

    if (questionnaire.profile_json) return true
    if (questionnaire.generated_profile && questionnaire.generated_profile.length > 100) return true
    if (questionnaire.answers && Object.keys(questionnaire.answers).length > 2) return true

    return false
  }, [questionnaire])

  // 🚀 Chargement photos
  const loadPhotos = useCallback(async () => {
    if (!user) return
    
    try {
      setLoadingPhotos(true)
      const userPhotos = await ProfileExtendedService.getUserPhotos(user.id)
      setPhotos(userPhotos)
    } catch (error) {
      console.error('Erreur photos:', error)
      setPhotos([])
    } finally {
      setLoadingPhotos(false)
    }
  }, [user])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  // 🚀 État de données prêtes
  useEffect(() => {
    if (!loading && !loadingPhotos) {
      const timer = setTimeout(() => setIsDataReady(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsDataReady(false)
    }
  }, [loading, loadingPhotos])

  // 🚀 Données profil MEMOIZED
  const profileData = useMemo(() => {
    const completeness = ProfileExtendedService.calculateProfileCompleteness(profile, questionnaire, photos)
    const completenessPercentage = Math.round(completeness.percentage)
    const userName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur'
    
    return {
      completeness,
      completenessPercentage,
      userName
    }
  }, [profile, questionnaire, photos, user])

  // 🚀 Étapes de completion MEMOIZED
  const completionSteps = useMemo(() => {
    const steps = [
      {
        id: 'photos',
        title: 'Ajouter des photos',
        description: `${photos.length}/6 photos • +${photos.length > 0 ? '20' : '25'}% de visites`,
        icon: Camera,
        completed: photos.length > 0,
        progress: Math.round(Math.min((photos.length / 6) * 100, 100)),
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-400',
        action: () => navigate('/profil#photos'),
        priority: photos.length === 0 ? 1 : 3
      },
      {
        id: 'bio',
        title: 'Écrire une bio',
        description: `${profile?.bio ? 'Bio écrite' : 'Raconte ton essence'} • +15% compatibilité`,
        icon: FileText,
        completed: !!profile?.bio,
        progress: profile?.bio ? 100 : 0,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400',
        action: () => navigate('/profil#bio'),
        priority: !profile?.bio ? 2 : 4
      },
      {
        id: 'location',
        title: 'Définir ma localisation',
        description: `${profile?.city ? profile.city : 'Ajouter ma ville'} • Découverte locale`,
        icon: MapPin,
        completed: !!profile?.city,
        progress: profile?.city ? 100 : 0,
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-400',
        action: () => navigate('/profil#location'),
        priority: !profile?.city ? 3 : 5
      },
      {
        id: 'questionnaire',
        title: 'Questionnaire psychologique',
        description: hasCompletedQuestionnaire ? 'Profil débloqué • Miroir disponible' : 'Débloquer ton miroir psychologique',
        icon: Brain,
        completed: hasCompletedQuestionnaire,
        progress: hasCompletedQuestionnaire ? 100 : 0,
        color: 'from-purple-500 to-violet-500',
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-400',
        action: () => hasCompletedQuestionnaire ? navigate('/miroir') : navigate('/questionnaire'),
        priority: hasCompletedQuestionnaire ? 6 : 1
      }
    ]

    return steps.sort((a, b) => a.priority - b.priority)
  }, [photos.length, profile?.bio, profile?.city, hasCompletedQuestionnaire, navigate])

  // 🚀 Actions rapides MEMOIZED
  const quickActions = useMemo(() => [
    {
      id: 'discovery',
      title: 'Découvrir des âmes',
      description: 'Explore les profils compatibles',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/20',
      action: () => navigate('/decouverte'),
      available: hasCompletedQuestionnaire
    },
    {
      id: 'requests',
      title: 'Mes demandes',
      description: 'Gère tes demandes de miroir',
      icon: Mail,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/20',
      action: () => navigate('/demandes'),
      available: true
    },
    {
      id: 'mirror',
      title: 'Mon miroir',
      description: 'Ton analyse psychologique',
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/20',
      action: () => navigate('/miroir'),
      available: hasCompletedQuestionnaire
    },
    {
      id: 'chat',
      title: 'Messages',
      description: 'Tes conversations',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      action: () => navigate('/chat'),
      available: true
    }
  ], [hasCompletedQuestionnaire, navigate])

  // 🚀 Smart tip MEMOIZED
  const smartTip = useMemo(() => {
    if (photos.length === 0) {
      return {
        title: 'Optimise ta visibilité',
        description: 'Ajoute des photos pour +40% de connexions.',
        action: 'Ajouter des photos',
        onClick: () => navigate('/profil#photos'),
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-300',
        icon: Camera
      }
    }

    if (!profile?.bio) {
      return {
        title: 'Raconte ton histoire',
        description: 'Une bio augmente tes compatibilités de 35%.',
        action: 'Écrire ma bio',
        onClick: () => navigate('/profil#bio'),
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-300',
        icon: FileText
      }
    }

    if (!hasCompletedQuestionnaire) {
      return {
        title: 'Débloque ton potentiel',
        description: 'Complète le questionnaire pour la découverte.',
        action: 'Faire le questionnaire',
        onClick: () => navigate('/questionnaire'),
        color: 'from-purple-500 to-violet-500',
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-300',
        icon: Brain
      }
    }

    return {
      title: 'Profil optimisé !',
      description: 'Prêt pour des connexions authentiques.',
      action: 'Découvrir des âmes',
      onClick: () => navigate('/decouverte'),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-300',
      icon: Heart
    }
  }, [photos.length, profile?.bio, hasCompletedQuestionnaire, navigate])

  // 🚀 LOADING STATES
  if (loading || loadingPhotos || !isDataReady) {
    return (
      <div className={`min-h-screen ${commonClasses.bgPrimary}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="pt-20 pb-8 px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="relative mb-6">
                <BaseComponents.Spinner size="large" color="purple" />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${commonClasses.textPrimary}`}>
                Chargement de ton univers...
              </h2>
              <p className={`text-sm ${commonClasses.textSecondary} max-w-xs`}>
                Préparation de ton profil mystique
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${commonClasses.bgPrimary}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="pt-20 pb-8 px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className={`text-xl font-bold mb-2 ${commonClasses.textPrimary}`}>
                Connexion interrompue
              </h2>
              <p className={`${commonClasses.textSecondary} mb-6 max-w-xs mx-auto`}>
                Vérifie ta connexion et réessaye
              </p>
              <BaseComponents.Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </BaseComponents.Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${commonClasses.bgPrimary}`}>
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />

      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">

          {/* 📱 NOUVEAU LAYOUT SANS TROU - MOBILE-FIRST */}
          <div className="space-y-6">

            {/* 🎯 SECTION HERO + SMART TIP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* HERO COMPLETION - PREND 2 COLONNES SUR DESKTOP */}
              <div className="lg:col-span-2">
                <BaseComponents.Card
                  isDarkMode={isDarkMode}
                  variant="highlighted"
                  className="p-6 lg:p-8"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <CompletionRing 
                      percentage={profileData.completenessPercentage} 
                      isDarkMode={isDarkMode} 
                    />

                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4 leading-tight">
                        <span className={commonClasses.textPrimary}>Finalise ton </span>
                        <span className={commonClasses.gradientText}>profil mystique</span>
                      </h1>
                      <p className={`text-base lg:text-lg ${commonClasses.textSecondary} mb-4 lg:mb-6`}>
                        Plus ton profil est complet, plus tes connexions seront authentiques, {profileData.userName}.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                        <BaseComponents.Button
                          variant="primary"
                          size="medium"
                          onClick={() => navigate('/profil')}
                          fullWidth={designSystem.isMobile}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Compléter maintenant
                        </BaseComponents.Button>

                        {hasCompletedQuestionnaire && (
                          <BaseComponents.Button
                            variant="secondary"
                            size="medium"
                            onClick={() => navigate('/decouverte')}
                            fullWidth={designSystem.isMobile}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Découvrir
                          </BaseComponents.Button>
                        )}
                      </div>
                    </div>
                  </div>
                </BaseComponents.Card>
              </div>

              {/* 💡 SMART TIP - PREND 1 COLONNE SUR DESKTOP */}
              <div className="lg:col-span-1">
                <BaseComponents.Card
                  isDarkMode={isDarkMode}
                  variant="default"
                  className="p-4 h-full"
                >
                  <div className={`rounded-xl p-4 border h-full flex flex-col justify-center ${smartTip.bgColor} border-current/20`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${smartTip.bgColor} flex-shrink-0`}>
                        <smartTip.icon className={`w-4 h-4 ${smartTip.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold mb-1 ${smartTip.textColor} text-sm`}>
                          {smartTip.title}
                        </h4>
                        <p className={`text-xs mb-3 ${smartTip.textColor} opacity-90`}>
                          {smartTip.description}
                        </p>
                        <BaseComponents.Button
                          variant="ghost"
                          size="small"
                          onClick={smartTip.onClick}
                          className={`${smartTip.bgColor} hover:opacity-80 ${smartTip.textColor}`}
                        >
                          {smartTip.action}
                        </BaseComponents.Button>
                      </div>
                    </div>
                  </div>
                </BaseComponents.Card>
              </div>
            </div>

            {/* 🎴 CARTE AFFINIA - MOBILE SEULEMENT */}
            {hasCompletedQuestionnaire && (
              <div className="lg:hidden">
                <BaseComponents.Card
                  isDarkMode={isDarkMode}
                  variant="highlighted"
                  className="p-4"
                >
                  <div className="text-center">
                    <h3 className={`text-lg font-bold mb-3 ${commonClasses.textPrimary}`}>
                      🎴 Ta carte mystique
                    </h3>
                    
                    <div className="flex justify-center mb-4">
                      <div className="w-full max-w-[280px]">
                        <AffiniaCard
                          photos={photos}
                          profile={profile}
                          questionnaire={questionnaire}
                          className="transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    </div>
                    
                    <BaseComponents.Button
                      variant="secondary"
                      size="small"
                      onClick={() => navigate('/miroir')}
                      fullWidth
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Voir le miroir complet
                    </BaseComponents.Button>
                  </div>
                </BaseComponents.Card>
              </div>
            )}

            {/* 📋 ÉTAPES + CARTE AFFINIA DESKTOP */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* ÉTAPES DE COMPLETION - PREND 3 COLONNES SUR DESKTOP */}
              <div className="lg:col-span-3">
                <BaseComponents.Card
                  isDarkMode={isDarkMode}
                  variant="default"
                  className="p-4 lg:p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 lg:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white flex-shrink-0">
                      <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className={`text-lg lg:text-xl font-bold ${commonClasses.textPrimary}`}>
                        Prochaines étapes
                      </h2>
                      <p className={`text-xs lg:text-sm ${commonClasses.textMuted}`}>
                        Optimise ton profil
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 lg:space-y-8">
                    {completionSteps.slice(0, 4).map((step, index) => (
                      <CompletionStep
                        key={step.id}
                        step={step}
                        index={index}
                        designSystem={designSystem}
                        isMobile={designSystem.isMobile}
                      />
                    ))}
                  </div>
                </BaseComponents.Card>
              </div>

              {/* 🎴 CARTE AFFINIA - DESKTOP SEULEMENT (2 COLONNES) */}
              <div className="hidden lg:block lg:col-span-2">
                {hasCompletedQuestionnaire ? (
                  <BaseComponents.Card
                    isDarkMode={isDarkMode}
                    variant="highlighted"
                    className="p-3"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-full max-w-[320px] mx-auto">
                        <AffiniaCard
                          photos={photos}
                          profile={profile}
                          questionnaire={questionnaire}
                          className="transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      
                      <BaseComponents.Button
                        variant="secondary"
                        size="small"
                        onClick={() => navigate('/miroir')}
                        fullWidth
                        className="mt-4"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Voir le miroir complet
                      </BaseComponents.Button>
                    </div>
                  </BaseComponents.Card>
                ) : (
                  <BaseComponents.Card
                    isDarkMode={isDarkMode}
                    variant="default"
                    className="p-4 lg:p-6 text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-500/30 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className={`font-bold mb-2 ${commonClasses.textPrimary} text-sm`}>
                      Carte en attente
                    </h4>
                    <p className={`text-xs mb-4 ${commonClasses.textMuted}`}>
                      Complète le questionnaire pour débloquer ta carte
                    </p>
                    <BaseComponents.Button
                      variant="primary"
                      size="small"
                      onClick={() => navigate('/questionnaire')}
                      fullWidth
                    >
                      Faire le questionnaire
                    </BaseComponents.Button>
                  </BaseComponents.Card>
                )}
              </div>
            </div>

            {/* 🚀 ACTIONS RAPIDES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  designSystem={designSystem}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}