import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Sun, Moon, ArrowRight, Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ResetPasswordPageProps {
  isDarkMode?: boolean
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ isDarkMode: propIsDarkMode }) => {
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode ?? true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [tokensValid, setTokensValid] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (propIsDarkMode !== undefined) {
      setIsDarkMode(propIsDarkMode)
    } else {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark')
      }
    }
  }, [propIsDarkMode])

  // Récupération et validation des tokens au chargement
  useEffect(() => {
    const validateTokens = async () => {
      try {
        // Récupérer les tokens depuis l'URL (hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        console.log('🔑 Tokens récupérés:', { accessToken: !!accessToken, refreshToken: !!refreshToken })

        if (!accessToken || !refreshToken) {
          setError('Lien de réinitialisation invalide ou expiré')
          setTokensValid(false)
          return
        }

        // Définir la session avec les tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('❌ Erreur validation tokens:', error)
          setError('Lien de réinitialisation invalide ou expiré')
          setTokensValid(false)
          return
        }

        if (data.session) {
          console.log('✅ Session établie avec succès')
          setTokensValid(true)
        } else {
          setError('Impossible d\'établir la session')
          setTokensValid(false)
        }

      } catch (error: any) {
        console.error('❌ Erreur lors de la validation des tokens:', error)
        setError('Une erreur est survenue lors de la validation')
        setTokensValid(false)
      }
    }

    validateTokens()
  }, [])

  // Gestion du thème
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  // Retour vers l'accueil
  const handleBackToHome = () => {
    navigate('/')
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError('')
      setLoading(true)

      // Validations
      if (newPassword.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        return
      }

      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }

      console.log('🔄 Mise à jour du mot de passe...')

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ Erreur mise à jour mot de passe:', error)
        
        if (error.message.includes('session_not_found') || error.message.includes('invalid_token')) {
          setError('Session expirée. Veuillez demander un nouveau lien de réinitialisation.')
        } else {
          setError('Erreur lors de la mise à jour du mot de passe')
        }
        return
      }

      console.log('✅ Mot de passe mis à jour avec succès')
      setSuccess(true)
      
      // Redirection automatique après 2 secondes
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error: any) {
      console.error('❌ Erreur:', error)
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      
      {/* Background mystique */}
      <div className="fixed inset-0 z-0">
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20' 
            : 'bg-gradient-to-br from-purple-100/50 via-white to-pink-100/50'
        }`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`fixed top-6 right-6 z-50 p-3 rounded-xl transition-all duration-300 ${
          isDarkMode
            ? 'bg-gray-800/80 hover:bg-gray-700/80 text-yellow-400'
            : 'bg-white/80 hover:bg-white text-gray-800'
        } backdrop-blur-sm shadow-lg hover:scale-110`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Message d'erreur global */}
      {error && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md p-4 rounded-xl ${
          isDarkMode ? 'bg-red-900/90 border border-red-500/50 text-red-200' : 'bg-red-100/90 border border-red-300/50 text-red-800'
        } backdrop-blur-sm shadow-xl`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-lg leading-none hover:opacity-80"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {success && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md p-4 rounded-xl ${
          isDarkMode ? 'bg-green-900/90 border border-green-500/50 text-green-200' : 'bg-green-100/90 border border-green-300/50 text-green-800'
        } backdrop-blur-sm shadow-xl`}>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Mot de passe mis à jour !</p>
              <p className="text-xs mt-1">Redirection vers la page de connexion...</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire principal */}
      <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
        <div className={`w-full max-w-md p-8 rounded-2xl ${
          isDarkMode 
            ? 'bg-gray-800/50 border border-gray-700/50' 
            : 'bg-white/50 border border-gray-200/50'
        } backdrop-blur-sm shadow-2xl`}>
          
          {/* Bouton retour */}
          <button
            onClick={handleBackToHome}
            className={`mb-6 flex items-center gap-2 text-sm ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Retour à l'accueil
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-purple-600" />
              <span className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Affinia
              </span>
            </div>
          </div>

          {/* Contenu conditionnel */}
          {tokensValid === null ? (
            // Chargement
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Validation du lien de réinitialisation...
              </p>
            </div>
          ) : tokensValid === false ? (
            // Tokens invalides
            <div className="text-center py-8">
              <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${
                isDarkMode ? 'text-red-400' : 'text-red-500'
              }`} />
              <h2 className={`text-xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Lien invalide
              </h2>
              <p className={`text-sm mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Ce lien de réinitialisation n'est plus valide ou a expiré.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                Retour à la connexion
              </button>
            </div>
          ) : success ? (
            // Succès
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h2 className={`text-xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Mot de passe mis à jour !
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Redirection en cours vers la page de connexion...
              </p>
            </div>
          ) : (
            // Formulaire de réinitialisation
            <div>
              <div className="text-center mb-8">
                <Lock className={`w-12 h-12 mx-auto mb-4 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <h2 className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Nouveau mot de passe
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Choisis un nouveau mot de passe sécurisé
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500' 
                        : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    } transition-colors`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500' 
                        : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    } transition-colors`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Indicateur de force du mot de passe */}
                {newPassword && (
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center gap-2 ${
                      newPassword.length >= 6 ? 'text-green-500' : isDarkMode ? 'text-red-400' : 'text-red-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        newPassword.length >= 6 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      Au moins 6 caractères
                    </div>
                    {confirmPassword && (
                      <div className={`flex items-center gap-2 ${
                        newPassword === confirmPassword ? 'text-green-500' : isDarkMode ? 'text-red-400' : 'text-red-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          newPassword === confirmPassword ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        Les mots de passe correspondent
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className={`text-xs leading-relaxed ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Assure-toi de choisir un mot de passe sécurisé que tu pourras retenir.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage