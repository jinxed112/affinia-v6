import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { NotificationCenter } from './NotificationCenter'
import { Heart, User, LogOut, Menu, X, Home, Sparkles, Shield, Sun, Moon, ChevronDown, BookOpen } from 'lucide-react'
import { Button } from './ui/Button'

interface HeaderProps {
  isDarkMode: boolean
  onThemeToggle: () => void
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, onThemeToggle }) => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

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

  // Ne pas afficher le header sur la page de login
  if (location.pathname === '/login' || location.pathname === '/auth/callback') {
    return null
  }

  const navItems = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/decouverte', label: 'Découverte', icon: Sparkles },
    { path: '/matches', label: 'Matchs', icon: Heart },
    { path: '/miroir', label: 'Mon Miroir', icon: BookOpen },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isDarkMode 
        ? isScrolled 
          ? 'bg-gray-900/95 backdrop-blur-xl shadow-2xl border-b border-gray-700/50' 
          : 'bg-gray-900/90 backdrop-blur-lg shadow-xl'
        : isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-200/50'
          : 'bg-white/90 backdrop-blur-lg shadow-xl'
    }`}>
      
      {/* Overlay pour améliorer la visibilité */}
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900/80 to-gray-900/60' 
          : 'bg-gradient-to-b from-white/80 to-white/60'
      }`}></div>
      
      <div className={`relative z-10 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo avec animation */}
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-50 
                  group-hover:opacity-70 transition-all duration-300 ${isScrolled ? 'scale-90' : ''}`}></div>
                <div className={`relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl transition-all duration-300
                  ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                  <Heart className={`text-white transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
              </div>
              <h1 className={`font-bold hidden sm:block transition-all duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              } ${isScrolled ? 'text-lg' : 'text-xl'} drop-shadow-sm`}>Affinia</h1>
              <span className={`text-xs bg-purple-600 text-white px-2 py-1 rounded-full transition-all duration-300
                ${isScrolled ? 'scale-90' : ''} shadow-lg`}>V6</span>
            </div>

            {/* Navigation Desktop avec indicateur actif */}
            <nav className="hidden md:flex items-center">
              <div className={`flex items-center rounded-full p-1 shadow-lg ${
                isDarkMode ? 'bg-gray-800/90 border border-gray-700/50' : 'bg-white/90 border border-gray-200/50'
              }`}>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`
                        relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                        ${isActive 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30' 
                          : isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                        }
                      `}
                    >
                      <Icon className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-4 h-4'}`} />
                      <span className={`font-medium transition-all duration-300 ${isScrolled ? 'text-sm' : 'text-sm'}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 blur-xl"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* User Menu Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Notifications */}
              <NotificationCenter isDarkMode={isDarkMode} />

              {/* Theme Toggle avec animation */}
              <button
                onClick={onThemeToggle}
                className={`relative p-2 rounded-lg transition-all duration-300 overflow-hidden group shadow-lg ${
                  isDarkMode
                    ? 'bg-gray-800/90 hover:bg-gray-700 border border-gray-700/50'
                    : 'bg-white/90 hover:bg-gray-50 border border-gray-200/50'
                }`}
                title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 
                  group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative">
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-400 transition-transform duration-300 group-hover:rotate-180" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700 transition-transform duration-300 group-hover:-rotate-12" />
                  )}
                </div>
              </button>

              {/* Stats compacts */}
              <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full transition-all duration-300 shadow-lg ${
                isDarkMode ? 'bg-gray-800/90 border border-gray-700/50' : 'bg-white/90 border border-gray-200/50'
              } ${isScrolled ? 'scale-95' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className={`font-bold ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  } ${isScrolled ? 'text-sm' : 'text-sm'}`}>{profile?.credits || 100}</span>
                </div>
                <div className={`w-px h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Niv</span>
                  <span className={`font-bold ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  } ${isScrolled ? 'text-sm' : 'text-sm'}`}>{profile?.level || 1}</span>
                </div>
              </div>

              {/* Profile Dropdown amélioré */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-2 p-1.5 rounded-full transition-all duration-300 group shadow-lg
                    ${isDarkMode 
                      ? 'hover:bg-gray-800/80 border border-gray-700/50' 
                      : 'hover:bg-gray-100/80 border border-gray-200/50'
                    } ${isScrolled ? 'scale-95' : ''}`}
                >
                  <span className={`text-sm font-medium hidden lg:block ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>{profile?.name || user?.email?.split('@')[0]}</span>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full 
                      blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                      <div className={`w-full h-full rounded-full ${
                        isDarkMode ? 'bg-gray-900' : 'bg-white'
                      } flex items-center justify-center overflow-hidden`}>
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className={`w-4 h-4 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  } ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu avec animations */}
                <div className={`absolute right-0 mt-2 w-56 transition-all duration-300 transform origin-top-right
                  ${isProfileOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}>
                  <div className={`${
                    isDarkMode 
                      ? 'bg-gray-800/95 border-gray-700' 
                      : 'bg-white/95 border-gray-200'
                  } backdrop-blur-xl border rounded-xl shadow-xl overflow-hidden`}>
                    {/* User info section */}
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Connecté en tant que</p>
                      <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user?.email}
                      </p>
                    </div>
                    
                    {/* Stats dans le dropdown */}
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>XP</p>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {profile?.xp || 0}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Crédits</p>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            {profile?.credits || 100}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Niveau</p>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {profile?.level || 1}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profil')
                          setIsProfileOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                          isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Mon Profil
                      </button>

                      <button
                        onClick={() => {
                          navigate('/demandes-miroir')
                          setIsProfileOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                          isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        Demandes de Miroir
                      </button>
                      
                      <button
                        onClick={handleSignOut}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                          isDarkMode
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Notifications Mobile */}
              <NotificationCenter isDarkMode={isDarkMode} />

              {/* Theme Toggle Mobile */}
              <button
                onClick={onThemeToggle}
                className={`p-2 rounded-lg transition-all duration-200 shadow-lg ${
                  isDarkMode
                    ? 'bg-gray-800/90 hover:bg-gray-700 text-yellow-400 border border-gray-700/50'
                    : 'bg-white/90 hover:bg-gray-50 text-gray-700 border border-gray-200/50'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition-all duration-300 shadow-lg ${
                  isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/80 border border-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-gray-200/50'
                } ${mobileMenuOpen ? 'rotate-90' : ''}`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu avec animation */}
      <div className={`md:hidden transition-all duration-500 transform ${
        mobileMenuOpen 
          ? 'max-h-screen opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className={`${
          isDarkMode 
            ? 'bg-gray-900/98 border-t border-gray-700' 
            : 'bg-white/98 border-t border-gray-200'
        } backdrop-blur-xl shadow-xl`}>
          <div className="px-4 py-4 space-y-2 max-w-6xl mx-auto">
            {/* Navigation Mobile */}
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setMobileMenuOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                    transform hover:scale-[1.02]
                    ${isActive 
                      ? isDarkMode
                        ? 'bg-purple-600/20 text-white border border-purple-500/30'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }
                  `}
                  style={{ 
                    transitionDelay: `${index * 50}ms`,
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}

            {/* User Info Mobile */}
            <div className={`border-t pt-4 mt-4 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                    <div className={`w-full h-full rounded-full ${
                      isDarkMode ? 'bg-gray-900' : 'bg-white'
                    } flex items-center justify-center overflow-hidden`}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className={`w-5 h-5 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{profile?.name || 'Dresseur'}</p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats Mobile */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className={`rounded-lg p-2 text-center ${
                  isDarkMode ? 'bg-gray-800/80' : 'bg-gray-100/80'
                }`}>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>XP</p>
                  <p className={`text-sm font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{profile?.xp || 0}</p>
                </div>
                <div className={`rounded-lg p-2 text-center ${
                  isDarkMode ? 'bg-gray-800/80' : 'bg-gray-100/80'
                }`}>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Crédits</p>
                  <p className={`text-sm font-bold ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>{profile?.credits || 100}</p>
                </div>
                <div className={`rounded-lg p-2 text-center ${
                  isDarkMode ? 'bg-gray-800/80' : 'bg-gray-100/80'
                }`}>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Niveau</p>
                  <p className={`text-sm font-bold ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>{profile?.level || 1}</p>
                </div>
              </div>

              {/* Actions Mobile */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigate('/profil')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800/80'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Mon Profil
                </button>

                <button
                  onClick={() => {
                    navigate('/demandes-miroir')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800/80'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Demandes de Miroir
                </button>

                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}