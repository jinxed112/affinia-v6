// HomePage.tsx - Version Premium V2 CORRIGÉE
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Heart, Sparkles, Shield, Star, Trophy, Zap, Brain, 
  Target, Eye, Camera, Users, ChevronRight, Award, 
  Plus, Circle, Check, Settings, MapPin, User, 
  FileText, Calendar, ArrowRight, TrendingUp, Gem,
  MessageCircle, Mail, Bell, BookOpen
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
  const { profile, questionnaire, loading, error, refreshProfile } = useProfile()
  const navigate = useNavigate()
  const designSystem = useDesignSystem(isDarkMode)

  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)

  // 🆕 CORRIGÉ - Vérifier si le questionnaire est complété (support format mobile)
  const hasCompletedQuestionnaire = () => {
    if (!questionnaire) return false;
    
    // Format desktop (JSON structuré)
    if (questionnaire.profile_json) return true;
    
    // Format mobile (texte brut avec données valides)
    if (questionnaire.generated_profile && questionnaire.generated_profile.length > 100) return true;
    
    // Fallback : si le questionnaire existe avec des answers complètes
    if (questionnaire.answers && Object.keys(questionnaire.answers).length > 2) return true;
    
    return false;
  }

  // Charger les photos
  useEffect(() => {
    const loadPhotos = async () => {
      if (!user) return
      try {
        setLoadingPhotos(true)
        const userPhotos = await ProfileExtendedService.getUserPhotos(user.id)
        setPhotos(userPhotos)
      } catch (error) {
        console.error('Erreur photos:', error)
      } finally {
        setLoadingPhotos(false)
      }
    }
    loadPhotos()
  }, [user])

  // Calculer la progression avec nombres entiers
  const completeness = ProfileExtendedService.calculateProfileCompleteness(profile, questionnaire, photos)
  const completenessPercentage = Math.round(completeness.percentage)

  // Données pour les étapes de completion avec pourcentages arrondis
  const getCompletionSteps = () => {
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
        description: hasCompletedQuestionnaire() ? 'Profil débloqué • Miroir disponible' : 'Débloquer ton miroir psychologique',
        icon: Brain,
        completed: hasCompletedQuestionnaire(),
        progress: hasCompletedQuestionnaire() ? 100 : 0,
        color: 'from-purple-500 to-violet-500',
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-400',
        action: () => hasCompletedQuestionnaire() ? navigate('/miroir') : navigate('/questionnaire'),
        priority: hasCompletedQuestionnaire() ? 6 : 1
      }
    ]

    return steps.sort((a, b) => a.priority - b.priority)
  }

  // Actions rapides avec badge dynamique
  const quickActions = [
    {
      id: 'discovery',
      title: 'Découvrir des âmes',
      description: 'Explore les profils compatibles avec ton essence',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/20',
      action: () => navigate('/decouverte'),
      available: hasCompletedQuestionnaire()
    },
    {
      id: 'requests',
      title: 'Mes demandes',
      description: 'Gère tes demandes de miroir et contacts',
      icon: Mail,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/20',
      action: () => navigate('/demandes'),
      badge: 2, // Simulated
      available: true
    },
    {
      id: 'mirror',
      title: 'Mon miroir psychologique',
      description: 'Découvre ton analyse psychologique complète',
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/20',
      action: () => navigate('/miroir'),
      available: hasCompletedQuestionnaire()
    },
    {
      id: 'chat',
      title: 'Messages',
      description: 'Tes conversations en cours',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      action: () => navigate('/chat'),
      available: true
    }
  ]

  // Smart tips basés sur le profil
  const getSmartTip = () => {
    if (photos.length === 0) {
      return {
        title: 'Optimise ta visibilité',
        description: 'Ajoute 4 photos supplémentaires pour augmenter tes chances de connexion de 40%.',
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
        description: 'Une bio authentique augmente tes compatibilités de 35% en moyenne.',
        action: 'Écrire ma bio',
        onClick: () => navigate('/profil#bio'),
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-300',
        icon: FileText
      }
    }

    if (!hasCompletedQuestionnaire()) {
      return {
        title: 'Débloque ton potentiel',
        description: 'Complète ton questionnaire pour accéder à la découverte d\'âmes compatibles.',
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
      description: 'Ton profil est maintenant prêt pour des connexions authentiques.',
      action: 'Découvrir des âmes',
      onClick: () => navigate('/decouverte'),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-300',
      icon: Heart
    }
  }

  if (loading || loadingPhotos) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="pt-20 pb-8 px-4 relative z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Trophy className={`w-6 h-6 animate-spin text-purple-400`} />
              <span className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                Chargement de ton univers...
              </span>
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
          <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className={`text-xl font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                Erreur de connexion
              </h2>
              <p className={`${designSystem.getTextClasses('secondary')} mb-4`}>{error}</p>
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

  const steps = getCompletionSteps()
  const smartTip = getSmartTip()
  const userName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Dresseur'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      {/* CSS Premium */}
      <style jsx>{`
        ${UnifiedAnimations}
        
        .completion-ring {
          background: conic-gradient(
            from 0deg,
            #a855f7 0deg,
            #ec4899 calc(${completenessPercentage}% * 360deg / 100%),
            #374151 calc(${completenessPercentage}% * 360deg / 100%),
            #374151 360deg
          );
          border-radius: 50%;
          position: relative;
        }
        
        .completion-ring::before {
          content: '';
          position: absolute;
          inset: 6px;
          background: ${isDarkMode ? '#0f172a' : '#ffffff'};
          border-radius: 50%;
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
        
        .hover-lift-strong {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift-strong:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px rgba(168, 85, 247, 0.3);
        }
        
        .gradient-border {
          position: relative;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          border-radius: 1rem;
          padding: 1px;
        }
        
        .gradient-border-content {
          background: ${isDarkMode ? '#0f172a' : '#ffffff'};
          border-radius: calc(1rem - 1px);
          height: 100%;
          width: 100%;
        }
      `}</style>

      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />

      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Layout Principal : Desktop Grid, Mobile Stack */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* CONTENU PRINCIPAL (2/3 sur desktop) */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* 🎯 HERO COMPLETION */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="highlighted"
                className="p-8 hover-lift-strong"
              >
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  
                  {/* Completion Ring */}
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 completion-ring flex items-center justify-center animate-float">
                      <div className="text-center relative z-10">
                        <div className={`text-3xl font-bold gradient-text`}>
                          {completenessPercentage}%
                        </div>
                        <div className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                          Complet
                        </div>
                      </div>
                    </div>
                    
                    {/* Particules autour du ring */}
                    <div className="absolute inset-0 animate-spin" style={{ animation: 'spin 20s linear infinite' }}>
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute left-0 top-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                      <div className="absolute right-0 top-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
                    </div>
                  </div>
                  
                  {/* CTA Principal */}
                  <div className="flex-1 text-center lg:text-left">
                    <h1 className={`text-3xl lg:text-4xl font-bold mb-4 leading-tight`}>
                      <span className={`${designSystem.getTextClasses('primary')}`}>Finalise ton </span>
                      <span className="gradient-text">profil mystique</span>
                    </h1>
                    <p className={`text-lg ${designSystem.getTextClasses('secondary')} mb-6 max-w-lg`}>
                      Plus ton profil est complet, plus tes connexions seront authentiques et profondes, {userName}.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <BaseComponents.Button
                        variant="primary"
                        size="large"
                        onClick={() => navigate('/profil')}
                        className="hover:scale-105 transition-transform duration-300"
                      >
                        <Target className="w-5 h-5 mr-2" />
                        Compléter maintenant
                      </BaseComponents.Button>
                      
                      {hasCompletedQuestionnaire() && (
                        <BaseComponents.Button
                          variant="secondary"
                          size="large"
                          onClick={() => navigate('/decouverte')}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Découvrir des âmes
                        </BaseComponents.Button>
                      )}
                    </div>
                  </div>
                </div>
              </BaseComponents.Card>

              {/* 📋 BREAKDOWN DES ÉTAPES */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="default"
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white animate-float">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      Prochaines étapes
                    </h2>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Optimise ton profil pour des connexions plus profondes
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {steps.slice(0, 4).map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                        step.completed 
                          ? 'bg-green-500/10 border border-green-500/20' 
                          : `${step.bgColor} border border-current/20`
                      }`}
                      onClick={step.action}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          step.completed 
                            ? 'bg-green-500/20 text-green-400' 
                            : `${step.bgColor} ${step.textColor}`
                        }`}>
                          <step.icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-semibold ${designSystem.getTextClasses('primary')}`}>
                            {step.title}
                          </h3>
                          <p className={`text-sm ${
                            step.completed 
                              ? 'text-green-400' 
                              : step.textColor
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Progress Bar */}
                        <div className="w-24 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              step.completed 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                : `bg-gradient-to-r ${step.color} progress-shimmer`
                            }`}
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                        
                        <span className={`text-sm font-medium ${
                          step.completed ? 'text-green-400' : step.textColor
                        }`}>
                          {step.progress}%
                        </span>
                        
                        <ChevronRight className={`w-5 h-5 ${designSystem.getTextClasses('muted')}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </BaseComponents.Card>

              {/* ⚡ ACTIONS RAPIDES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action, index) => (
                  <BaseComponents.Card
                    key={action.id}
                    isDarkMode={isDarkMode}
                    variant="default"
                    className={`p-6 hover-lift cursor-pointer relative overflow-hidden ${
                      !action.available ? 'opacity-50' : ''
                    }`}
                    onClick={() => action.available && action.action()}
                  >
                    {/* Badge de notification */}
                    {action.badge && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                        {action.badge}
                      </div>
                    )}
                    
                    {/* Lock overlay si pas disponible */}
                    {!action.available && (
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="text-center">
                          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Questionnaire requis</p>
                        </div>
                      </div>
                    )}
                    
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${action.bgColor}`}>
                      <action.icon className={`w-7 h-7 ${action.available ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    
                    <h3 className={`text-lg font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                      {action.title}
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
                      {action.description}
                    </p>
                    
                    {/* Effet de brillance au hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 hover:opacity-10 transition-opacity duration-500 pointer-events-none`}></div>
                  </BaseComponents.Card>
                ))}
              </div>
            </div>
            
            {/* SIDEBAR (1/3 sur desktop) */}
            <div className="space-y-6">
              
              {/* 🎴 SA CARTE AFFINIA - HALO RETIRÉ */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="highlighted"
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎴</span>
                  <h3 className={`text-lg font-bold ${designSystem.getTextClasses('primary')}`}>
                    Ta carte mystique
                  </h3>
                </div>
                
                {hasCompletedQuestionnaire() ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="w-full max-w-xs">
                        <AffiniaCard
                          photos={photos}
                          profile={profile}
                          questionnaire={questionnaire}
                          className="hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                    
                    <BaseComponents.Button
                      variant="secondary"
                      size="medium"
                      onClick={() => navigate('/miroir')}
                      className="w-full"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Voir mon miroir complet
                    </BaseComponents.Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-500/30 flex items-center justify-center">
                      <Brain className="w-12 h-12 text-purple-400" />
                    </div>
                    <h4 className={`font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                      Carte en attente
                    </h4>
                    <p className={`text-sm mb-4 ${designSystem.getTextClasses('muted')}`}>
                      Complète ton questionnaire pour débloquer ta carte mystique
                    </p>
                    <BaseComponents.Button
                      variant="primary"
                      size="medium"
                      onClick={() => navigate('/questionnaire')}
                      className="w-full"
                    >
                      Faire le questionnaire
                    </BaseComponents.Button>
                  </div>
                )}
              </BaseComponents.Card>

              {/* 💡 SMART TIP */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="default"
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">💡</span>
                  <h3 className={`text-lg font-bold ${designSystem.getTextClasses('primary')}`}>
                    Conseil mystique
                  </h3>
                </div>
                
                <div className={`rounded-xl p-4 border ${smartTip.bgColor} border-current/20`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${smartTip.bgColor}`}>
                      <smartTip.icon className={`w-5 h-5 ${smartTip.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${smartTip.textColor}`}>
                        {smartTip.title}
                      </h4>
                      <p className={`text-sm mb-4 ${smartTip.textColor} opacity-90`}>
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

              {/* 📈 STATS DISCRÈTES */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="default"
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📈</span>
                  <h3 className={`text-lg font-bold ${designSystem.getTextClasses('primary')}`}>
                    Impact aujourd'hui
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Vues profil
                    </span>
                    <span className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                      {hasCompletedQuestionnaire() ? '7' : '2'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Demandes miroir
                    </span>
                    <span className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                      {hasCompletedQuestionnaire() ? '3' : '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Compatibilité moyenne
                    </span>
                    <span className="font-bold text-green-400">
                      {hasCompletedQuestionnaire() ? '78%' : '--'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Score d'authenticité
                    </span>
                    <span className="font-bold text-purple-400">
                      {hasCompletedQuestionnaire() ? '9/10' : '--'}
                    </span>
                  </div>
                </div>
              </BaseComponents.Card>

              {/* 🎮 GAMIFICATION ULTRA-DISCRÈTE */}
              <BaseComponents.Card
                isDarkMode={isDarkMode}
                variant="glass"
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {profile?.level || 1}
                      </span>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${designSystem.getTextClasses('primary')}`}>
                        Niveau {profile?.level || 1}
                      </div>
                      <div className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                        {profile?.xp || 0}/1000 XP
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.round(((profile?.xp || 0) / 1000) * 100)}%` }}
                      />
                    </div>
                    <Gem className="w-4 h-4 text-purple-400" />
                    <span className={`text-xs font-medium ${designSystem.getTextClasses('primary')}`}>
                      {profile?.credits || 0}
                    </span>
                  </div>
                </div>
              </BaseComponents.Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}