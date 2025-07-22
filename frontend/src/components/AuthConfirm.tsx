// components/AuthConfirm.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart, CheckCircle, XCircle, Loader, ArrowRight, Mail, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

const AuthConfirm: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [resending, setResending] = useState(false)

  // Fonction pour renvoyer l'email de confirmation
  const resendConfirmation = async (userEmail?: string) => {
    try {
      setResending(true)
      console.log('🔄 Renvoi de l\'email de confirmation...')
      
      const emailToUse = userEmail || email || 'terrana112@gmail.com'
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse
      })
      
      if (error) {
        console.error('❌ Erreur renvoi email:', error)
        if (error.message.includes('already confirmed')) {
          setError('Ce compte est déjà confirmé. Tu peux te connecter directement.')
        } else {
          setError(`Erreur lors du renvoi: ${error.message}`)
        }
      } else {
        console.log('✅ Email de confirmation renvoyé !', emailToUse)
        setError('')
        setStatus('loading')
        // Afficher un message de succès temporaire
        setTimeout(() => {
          setError('✅ Nouvel email de confirmation envoyé ! Vérifie ta boîte mail.')
          setStatus('error') // Pour afficher le message
        }, 500)
      }
    } catch (err: any) {
      console.error('❌ Erreur inattendue:', err)
      setError('Erreur inattendue lors du renvoi')
    } finally {
      setResending(false)
    }
  }

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log('🔄 Confirmation email en cours...')
        
        // D'abord vérifier s'il y a déjà une session active
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          console.log('✅ Session déjà active, redirection...')
          setStatus('success')
          setEmail(sessionData.session.user.email || '')
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 1500)
          return
        }
        
        // Récupérer les paramètres de l'URL (nouveau format Supabase)
        const code = searchParams.get('code')
        const token = searchParams.get('token_hash') || searchParams.get('token')
        const type = searchParams.get('type') || 'signup'
        
        // Vérifier les erreurs dans l'URL
        const urlError = searchParams.get('error')
        const errorCode = searchParams.get('error_code')
        const errorDescription = searchParams.get('error_description')
        
        if (urlError) {
          console.error('❌ Erreur dans URL:', urlError, errorCode, errorDescription)
          
          if (errorCode === 'otp_expired') {
            setError('Le lien de confirmation a expiré. Veuillez vous réinscrire.')
          } else {
            setError(errorDescription || 'Lien de confirmation invalide')
          }
          setStatus('error')
          return
        }
        
        // Vérifier qu'on a soit un code soit un token
        if (!code && !token) {
          setError('Lien de confirmation invalide - paramètres manquants')
          setStatus('error')
          return
        }

        console.log('🔍 Paramètres trouvés:', { code: !!code, token: !!token, type })

        let result;

        if (code) {
          // Nouveau format avec code - utiliser verifyOtp pour les confirmations email
          console.log('🔄 Confirmation avec code (nouveau format)')
          result = await supabase.auth.verifyOtp({
            token_hash: code,
            type: type as any
          })
        } else {
          // Ancien format avec token
          console.log('🔄 Confirmation avec token (ancien format)')
          result = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any
          })
        }

        const { data, error } = result

        if (error) {
          console.error('❌ Erreur de confirmation:', error)
          
          // Extraire l'email s'il est disponible
          if (data?.user?.email) {
            setEmail(data.user.email)
          }
          
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setError('Le lien de confirmation a expiré ou est invalide.')
          } else {
            setError(error.message || 'Erreur lors de la confirmation')
          }
          setStatus('error')
          return
        }

        console.log('✅ Email confirmé avec succès:', data.user?.email)
        setEmail(data.user?.email || '')
        setStatus('success')
        
        // Rediriger après 3 secondes
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 3000)

      } catch (err: any) {
        console.error('❌ Erreur inattendue:', err)
        setError('Une erreur inattendue s\'est produite')
        setStatus('error')
      }
    }

    confirmEmail()
  }, [searchParams, navigate])

  const goToLogin = () => {
    navigate('/login', { replace: true })
  }

  const goHome = () => {
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm shadow-2xl">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Affinia</span>
          </div>
        </div>

        {/* État de chargement */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-500">
                <Loader className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2 text-white">
              Confirmation en cours...
            </h2>
            
            <p className="text-sm text-gray-400">
              Validation de ton adresse email
            </p>

            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* État de succès */}
        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-green-500 to-green-600">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2 text-white">
              Email confirmé !
            </h2>
            
            <p className="text-sm mb-4 text-gray-400">
              Ton compte Affinia est maintenant actif.
              {email && (
                <>
                  <br />
                  <span className="text-green-400">{email}</span>
                </>
              )}
            </p>

            <div className="mt-6">
              <div className="flex justify-center mb-2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-green-500 rounded-full" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Redirection automatique...
              </p>
            </div>
          </div>
        )}

        {/* État d'erreur */}
        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-full bg-gradient-to-r ${
                error.startsWith('✅') 
                  ? 'from-green-500 to-green-600' 
                  : 'from-red-500 to-red-600'
              }`}>
                {error.startsWith('✅') ? (
                  <Mail className="w-8 h-8 text-white" />
                ) : (
                  <XCircle className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2 text-white">
              {error.startsWith('✅') ? 'Email envoyé !' : 'Erreur de confirmation'}
            </h2>
            
            <p className="text-sm mb-6 text-gray-400">
              {error}
            </p>

            <div className="space-y-3">
              {/* Bouton de renvoi d'email - seulement si erreur d'expiration */}
              {!error.startsWith('✅') && (error.includes('expiré') || error.includes('expired') || error.includes('invalid')) && (
                <button
                  onClick={() => resendConfirmation()}
                  disabled={resending}
                  className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {resending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                </button>
              )}

              <button
                onClick={goToLogin}
                className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Retour à la connexion
              </button>
              
              <button
                onClick={goHome}
                className="w-full px-6 py-3 rounded-xl font-medium bg-gray-700 text-white hover:bg-gray-600 transition-all duration-300"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthConfirm