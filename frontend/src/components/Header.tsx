// Header.tsx - Version Premium V2
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import ProfileExtendedService from '../services/profileExtendedService'
import { NotificationCenter } from './NotificationCenter'
import { 
  Heart, User, LogOut, Menu, X, Home, Sparkles, Sun, Moon, 
  ChevronDown, BookOpen, MessageCircle, Mail, Settings, 
  Target, Shield, Bell, Search, Crown, Zap
} from 'lucide-react'
import { Button } from './ui/Button'
import { useChat } from '../hooks/useChat'

interface HeaderProps {
  isDarkMode: boolean
  onThemeToggle: () => void
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, onThemeToggle }) => {
  const { user, profile, signOut } = useAuth()
  const { profile: extendedProfile, questionnaire } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [photos, setPhotos] = useState([])

  // Hook pour les stats du chat
  const { chatStats } = useChat()

  // Vérifier si le questionnaire est complété
  const hasCompletedQuestionnaire = () => {
    return questionnaire?.profile_json != null;
  }

  // Calculer la completion en temps réel
  useEffect(() => {
    const calculateCompletion = async () => {
      if (!user) return

      try {
        // Charger les photos pour le calcul
        const userPhotos = await ProfileExtendedService.getUserPhotos(user.id)
        setPhotos(userPhotos)
        
        // Calculer la completion
        const completeness = ProfileExtendedService.calculateProfileCompleteness(
          extendedProfile, 
          questionnaire, 
          userPhotos
        )
        setCompletionPercentage(completeness.percentage)
      } catch (error) {
        console.error('Erreur calcul completion:', error)
      }
    }

    calculateCompletion()
  }, [user, extendedProfile, questionnaire])

  // Gérer l'effet au scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer les menus au changement de route
  useEffect(() => {
    setMobileMenuOpen(false)
    setIsProfileOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    try {
      navigate('/login')
      await signOut()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      window.location.href = '/login'
    }
  }

  // Ne pas afficher le header sur certaines pages
  if (location.pathname === '/login' || 
      location.pathname === '/auth/callback' ||
      location.pathname === '/reset-password') {
    return null
  }

  // Navigation items avec logique conditionnelle
  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Accueil',
      available: true
    },
    { 
      path: '/decouverte', 
      icon: Sparkles, 
      label: 'Découverte',
      available: hasCompletedQuestionnaire(),
      locked: !hasCompletedQuestionnaire()
    },
    { 
      path: '/demandes', 
      icon: Mail,
      label: 'Demandes',
      available: true,
      badge: 2 // Simulated pour démo
    },
    { 
      path: '/chat', 
      icon: MessageCircle,
      label: 'Messages',
      available: true,
      badge: chatStats?.total_unread_conversations > 0 ? chatStats.total_unread_conversations : undefined
    },
    { 
      path: '/miroir', 
      icon: BookOpen, 
      label: 'Mon Miroir',
      available: hasCompletedQuestionnaire(),
      locked: !hasCompletedQuestionnaire()
    },
  ]

  // Obtenir le nom d'affichage
  const getDisplayName = () => {
    return extendedProfile?.name || 
           user?.user_metadata?.full_name || 
           user?.email?.split('@')[0] || 
           'Utilisateur'
  }

  // Obtenir le niveau de l'utilisateur
  const getUserLevel = () => {
    return extendedProfile?.level || 1
  }

  return (
    <>
      {/* CSS Premium pour le Header */}
      <style jsx>{`
        .header-gradient {
          background: linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.95) 0%,
            rgba(30, 41, 59, 0.95) 50%,
            rgba(15, 23, 42, 0.95) 100%
          );
        }
        
        .completion-ring-small {
          background: conic-gradient(
            from 0deg,
            #a855f7 0deg,
            #ec4899 calc(${completionPercentage}% * 360deg / 100%),
            #374151 calc(${completionPercentage}% * 360deg / 100%),
            #374151 360deg
          );
          border-radius: 50%;
          position: relative;
        }
        
        .completion-ring-small::before {
          content: '';
          position: absolute;
          inset: 2px;
          background: ${isDarkMode ? '#0f172a' : '#ffffff'};
          border-radius: 50%;
        }
        
        .nav-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .nav-button:hover {
          transform: translateY(-2px);
        }
        
        .nav-button.active::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          border-radius: 50%;
        }
        
        .logo-glow {
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5));
        }
        
        .premium-blur {
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        
        .hover-lift {
          transition: all 0.2s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-1px);
        }
        
        .notification-dot {
          animation: pulse-notification 2s infinite;
        }
        
        @keyframes pulse-notification {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>

      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isDarkMode 
          ? isScrolled 
            ? 'header-gradient premium-blur shadow-2xl border-b border-white/10' 
            : 'header-gradient premium-blur shadow-xl'
          : isScrolled
            ? 'bg-white/95 premium-blur shadow-2xl border-b border-gray-200/50'
            : 'bg-white/90 premium-blur shadow-xl'
      }`}>
        
        <div className={`relative z-10 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-4'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              
              {/* Logo Premium */}
              <div 
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => navigate('/')}
              >
                <div className="relative">
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-50 
                    group-hover:opacity-70 transition-all duration-300 ${isScrolled ? 'scale-90' : ''}`}></div>
                  
                  {/* Logo container */}
                  <div className={`relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl transition-all duration-300 logo-glow
                    ${isScrolled ? 'p-2' : 'p-2.5'}`}>
                    <Heart className={`text-white transition-all duration-300 ${isScrolled ? 'w-6 h-6' : 'w-7 h-7'}`} />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <h1 className={`font-bold hidden sm:block transition-all duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  } ${isScrolled ? 'text-xl' : 'text-2xl'} drop-shadow-sm`}>
                    Affinia
                  </h1>
                  <span className={`text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full transition-all duration-300 font-medium
                    ${isScrolled ? 'scale-90' : ''} shadow-lg`}>
                    V6
                  </span>
                </div>
              </div>

              {/* Navigation Desktop Premium */}
              <nav className="hidden lg:flex items-center">
                <div className={`flex items-center gap-2 rounded-2xl p-2 shadow-xl border ${
                  isDarkMode 
                    ? 'bg-slate-800/90 border-slate-700/50' 
                    : 'bg-white/90 border-gray-200/50'
                } premium-blur`}>
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path || 
                      (item.path === '/chat' && location.pathname.startsWith('/chat')) ||
                      (item.path === '/demandes' && location.pathname.startsWith('/demandes'))
                    
                    return (
                      <button
                        key={item.path}
                        onClick={() => item.available && navigate(item.path)}
                        disabled={!item.available}
                        title={item.locked ? `${item.label} - Questionnaire requis` : item.label}
                        className={`
                          nav-button relative px-4 py-3 rounded-xl transition-all duration-300 group
                          ${isActive 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30' 
                            : item.available
                              ? isDarkMode
                                ? 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                              : 'text-gray-500 opacity-50 cursor-not-allowed'
                          }
                          ${isActive ? 'active' : ''}
                        `}
                      >
                        <div className="relative flex items-center gap-2">
                          <Icon className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-5 h-5'}`} />
                          
                          {/* Badge pour notifications */}
                          {item.badge && (
                            <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold notification-dot">
                              {item.badge > 99 ? '99+' : item.badge}
                            </div>
                          )}
                          
                          {/* Lock icon pour les éléments verrouillés */}
                          {item.locked && (
                            <Shield className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Tooltip au hover */}
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
                          {item.label}
                          {item.locked && ' (Verrouillé)'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </nav>

              {/* User Section Desktop */}
              <div className="hidden lg:flex items-center gap-3">
                
                {/* Completion Badge Premium */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl shadow-lg border transition-all duration-300 hover-lift ${
                  isDarkMode
                    ? 'bg-slate-800/90 border-slate-700/50'
                    : 'bg-white/90 border-gray-200/50'
                } premium-blur`}>
                  <div className="w-8 h-8 completion-ring-small flex items-center justify-center">
                    <span className="text-xs font-bold relative z-10">{completionPercentage}</span>
                  </div>
                  <div className="text-sm">
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Profil
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {completionPercentage === 100 ? 'Parfait!' : 'En cours'}
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className={`p-2 rounded-xl shadow-lg border transition-all duration-300 hover-lift ${
                  isDarkMode
                    ? 'bg-slate-800/90 border-slate-700/50'
                    : 'bg-white/90 border-gray-200/50'
                } premium-blur`}>
                  <NotificationCenter isDarkMode={isDarkMode} />
                </div>

                {/* Theme Toggle Premium */}
                <button
                  onClick={onThemeToggle}
                  className={`p-3 rounded-xl transition-all duration-300 group shadow-lg border hover-lift ${
                    isDarkMode
                      ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700/50'
                      : 'bg-white/90 hover:bg-gray-50 border-gray-200/50'
                  } premium-blur`}
                  title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-400 transition-transform duration-300 group-hover:rotate-180" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700 transition-transform duration-300 group-hover:-rotate-12" />
                  )}
                </button>

                {/* Profile Dropdown Premium */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 group shadow-lg border hover-lift
                      ${isDarkMode 
                        ? 'hover:bg-slate-800/80 border-slate-700/50 bg-slate-800/90' 
                        : 'hover:bg-gray-100/80 border-gray-200/50 bg-white/90'
                      } premium-blur ${isScrolled ? 'scale-95' : ''}`}
                  >
                    <div className="relative">
                      {/* Avatar avec niveau */}
                      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                        <div className={`w-full h-full rounded-xl ${
                          isDarkMode ? 'bg-slate-900' : 'bg-white'
                        } flex items-center justify-center overflow-hidden`}>
                          {extendedProfile?.avatar_url ? (
                            <img src={extendedProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <User className={`w-5 h-5 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`} />
                          )}
                        </div>
                      </div>
                      
                      {/* Badge de niveau */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                        <span className="text-xs font-bold text-white">{getUserLevel()}</span>
                      </div>
                    </div>
                    
                    <div className="hidden xl:block text-left">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {getDisplayName()}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Niveau {getUserLevel()}
                      </div>
                    </div>
                    
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    } ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Premium */}
                  <div className={`absolute right-0 mt-3 w-64 transition-all duration-300 transform origin-top-right
                    ${isProfileOpen 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}>
                    <div className={`${
                      isDarkMode 
                        ? 'bg-slate-800/95 border-slate-700' 
                        : 'bg-white/95 border-gray-200'
                    } premium-blur border rounded-2xl shadow-2xl overflow-hidden`}>
                      
                      {/* User info avec stats */}
                      <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                              <div className={`w-full h-full rounded-xl ${
                                isDarkMode ? 'bg-slate-900' : 'bg-white'
                              } flex items-center justify-center`}>
                                {extendedProfile?.avatar_url ? (
                                  <img src={extendedProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  <User className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <p className={`font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {getDisplayName()}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {user?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Zap className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-yellow-400 font-medium">
                                Niveau {getUserLevel()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu items avec icônes */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/profil')
                            setIsProfileOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                            isDarkMode
                              ? 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <User className="w-4 h-4" />
                          <span>Mon Profil</span>
                          <div className="ml-auto">
                            <div className="w-6 h-6 completion-ring-small flex items-center justify-center">
                              <span className="text-xs font-bold relative z-10">{completionPercentage}</span>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            navigate('/demandes')
                            setIsProfileOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                            isDarkMode
                              ? 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Mail className="w-4 h-4" />
                          <span>Mes demandes</span>
                          <div className="ml-auto w-2 h-2 bg-red-500 rounded-full notification-dot"></div>
                        </button>

                        <button
                          onClick={() => {
                            navigate('/parametres')
                            setIsProfileOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                            isDarkMode
                              ? 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Paramètres</span>
                        </button>
                        
                        <div className={`border-t mx-6 my-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}></div>
                        
                        <button
                          onClick={handleSignOut}
                          className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                            isDarkMode
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                              : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          }`}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center gap-3 lg:hidden">
                {/* Messages badge mobile */}
                {chatStats?.total_unread_conversations > 0 && (
                  <button
                    onClick={() => navigate('/chat')}
                    className={`relative p-2 rounded-xl transition-all duration-200 shadow-lg border ${
                      isDarkMode
                        ? 'bg-slate-800/90 hover:bg-slate-700 text-blue-400 border-slate-700/50'
                        : 'bg-white/90 hover:bg-gray-50 text-blue-600 border-gray-200/50'
                    } premium-blur`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold notification-dot">
                      {chatStats.total_unread_conversations > 99 ? '99+' : chatStats.total_unread_conversations}
                    </div>
                  </button>
                )}

                {/* Completion Badge Mobile */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border ${
                  isDarkMode
                    ? 'bg-slate-800/90 border-slate-700/50'
                    : 'bg-white/90 border-gray-200/50'
                } premium-blur`}>
                  <div className="w-6 h-6 completion-ring-small flex items-center justify-center">
                    <span className="text-xs font-bold relative z-10">{completionPercentage}</span>
                  </div>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {completionPercentage}%
                  </span>
                </div>

                {/* Theme Toggle Mobile */}
                <button
                  onClick={onThemeToggle}
                  className={`p-2 rounded-xl transition-all duration-200 shadow-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/90 hover:bg-slate-700 text-yellow-400 border-slate-700/50'
                      : 'bg-white/90 hover:bg-gray-50 text-gray-700 border-gray-200/50'
                  } premium-blur`}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`p-2 rounded-xl transition-all duration-300 shadow-lg border ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-slate-800/80 border-slate-700/50 bg-slate-800/90'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border-gray-200/50 bg-white/90'
                  } premium-blur ${mobileMenuOpen ? 'rotate-90' : ''}`}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Premium */}
        <div className={`lg:hidden transition-all duration-500 transform ${
          mobileMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className={`${
            isDarkMode 
              ? 'bg-slate-900/98 border-t border-slate-700' 
              : 'bg-white/98 border-t border-gray-200'
          } premium-blur shadow-2xl`}>
            <div className="px-4 py-6 space-y-4 max-w-7xl mx-auto">
              
              {/* Profile info mobile */}
              <div className={`flex items-center gap-4 p-4 rounded-xl ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100/50'
              }`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                    <div className={`w-full h-full rounded-xl ${
                      isDarkMode ? 'bg-slate-900' : 'bg-white'
                    } flex items-center justify-center`}>
                      {extendedProfile?.avatar_url ? (
                        <img src={extendedProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{getUserLevel()}</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {getDisplayName()}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Niveau {getUserLevel()} • {completionPercentage}% complet
                  </p>
                </div>
              </div>
              
              {/* Navigation Mobile avec états */}
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || 
                  (item.path === '/chat' && location.pathname.startsWith('/chat'))
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (item.available) {
                        navigate(item.path)
                        setMobileMenuOpen(false)
                      }
                    }}
                    disabled={!item.available}
                    className={`
                      w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300
                      transform hover:scale-[1.02] relative
                      ${isActive 
                        ? isDarkMode
                          ? 'bg-purple-600/20 text-white border border-purple-500/30'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                        : item.available
                          ? isDarkMode
                            ? 'text-gray-400 hover:text-white hover:bg-slate-800/80'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                          : 'text-gray-500 opacity-50'
                      }
                      ${!item.available ? 'cursor-not-allowed' : ''}
                    `}
                    style={{ 
                      transitionDelay: `${index * 50}ms`,
                      opacity: mobileMenuOpen ? 1 : 0,
                      transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-20px)'
                    }}
                  >
                    <div className="relative">
                      <Icon className="w-6 h-6" />
                      {item.badge && (
                        <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold notification-dot">
                          {item.badge > 99 ? '99+' : item.badge}
                        </div>
                      )}
                      {item.locked && (
                        <Shield className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
                      )}
                    </div>
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {item.locked && (
                      <span className="text-xs bg-gray-500/20 px-2 py-1 rounded-full">
                        Verrouillé
                      </span>
                    )}
                  </button>
                )
              })}

              {/* User actions mobile */}
              <div className={`border-t pt-4 mt-4 space-y-2 ${
                isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    navigate('/profil')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-slate-800/80'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Mon Profil</span>
                  <div className="ml-auto w-6 h-6 completion-ring-small flex items-center justify-center">
                    <span className="text-xs font-bold relative z-10">{completionPercentage}</span>
                  </div>
                </button>

                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${
                    isDarkMode
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}