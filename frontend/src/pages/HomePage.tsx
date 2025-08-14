// HomePage.tsx - VERSION FINALE ULTRA-OPTIMISÉE MOBILE PERFORMANCE
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Sparkles, Shield, Star, Trophy, Zap, Brain,
  Target, Eye, Camera, Users, ChevronRight, Award,
  Plus, Circle, Check, Settings, MapPin, User,
  FileText, Calendar, ArrowRight, TrendingUp, Gem,
  MessageCircle, Mail, Bell, BookOpen, Loader
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

export const HomePage: React.FC<HomePageProps> = ({ isDarkMode = true }) => {
  const { user } = useAuth()
  const { profile, questionnaire, loading, error, refreshProfile } = useProfile()
  const navigate = useNavigate()
  const designSystem = useDesignSystem(isDarkMode)

  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [isDataReady, setIsDataReady] = useState(false)

  // 🚀 OPTIMISATION 1: Vérification questionnaire mémorisée
  const hasCompletedQuestionnaire = useMemo(() => {
    if (!questionnaire) return false

    // Format desktop (JSON structuré)
    if (questionnaire.profile_json) return true

    // Format mobile (texte brut avec données valides)
    if (questionnaire.generated_profile && questionnaire.generated_profile.length > 100) return true

    // Fallback : si le questionnaire existe avec des answers complètes
    if (questionnaire.answers && Object.keys(questionnaire.answers).length > 2) return true

    return false
  }, [questionnaire])

  // 🚀 OPTIMISATION 2: Chargement photos optimisé avec gestion d'erreur
  const loadPhotos = useCallback(async () => {
    if (!user) return
    
    try {
      setLoadingPhotos(true)
      const userPhotos = await ProfileExtendedService.getUserPhotos(user.id)
      setPhotos(userPhotos)
    } catch (error) {
      console.error('Erreur photos:', error)
      // En cas d'erreur, on continue avec un tableau vide
      setPhotos([])
    } finally {
      setLoadingPhotos(false)
    }
  }, [user])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  // 🚀 OPTIMISATION 3: Marquer les données comme prêtes
  useEffect(() => {
    if (!loading && !loadingPhotos) {
      // Délai minimal pour éviter les flashs
      const timer = setTimeout(() => setIsDataReady(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsDataReady(false)
    }
  }, [loading, loadingPhotos])

  // 🚀 OPTIMISATION 4: Calcul de complétude MÉMORISÉ avec cache
  const profileData = useMemo(() => {
    if (!profile || !isDataReady) {
      return {
        completeness: { percentage: 0, completed: [], missing: [] },
        completenessPercentage: 0,
        userName: 'Dresseur'
      }
    }

    // Utilise le service optimisé avec cache
    const completeness = ProfileExtendedService.calculateProfileCompleteness(profile, questionnaire, photos)
    const completenessPercentage = Math.round(completeness.percentage)
    const userName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Dresseur'
    
    return {
      completeness,
      completenessPercentage,
      userName
    }
  }, [profile, questionnaire, photos, user, isDataReady])

  // 🚀 OPTIMISATION 5: Étapes de completion mémorisées avec priorités
  const completionSteps = useMemo(() => {
    if (!isDataReady) return []

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
  }, [photos.length, profile?.bio, profile?.city, hasCompletedQuestionnaire, navigate, isDataReady])

  // 🚀 OPTIMISATION 6: Actions rapides mémorisées
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
      badge: 2,
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

  // 🚀 OPTIMISATION 7: Smart tip mémorisé avec logique simplifiée
  const smartTip = useMemo(() => {
    if (!isDataReady) {
      return {
        title: 'Chargement...',
        description: 'Préparation de tes conseils personnalisés.',
        action: 'Patiente',
        onClick: () => {},
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-300',
        icon: Loader
      }
    }

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
  }, [photos.length, profile?.bio, hasCompletedQuestionnaire, navigate, isDataReady])

  // 🚀 LOADING STATES OPTIMISÉS avec priorité performance mobile
  if (loading || loadingPhotos || !isDataReady) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="pt-20 pb-8 px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* 📱 MOBILE-FIRST Loading ultra-optimisé */}
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="relative mb-6">
                {/* Spinner adaptatif selon performance */}
                {designSystem.isLowPerformance ? (
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-pulse"></div>
                ) : (
                  <>
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-pink-500/20 border-b-pink-500 rounded-full animate-spin" style={{ animationDelay: '0.75s' }}></div>
                  </>
                )}
              </div>
              <h2 className={`text-xl font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                Chargement de ton univers...
              </h2>
              <p className={`text-sm ${designSystem.getTextClasses('secondary')} max-w-xs`}>
                {loading ? 'Récupération du profil' : loadingPhotos ? 'Chargement des photos' : 'Finalisation'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="pt-20 pb-8 px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className={`text-xl font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                Connexion interrompue
              </h2>
              <p className={`${designSystem.getTextClasses('secondary')} mb-6 max-w-xs mx-auto`}>
                Vérifie ta connexion et réessaye
              </p>
              <BaseComponents.Button
                variant="primary"
                onClick={() => window.location.reload()}
                className="px-8"
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
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      {/* 🎨 CSS MOBILE-OPTIMISÉ avec détection performance */}
      <style>{`
        .completion-ring {
          background: conic-gradient(
            from 0deg,
            #a855f7 0deg,
            #ec4899 calc(${profileData.completenessPercentage}% * 360deg / 100%),
            #374151 calc(${profileData.completenessPercentage}% * 360deg / 100%),
            #374151 360deg
          );
          border-radius: 50%;
          position: relative;
        }

        .completion-ring::before {
          content: '';
          position: absolute;
          inset: ${designSystem.isLowPerformance ? '3px' : '6px'};
          background: ${isDarkMode ? '#0f172a' : '#ffffff'};
          border-radius: 50%;
        }

        ${designSystem.isLowPerformance ? `
          .hover-lift:hover {
            transform: translateY(-2px) !important;
          }
          
          .progress-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: none;
          }
        ` : `
          .hover-lift:hover {
            transform: translateY(-4px) scale(1.01);
          }
          
          .progress-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      `}</style>

      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">

          {/* 📱 LAYOUT MOBILE-FIRST OPTIMISÉ - Stack pour mobile, Grid pour desktop */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">

            {/* 🎯 HERO COMPLETION - Ultra-optimisé mobile */}
            <div className="lg:col-span-2">
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="highlighted"
                className="p-6 lg:p-8 hover-lift"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">

                  {/* Completion Ring - Adaptatif selon performance */}
                  <div className="relative flex-shrink-0">
                    <div className={`${designSystem.isLowPerformance ? 'w-20 h-20' : 'w-24 h-24 lg:w-28 lg:h-28'} completion-ring flex items-center justify-center ${designSystem.isLowPerformance ? '' : 'animate-float'}`}>
                      <div className="text-center relative z-10">
                        <div className={`${designSystem.isLowPerformance ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold gradient-text`}>
                          {profileData.completenessPercentage}%
                        </div>
                        <div className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                          Complet
                        </div>
                      </div>
                    </div>

                    {/* Particules autour du ring - Désactivées sur mobile lent */}
                    {!designSystem.isLowPerformance && (
                      <div className="absolute inset-0 animate-spin" style={{ animation: 'spin 20s linear infinite' }}>
                        <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute left-0 top-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                        <div className="absolute right-0 top-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
                      </div>
                    )}
                  </div>

                  {/* CTA Principal - Mobile responsive optimisé */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4 leading-tight">
                      <span className={designSystem.getTextClasses('primary')}>Finalise ton </span>
                      <span className="gradient-text">profil mystique</span>
                    </h1>
                    <p className={`text-base lg:text-lg ${designSystem.getTextClasses('secondary')} mb-4 lg:mb-6`}>
                      Plus ton profil est complet, plus tes connexions seront authentiques, {profileData.userName}.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                      <BaseComponents.Button
                        variant="primary"
                        size="medium"
                        onClick={() => navigate('/profil')}
                        className="w-full sm:w-auto"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Compléter maintenant
                      </BaseComponents.Button>

                      {hasCompletedQuestionnaire && (
                        <BaseComponents.Button
                          variant="secondary"
                          size="medium"
                          onClick={() => navigate('/decouverte')}
                          className="w-full sm:w-auto"
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

            {/* 📋 SIDEBAR - Réorganisé pour mobile avec carte optimisée */}
            <div className="space-y-6 lg:row-start-1">

              {/* 🎴 CARTE AFFINIA - Version optimisée mobile */}
              {hasCompletedQuestionnaire ? (
                <BaseComponents.Card
                  isDarkMode={isDarkMode}
                  variant="highlighted"
                  className="p-4 lg:p-6"
                >
                  <div className="text-center">
                    <h3 className={`text-lg font-bold mb-3 ${designSystem.getTextClasses('primary')}`}>
                      🎴 Ta carte mystique
                    </h3>
                    <div className="flex justify-center mb-4">
                      <div className="w-full max-w-[200px] sm:max-w-xs">
                        <AffiniaCard
                          photos={photos}
                          profile={profile}
                          questionnaire={questionnaire}
                          className={`${designSystem.isLowPerformance ? 'hover:scale-[1.02]' : 'hover:scale-105'} transition-transform duration-300`}
                        />
                      </div>
                    </div>
                    <BaseComponents.Button
                      variant="secondary"
                      size="small"
                      onClick={() => navigate('/miroir')}
                      className="w-full"
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
                  className="p-6 text-center"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-500/30 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className={`font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                    Carte en attente
                  </h4>
                  <p className={`text-sm mb-4 ${designSystem.getTextClasses('muted')}`}>
                    Complète le questionnaire pour débloquer ta carte
                  </p>
                  <BaseComponents.Button
                    variant="primary"
                    size="medium"
                    onClick={() => navigate('/questionnaire')}
                    className="w-full"
                  >
                    Faire le questionnaire
                  </BaseComponents.Button>
                </BaseComponents.Card>
              )}

              {/* 💡 SMART TIP - Version compacte optimisée */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="default"
                className="p-4"
              >
                <div className={`rounded-xl p-4 border ${smartTip.bgColor} border-current/20`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${smartTip.bgColor}`}>
                      <smartTip.icon className={`w-4 h-4 ${smartTip.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${smartTip.textColor} text-sm`}>
                        {smartTip.title}
                      </h4>
                      <p className={`text-xs mb-3 ${smartTip.textColor} opacity-90`}>
                        {smartTip.description}
                      </p>
                      <button
                        onClick={smartTip.onClick}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${smartTip.bgColor} hover:opacity-80 ${smartTip.textColor} font-medium`}
                      >
                        {smartTip.action}
                      </button>
                    </div>
                  </div>
                </div>
              </BaseComponents.Card>
            </div>

            {/* 📋 ÉTAPES & ACTIONS - Section complète mobile optimisée */}
            <div className="lg:col-span-2 space-y-6">

              {/* ÉTAPES DE COMPLETION */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="default"
                className="p-4 lg:p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 lg:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6" />
                  </div>
                  <div>
                    <h2 className={`text-lg lg:text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      Prochaines étapes
                    </h2>
                    <p className={`text-xs lg:text-sm ${designSystem.getTextClasses('muted')}`}>
                      Optimise ton profil
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {completionSteps.slice(0, 4).map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between p-3 lg:p-4 rounded-xl transition-all duration-300 ${designSystem.isLowPerformance ? 'hover:scale-[1.005]' : 'hover:scale-[1.01]'} cursor-pointer ${
                        step.completed
                          ? 'bg-green-500/10 border border-green-500/20'
                          : `${step.bgColor} border border-current/20`
                      }`}
                      onClick={step.action}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${
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
                            step.completed
                              ? 'text-green-400'
                              : step.textColor
                          } truncate`}>
                            {step.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                        <div className="w-16 lg:w-24 bg-gray-700 rounded-full h-1.5 lg:h-2">
                          <div
                            className={`h-1.5 lg:h-2 rounded-full transition-all duration-1000 ${
                              step.completed
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : `bg-gradient-to-r ${step.color} ${designSystem.isLowPerformance ? '' : 'progress-shimmer'}`
                            }`}
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>

                        <span className={`text-xs font-medium ${
                          step.completed ? 'text-green-400' : step.textColor
                        } hidden sm:block`}>
                          {step.progress}%
                        </span>

                        <ChevronRight className={`w-4 h-4 lg:w-5 lg:h-5 ${designSystem.getTextClasses('muted')}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </BaseComponents.Card>

              {/* ACTIONS RAPIDES - Grid responsive optimisé */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <BaseComponents.Card
                    key={action.id}
                    isDarkMode={isDarkMode}
                    variant="default"
                    className={`p-4 lg:p-6 hover-lift cursor-pointer relative overflow-hidden ${
                      !action.available ? 'opacity-50' : ''
                    }`}
                    onClick={() => action.available && action.action()}
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

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${action.bgColor}`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className={`text-base lg:text-lg font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                      {action.title}
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
                      {action.description}
                    </p>

                    {/* Effet de brillance au hover - Désactivé sur mobile lent */}
                    {!designSystem.isLowPerformance && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 hover:opacity-10 transition-opacity duration-500 pointer-events-none`}></div>
                    )}
                  </BaseComponents.Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}