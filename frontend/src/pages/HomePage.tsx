// src/pages/HomePage.tsx - Version Mobile-First Optimisée
import React, { useState, useEffect } from 'react'
import { 
  Heart, Sparkles, Shield, Star, Trophy, Zap, Brain, 
  Target, Eye, PenTool, Calendar, CheckCircle, Lock,
  TrendingUp, Activity, Gamepad2, User, Crown, Home,
  Gift, Camera, Swords, ChevronRight, Coins, Users,
  Plus, Circle, Check, Download, Copy, Flame, Gem,
  Clock, AlertTriangle, Menu, Bell, Settings
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
  const [showMenu, setShowMenu] = useState(false)
  const designSystem = useDesignSystem(isDarkMode)

  // Calculer la progression XP
  const calculateXpProgress = () => {
    if (!profile) return 0
    
    const currentLevel = profile.level || 1
    const currentXp = profile.xp || 0
    
    const currentLevelXp = Math.max(0, (currentLevel - 1) ** 2 * 100)
    const nextLevelXp = currentLevel ** 2 * 100
    
    const progressXp = currentXp - currentLevelXp
    const neededXp = nextLevelXp - currentLevelXp
    
    return neededXp > 0 ? (progressXp / neededXp) * 100 : 0
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
  
  // Mettre à jour XP
  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        setXpProgress(calculateXpProgress())
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [profile])

  // Actions rapides mobile
  const quickActions = [
    {
      icon: hasCompletedQuestionnaire ? Target : Brain,
      label: hasCompletedQuestionnaire ? 'Mon Miroir' : 'Questionnaire',
      color: hasCompletedQuestionnaire ? 'from-purple-500 to-indigo-500' : 'from-orange-500 to-red-500',
      href: hasCompletedQuestionnaire ? '/miroir' : '/questionnaire',
      priority: true,
      badge: hasCompletedQuestionnaire ? null : 'À faire'
    },
    {
      icon: User,
      label: 'Mon Profil',
      color: 'from-blue-500 to-cyan-500',
      href: '/profil',
      priority: false
    },
    {
      icon: Eye,
      label: 'Découverte',
      color: 'from-green-500 to-emerald-500',
      href: '/decouverte',
      priority: false
    },
    {
      icon: Settings,
      label: 'Paramètres',
      color: 'from-slate-500 to-slate-600',
      href: '/parametres',
      priority: false
    }
  ]

  if (loading || loadingPhotos) {
    return (
      <div className={`min-h-screen ${designSystem.getBgClasses('primary')}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Trophy className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className={`${designSystem.getTextClasses('secondary')}`}>
              Chargement...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentLevel = profile?.level || 1
  const currentXp = profile?.xp || 0
  const nextLevelXp = currentLevel ** 2 * 100

  return (
    <div className={`min-h-screen ${designSystem.getBgClasses('primary')}`}>
      {/* CSS Mobile-First */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .mobile-card {
          transition: all 0.3s ease;
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        .mobile-card:active {
          transform: scale(0.98);
        }
        
        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .action-button {
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .action-button:active {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .priority-glow {
          box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
        }
        
        .scroll-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />

      {/* Header Mobile Simplifié */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Salutation */}
            <div>
              <h1 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                Salut {profile?.name || 'toi'} ! 👋
              </h1>
              <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                {hasCompletedQuestionnaire ? 'Prêt pour l\'aventure' : 'Termine ton profil'}
              </p>
            </div>

            {/* Niveau + Notifications */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                <Star className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">{currentLevel}</span>
              </div>
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="relative z-10 pb-20">
        
        {/* Alert Questionnaire si nécessaire */}
        {!hasCompletedQuestionnaire && (
          <div className="px-4 pt-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className={`font-bold text-sm ${designSystem.getTextClasses('primary')}`}>
                    Questionnaire en attente
                  </h3>
                  <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                    15 min pour débloquer ton profil
                  </p>
                </div>
                <button 
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
                  onClick={() => window.location.href = '/questionnaire'}
                >
                  Go !
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Mobiles - Scroll Horizontal */}
        <div className="px-4 pt-6">
          <div className="flex gap-3 overflow-x-auto scroll-container pb-2">
            {/* XP Progress Card */}
            <div className="flex-shrink-0 w-64">
              <div className="stat-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className={`font-medium text-sm ${designSystem.getTextClasses('primary')}`}>
                      Progression
                    </span>
                  </div>
                  <span className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                    {currentXp}/{nextLevelXp} XP
                  </span>
                </div>
                
                <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(xpProgress, 100)}%` }}
                  />
                </div>
                
                <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                  Niveau {currentLevel} → {currentLevel + 1}
                </p>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="flex-shrink-0 w-32">
              <div className="stat-card rounded-2xl p-4 text-center">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                  {currentLevel}
                </p>
                <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                  Niveau
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 w-32">
              <div className="stat-card rounded-2xl p-4 text-center">
                <Gem className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                  {profile?.credits || 0}
                </p>
                <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                  Crédits
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 w-32">
              <div className="stat-card rounded-2xl p-4 text-center">
                <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                  0
                </p>
                <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                  Matchs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="px-4 pt-8">
          <h2 className={`text-lg font-bold mb-4 ${designSystem.getTextClasses('primary')}`}>
            Actions rapides
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={`
                  action-button mobile-card p-4 rounded-2xl text-left
                  bg-gradient-to-br ${action.color}
                  ${action.priority ? 'priority-glow' : ''}
                  relative overflow-hidden
                `}
                onClick={() => window.location.href = action.href}
              >
                {/* Badge si nécessaire */}
                {action.badge && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                    {action.badge}
                  </div>
                )}
                
                <div className="relative z-10">
                  <action.icon className="w-8 h-8 text-white mb-3" />
                  <h3 className="text-white font-bold text-sm">
                    {action.label}
                  </h3>
                </div>
                
                {/* Overlay subtil */}
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Statut du Profil */}
        <div className="px-4 pt-8">
          <h2 className={`text-lg font-bold mb-4 ${designSystem.getTextClasses('primary')}`}>
            Mon profil
          </h2>
          
          <div className="mobile-card rounded-2xl p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                    Statut du profil
                  </h3>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${hasCompletedQuestionnaire 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                    }
                  `}>
                    {hasCompletedQuestionnaire ? '✓ Complet' : '⏳ En cours'}
                  </span>
                </div>
                
                <p className={`text-sm mb-4 ${designSystem.getTextClasses('secondary')}`}>
                  {hasCompletedQuestionnaire 
                    ? 'Ton miroir psychologique est prêt !'
                    : 'Complète ton questionnaire pour débloquer ta carte.'
                  }
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`
                    text-xs px-2 py-1 rounded-full
                    ${hasCompletedQuestionnaire 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-slate-500/20 text-slate-400'
                    }
                  `}>
                    {hasCompletedQuestionnaire ? '✓' : '⏳'} Questionnaire
                  </span>
                  <span className={`
                    text-xs px-2 py-1 rounded-full
                    ${questionnaire?.profile_json 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-slate-500/20 text-slate-400'
                    }
                  `}>
                    {questionnaire?.profile_json ? '✓' : '⏳'} Analyse IA
                  </span>
                  <span className={`
                    text-xs px-2 py-1 rounded-full
                    ${photos.length > 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-slate-500/20 text-slate-400'
                    }
                  `}>
                    {photos.length > 0 ? '✓' : '⏳'} Photos
                  </span>
                </div>

                <button
                  className={`
                    w-full py-3 rounded-xl font-medium text-sm transition-all
                    ${hasCompletedQuestionnaire 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white priority-glow'
                    }
                  `}
                  onClick={() => window.location.href = hasCompletedQuestionnaire ? '/profil' : '/questionnaire'}
                >
                  {hasCompletedQuestionnaire ? 'Voir mon profil' : 'Faire le questionnaire'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Affinia Mobile */}
        <div className="px-4 pt-8">
          <h2 className={`text-lg font-bold mb-4 ${designSystem.getTextClasses('primary')}`}>
            Ma carte Affinia
          </h2>
          
          {questionnaire?.profile_json && hasCompletedQuestionnaire ? (
            <div className="flex justify-center">
              <div className="w-48">
                <AffiniaCard 
                  photos={photos}
                  profile={profile}
                  questionnaire={questionnaire}
                  className="mobile-card"
                />
              </div>
            </div>
          ) : (
            <div className="mobile-card rounded-2xl p-8 text-center bg-slate-800/30 border border-white/10">
              <Lock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h4 className={`font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                {hasCompletedQuestionnaire ? 'Génération en cours' : 'Carte verrouillée'}
              </h4>
              <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                {hasCompletedQuestionnaire
                  ? 'Ton analyse est en cours...'
                  : 'Complète le questionnaire pour débloquer ta carte.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Section Développement */}
        <div className="px-4 pt-8">
          <div className="mobile-card rounded-2xl p-6 text-center bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <h4 className={`font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
              🚀 Bientôt disponible
            </h4>
            <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
              Matching, chat, événements et bien plus arrivent bientôt !
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}