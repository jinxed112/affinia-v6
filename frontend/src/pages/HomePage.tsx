// src/pages/HomePage-Onboarding.tsx
import React, { useState, useEffect } from 'react'
import { 
  Heart, Sparkles, Shield, Star, Trophy, Zap, Brain, 
  Target, Eye, PenTool, Calendar, CheckCircle, Lock,
  TrendingUp, Activity, Gamepad2, User, Crown, Home,
  Gift, Camera, Swords, ChevronRight, Coins, Users,
  Plus, Circle, Check, Download, Copy, Flame, Gem,
  Clock, AlertTriangle
} from 'lucide-react'
import { AffiniaCard } from '../components/profile/AffiniaCard'
import { useDesignSystem, UnifiedAnimations } from '../styles/designSystem'
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
  const { profile, questionnaire, loading, error, refreshProfile, hasCompletedQuestionnaire } = useProfile()

  const [xpProgress, setXpProgress] = useState(0)
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const designSystem = useDesignSystem(isDarkMode)

  // Calculer la progression XP
  const calculateXpProgress = () => {
    if (!profile) return 0
    
    const currentLevel = profile.level || 1
    const currentXp = profile.xp || 0
    
    // XP nécessaire pour le niveau actuel et suivant
    const currentLevelXp = Math.max(0, (currentLevel - 1) ** 2 * 100)
    const nextLevelXp = currentLevel ** 2 * 100
    
    const progressXp = currentXp - currentLevelXp
    const neededXp = nextLevelXp - currentLevelXp
    
    return neededXp > 0 ? (progressXp / neededXp) * 100 : 0
  }

  // Charger les photos de l'utilisateur
  useEffect(() => {
    const loadPhotos = async () => {
      if (!user) return

      try {
        setLoadingPhotos(true)
        const userPhotos = await ProfileExtendedService.getUserPhotos(user.id)
        setPhotos(userPhotos)
      } catch (error) {
        console.error('Erreur lors du chargement des photos:', error)
      } finally {
        setLoadingPhotos(false)
      }
    }

    loadPhotos()
  }, [user])
  
  // Mettre à jour la progression XP
  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        setXpProgress(calculateXpProgress())
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [profile])

  // Composant pour les cartes de statistiques
  const StatCard = ({ icon: Icon, label, value, gradient, delay = 0 }) => {
    const [isAnimated, setIsAnimated] = useState(false)
    
    useEffect(() => {
      const timer = setTimeout(() => setIsAnimated(true), delay)
      return () => clearTimeout(timer)
    }, [delay])
    
    return (
      <div 
        className={`group cursor-pointer mystical-glow ${
          isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        } transition-all duration-500`}
      >
        <BaseComponents.Card
          isDarkMode={isDarkMode}
          variant="default"
          className="relative overflow-hidden p-6 group-hover:scale-105"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wider mb-2 font-medium ${
                  designSystem.getTextClasses('muted')
                }`}>
                  {label}
                </p>
                <p className={`text-3xl font-bold ${designSystem.getTextClasses('primary')}`}>
                  {typeof value === 'number' ? (
                    <span className="animate-pulse">{value}</span>
                  ) : value}
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center 
                transform group-hover:rotate-12 transition-transform shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </BaseComponents.Card>
      </div>
    )
  }

  // ✨ NOUVELLE SECTION - Quêtes "Bientôt disponible"
  const PlaceholderQuestItem = ({ title, description, icon: Icon, gradient, index = 0 }) => {
    const [isAnimated, setIsAnimated] = useState(false)
    
    useEffect(() => {
      const timer = setTimeout(() => setIsAnimated(true), 100 * index)
      return () => clearTimeout(timer)
    }, [index])
    
    return (
      <div 
        className={`transition-all duration-500 ${
          isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        } opacity-60`}
      >
        <BaseComponents.Card
          isDarkMode={isDarkMode}
          variant="default"
          className="p-4 relative overflow-hidden cursor-not-allowed"
        >
          {/* Overlay grisé */}
          <div className="absolute inset-0 bg-gray-500/20 z-10" />
          
          <div className="flex items-start space-x-4 relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-500/50`}>
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`font-medium flex items-center space-x-2 ${
                    designSystem.getTextClasses('muted')
                  }`}>
                    <span>{title}</span>
                    <Clock className="w-3 h-3" />
                  </h4>
                  <p className={`text-sm mt-1 ${designSystem.getTextClasses('muted')}`}>
                    {description}
                  </p>
                  <BaseComponents.Badge variant="default" isDarkMode={isDarkMode} className="mt-2">
                    🚧 Bientôt disponible
                  </BaseComponents.Badge>
                </div>
                
                <div className="flex items-center space-x-2 ml-4 opacity-50">
                  <BaseComponents.Badge variant="default" isDarkMode={isDarkMode}>
                    <Zap className="w-3 h-3 mr-1" />
                    +50 XP
                  </BaseComponents.Badge>
                </div>
              </div>
            </div>
          </div>
        </BaseComponents.Card>
      </div>
    )
  }

  if (loading || loadingPhotos) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />
        <div className="relative z-10 pt-20">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 animate-spin text-purple-400" />
              <span className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                Chargement de votre dashboard...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentLevel = profile?.level || 1
  const currentXp = profile?.xp || 0
  const nextLevelXp = currentLevel ** 2 * 100

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />

      <div className="relative z-10 pt-20">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Message d'état questionnaire si pas complété */}
          {!hasCompletedQuestionnaire && (
            <BaseComponents.Card
              isDarkMode={isDarkMode}
              variant="highlighted"
              className="p-6 mb-8 border-yellow-500/30 bg-yellow-500/10"
            >
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400 animate-pulse" />
                <div>
                  <h3 className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                    Questionnaire en attente
                  </h3>
                  <p className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
                    Complétez votre questionnaire psychologique pour débloquer toutes les fonctionnalités d'Affinia.
                  </p>
                </div>
                <BaseComponents.Button
                  variant="primary"
                  size="medium"
                  onClick={() => window.location.href = '/questionnaire'}
                  className="ml-auto"
                >
                  Compléter
                </BaseComponents.Button>
              </div>
            </BaseComponents.Card>
          )}
          
          {/* Stats Cards - VRAIES DONNÉES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <StatCard 
              icon={Trophy} 
              label="NIVEAU" 
              value={currentLevel} 
              gradient="from-amber-500 to-yellow-500"
              delay={0}
            />
            <StatCard 
              icon={Zap} 
              label="XP TOTAL" 
              value={currentXp} 
              gradient="from-blue-500 to-cyan-500"
              delay={100}
            />
            <StatCard 
              icon={Star} 
              label="CRÉDITS" 
              value={profile?.credits || 0} 
              gradient="from-purple-500 to-pink-500"
              delay={200}
            />
            <StatCard 
              icon={Heart} 
              label="MATCHS" 
              value="0" 
              gradient="from-pink-500 to-rose-500"
              delay={300}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Welcome Gift Card - DYNAMIQUE */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="highlighted"
                className="p-8 mystical-glow"
              >
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl 
                      flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h2 className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                        🎁 Statut du profil
                      </h2>
                      <BaseComponents.Badge 
                        variant={hasCompletedQuestionnaire ? "success" : "warning"} 
                        isDarkMode={isDarkMode}
                      >
                        {hasCompletedQuestionnaire ? "✓ Complet" : "⏳ En attente"}
                      </BaseComponents.Badge>
                    </div>
                    
                    <p className={`mb-4 ${designSystem.getTextClasses('secondary')}`}>
                      {hasCompletedQuestionnaire 
                        ? "🎉 Votre profil psychologique est prêt ! Votre carte miroir révèle votre vraie nature."
                        : "Complétez votre questionnaire pour débloquer votre carte d'essence unique."
                      }
                    </p>
                    
                    <p className={`text-sm mb-6 ${designSystem.getTextClasses('muted')}`}>
                      {hasCompletedQuestionnaire
                        ? "Vous avez accès aux fonctionnalités de matching et à votre analyse complète."
                        : "Le questionnaire vous prend 15 minutes et révèle votre profil psychologique complet."
                      }
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mb-6">
                      <BaseComponents.Badge 
                        variant={hasCompletedQuestionnaire ? "success" : "default"} 
                        isDarkMode={isDarkMode}
                      >
                        {hasCompletedQuestionnaire ? "✓ Questionnaire" : "⏳ Questionnaire"}
                      </BaseComponents.Badge>
                      <BaseComponents.Badge 
                        variant={questionnaire?.profile_json ? "success" : "default"} 
                        isDarkMode={isDarkMode}
                      >
                        {questionnaire?.profile_json ? "✓ Analyse IA" : "⏳ Analyse IA"}
                      </BaseComponents.Badge>
                      <BaseComponents.Badge 
                        variant={photos.length > 0 ? "success" : "default"} 
                        isDarkMode={isDarkMode}
                      >
                        {photos.length > 0 ? "✓ Photos" : "⏳ Photos"}
                      </BaseComponents.Badge>
                    </div>
                    
                    <BaseComponents.Button
                      variant={hasCompletedQuestionnaire ? "secondary" : "primary"}
                      size="medium"
                      onClick={() => window.location.href = hasCompletedQuestionnaire ? '/profil' : '/questionnaire'}
                      className={!hasCompletedQuestionnaire ? "mystical-glow animate-shimmer" : ""}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {hasCompletedQuestionnaire ? "Voir mon profil" : "Compléter le questionnaire"}
                    </BaseComponents.Button>
                  </div>
                </div>
              </BaseComponents.Card>

              {/* Progression Section - DYNAMIQUE */}
              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-8">
                <h3 className={`text-xl font-bold mb-6 flex items-center ${designSystem.getTextClasses('primary')}`}>
                  <Sparkles className="w-6 h-6 mr-3 text-purple-400 animate-pulse" />
                  Progression
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${designSystem.getTextClasses('primary')}`}>
                      Niveau {currentLevel}
                    </span>
                    <span className={designSystem.getTextClasses('muted')}>
                      {currentXp}/{nextLevelXp} XP
                    </span>
                  </div>
                  
                  <div className={`relative w-full h-4 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full 
                        transition-all duration-1000 ease-out animate-shimmer"
                      style={{ width: `${Math.min(xpProgress, 100)}%` }}
                    />
                    
                    {xpProgress > 0 && (
                      <Star 
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 animate-pulse"
                        style={{ left: `calc(${Math.min(xpProgress, 100)}% - 10px)` }}
                      />
                    )}
                  </div>
                  
                  <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                    Prochain niveau dans {Math.max(0, nextLevelXp - currentXp)} XP
                  </p>
                </div>
              </BaseComponents.Card>

              {/* ✨ QUÊTES PLACEHOLDER - "Bientôt disponible" */}
              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold flex items-center ${designSystem.getTextClasses('primary')}`}>
                    <Trophy className="w-6 h-6 mr-3 text-yellow-400" />
                    Quêtes Disponibles
                  </h3>
                  <BaseComponents.Badge variant="default" isDarkMode={isDarkMode}>
                    🚧 En développement
                  </BaseComponents.Badge>
                </div>
                
                <div className="space-y-4">
                  <PlaceholderQuestItem
                    title="Compléter le profil"
                    description="Ajoute toutes tes informations pour optimiser ton profil"
                    icon={User}
                    gradient="from-blue-500 to-purple-500"
                    index={0}
                  />
                  <PlaceholderQuestItem
                    title="Première photo"
                    description="Upload ta première photo de profil"
                    icon={Camera}
                    gradient="from-purple-500 to-pink-500"
                    index={1}
                  />
                  <PlaceholderQuestItem
                    title="Exploration sociale"
                    description="Découvre d'autres profils dans ton secteur"
                    icon={Users}
                    gradient="from-green-500 to-teal-500"
                    index={2}
                  />
                  <PlaceholderQuestItem
                    title="Premier match"
                    description="Trouve ta première connexion authentique"
                    icon={Heart}
                    gradient="from-pink-500 to-red-500"
                    index={3}
                  />
                </div>
                
                <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Crown className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className={`font-semibold ${designSystem.getTextClasses('primary')}`}>
                        🚀 Système de quêtes en cours de développement
                      </h4>
                      <p className={`text-sm mt-1 ${designSystem.getTextClasses('muted')}`}>
                        Nous préparons un système de missions gamifiées pour enrichir votre expérience Affinia. 
                        Restez connecté pour les prochaines mises à jour !
                      </p>
                    </div>
                  </div>
                </div>
              </BaseComponents.Card>
            </div>

            {/* Right Column - AffiniaCard */}
            <div className="space-y-8">
              
              {/* Affinia Card DYNAMIQUE */}
              <div className="space-y-4">
                {questionnaire?.profile_json && hasCompletedQuestionnaire ? (
                  // Vraie carte si questionnaire complété
                  <div className="flex justify-center">
                    <div className="mystical-glow w-full">
                      <div className="overflow-visible flex flex-col items-center justify-start pt-4 pb-4">
                        <AffiniaCard 
                          photos={photos}
                          profile={profile}
                          questionnaire={questionnaire}
                          className="transform hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Carte grisée si pas de questionnaire
                  <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-8">
                    <div className="text-center">
                      <div className={`w-32 h-44 rounded-xl mx-auto mb-4 flex items-center justify-center opacity-30 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <Lock className={`w-16 h-16 ${designSystem.getTextClasses('muted')}`} />
                      </div>
                      <h4 className={`font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                        {hasCompletedQuestionnaire 
                          ? "Carte en cours de génération" 
                          : "Carte verrouillée"
                        }
                      </h4>
                      <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                        {hasCompletedQuestionnaire
                          ? "Votre analyse est en cours de traitement."
                          : "Complétez le questionnaire pour débloquer votre carte."
                        }
                      </p>
                    </div>
                  </BaseComponents.Card>
                )}
              </div>

              {/* Questionnaire Status - AMÉLIORÉ */}
              <BaseComponents.Card 
                isDarkMode={isDarkMode} 
                variant="highlighted" 
                className="p-6 mystical-glow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold flex items-center ${designSystem.getTextClasses('primary')}`}>
                    <Brain className="w-5 h-5 mr-2 text-green-500 animate-pulse" />
                    Questionnaire V8
                  </h3>
                  {hasCompletedQuestionnaire ? (
                    <BaseComponents.Badge variant="success" isDarkMode={isDarkMode}>
                      <Check className="w-3 h-3 mr-1" />
                      COMPLÉTÉ
                    </BaseComponents.Badge>
                  ) : (
                    <BaseComponents.Badge variant="warning" isDarkMode={isDarkMode}>
                      À COMPLÉTER
                    </BaseComponents.Badge>
                  )}
                </div>
                
                <p className={`text-sm mb-4 flex items-center ${designSystem.getTextClasses('secondary')}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {hasCompletedQuestionnaire 
                    ? 'Profil psychologique débloqué' 
                    : 'Complétez le questionnaire pour débloquer votre profil'
                  }
                </p>
                
                <div className="space-y-2">
                  <BaseComponents.Button 
                    variant="secondary" 
                    size="small" 
                    className="w-full"
                    onClick={() => window.location.href = '/profil'}
                    disabled={!hasCompletedQuestionnaire}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </BaseComponents.Button>
                  
                  <BaseComponents.Button 
                    variant="primary" 
                    size="small" 
                    className="w-full"
                    onClick={() => window.location.href = hasCompletedQuestionnaire ? '/miroir' : '/questionnaire'}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {hasCompletedQuestionnaire ? 'Mon miroir' : 'Faire le questionnaire'}
                  </BaseComponents.Button>
                </div>
              </BaseComponents.Card>

              {/* Section développement */}
              <BaseComponents.Card 
                isDarkMode={isDarkMode} 
                variant="glass" 
                className="p-6 text-center"
              >
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                <h4 className={`font-semibold mb-2 ${designSystem.getTextClasses('primary')}`}>
                  🚀 Plus de fonctionnalités arrivent
                </h4>
                <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                  Matching, chat, événements, et bien plus sont en cours de développement.
                </p>
              </BaseComponents.Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}