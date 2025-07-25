import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const [debugInfo, setDebugInfo] = useState({
    step: 'Initialisation...',
    details: '',
    isNewUser: false
  })

  useEffect(() => {
    console.log('🔄 AuthCallback: Montage du composant')
    
    // Écouter les changements d'auth pour capturer la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 AuthCallback - Auth event:', event)
      console.log('🔔 Session:', session?.user?.email || 'null')
      
      if (event === 'SIGNED_IN' && session) {
        setDebugInfo({
          step: 'Authentification réussie !',
          details: `Bienvenue ${session.user.email}`,
          isNewUser: session.user.created_at === session.user.updated_at
        })
        
        console.log('✅ Session capturée via onAuthStateChange!')
        console.log('📧 Email:', session.user.email)
        console.log('🆕 Nouvel utilisateur:', session.user.created_at === session.user.updated_at)
        
        // Vérifier si c'est un nouvel utilisateur
        const isNewUser = new Date(session.user.created_at).getTime() === new Date(session.user.updated_at).getTime()
        
        // Petit délai pour l'UX puis redirection avec navigate()
        setTimeout(() => {
          if (isNewUser) {
            // Nouveau compte - rediriger vers questionnaire ou onboarding
            console.log('🎉 Nouvel utilisateur détecté - redirection vers questionnaire')
            navigate('/questionnaire', { replace: true })
          } else {
            // Utilisateur existant - page d'accueil
            console.log('👋 Utilisateur existant - redirection vers accueil')
            navigate('/', { replace: true })
          }
        }, 1500)
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('🚪 SIGNED_OUT event')
        navigate('/login')
      }
    })

    // Vérifier aussi l'URL et la session existante
    const handleAuthCallback = async () => {
      try {
        setDebugInfo({
          step: 'Analyse de l\'URL...',
          details: window.location.href,
          isNewUser: false
        })

        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        // Log complet des paramètres pour diagnostic
        console.log('🔍 Paramètres URL complets:', Object.fromEntries(urlParams.entries()))

        if (error) {
          console.error('❌ Erreur OAuth:', error)
          console.error('❌ Description:', errorDescription)
          
          setDebugInfo({
            step: 'Erreur détectée',
            details: `${error}: ${errorDescription || 'Aucune description'}`,
            isNewUser: false
          })

          // Analyser le type d'erreur pour donner des conseils
          let errorParam = error
          if (error === 'server_error') {
            errorParam += '&hint=check_urls'
          }
          
          navigate(`/login?error=${errorParam}&desc=${encodeURIComponent(errorDescription || '')}`)
          return
        }

        // Vérifier immédiatement si une session existe déjà
        setDebugInfo({
          step: 'Vérification session existante...',
          details: 'Recherche de session active',
          isNewUser: false
        })

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erreur getSession:', sessionError)
          setDebugInfo({
            step: 'Erreur de session',
            details: sessionError.message,
            isNewUser: false
          })
          navigate('/login?error=session_error')
          return
        }
        
        if (session) {
          console.log('✅ Session déjà active, redirection immédiate...')
          setDebugInfo({
            step: 'Session trouvée !',
            details: `Connecté en tant que ${session.user.email}`,
            isNewUser: false
          })
          
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 1000)
          return
        }

        if (code) {
          console.log('🔑 Code OAuth détecté:', code.substring(0, 8) + '...')
          setDebugInfo({
            step: 'Code OAuth reçu',
            details: 'Échange en cours...',
            isNewUser: false
          })
          
          // Tenter l'échange de code
          console.log('🔄 Tentative d\'échange de code...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('❌ Erreur échange de code:', exchangeError)
            setDebugInfo({
              step: 'Échec échange de code',
              details: exchangeError.message,
              isNewUser: false
            })
            navigate(`/login?error=exchange_failed&details=${encodeURIComponent(exchangeError.message)}`)
            return
          }
          
          if (data.session) {
            console.log('✅ Échange réussi ! Session créée')
            setDebugInfo({
              step: 'Échange réussi !',
              details: `Session créée pour ${data.session.user.email}`,
              isNewUser: data.session.user.created_at === data.session.user.updated_at
            })
            // L'event SIGNED_IN sera déclenché automatiquement
            return
          }
          
          // Fallback : attendre l'event SIGNED_IN
          console.log('⏳ En attente de SIGNED_IN event...')
          setDebugInfo({
            step: 'Attente confirmation...',
            details: 'Finalisation en cours',
            isNewUser: false
          })
          
          // Timeout de sécurité plus long pour l'inscription
          setTimeout(() => {
            console.log('⏱️ Timeout atteint, vérification finale...')
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                navigate('/', { replace: true })
              } else {
                setDebugInfo({
                  step: 'Timeout dépassé',
                  details: 'Aucune session créée après 10 secondes',
                  isNewUser: false
                })
                navigate('/login?error=timeout')
              }
            })
          }, 10000) // 10 secondes pour inscription
        } else {
          console.log('❌ Pas de code OAuth')
          setDebugInfo({
            step: 'Aucun code OAuth',
            details: 'Redirection vers connexion',
            isNewUser: false
          })
          navigate('/login?error=no_code')
        }
      } catch (error) {
        console.error('💥 Erreur dans AuthCallback:', error)
        setDebugInfo({
          step: 'Erreur inattendue',
          details: error.message,
          isNewUser: false
        })
        navigate(`/login?error=unexpected&details=${encodeURIComponent(error.message)}`)
      }
    }

    handleAuthCallback()

    return () => {
      console.log('🧹 AuthCallback: Cleanup')
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />
      
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        
        {/* Logo Affinia */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-purple-600" />
          <span className="text-2xl font-bold text-white">Affinia</span>
        </div>
        
        <div className="relative">
          {/* Animation de chargement moderne */}
          <div className="w-20 h-20 mx-auto relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
              <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          </div>
        </div>
        
        {/* Messages dynamiques */}
        <div className="space-y-4">
          <h2 className="text-white text-xl font-semibold">
            {debugInfo.isNewUser ? '🎉 Création de ton compte' : '🔑 Authentification en cours'}
          </h2>
          <p className="text-white font-medium">
            {debugInfo.step}
          </p>
          <p className="text-gray-400 text-sm">
            {debugInfo.details || 'Validation de votre identité...'}
          </p>
          
          {debugInfo.isNewUser && (
            <div className="mt-6 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg backdrop-blur-sm">
              <p className="text-purple-300 text-sm">
                ✨ Bienvenue dans la communauté Affinia !<br/>
                Préparation de ton questionnaire de personnalité...
              </p>
            </div>
          )}
        </div>
        
        {/* Debug info en dev */}
        {import.meta.env.DEV && (
          <div className="mt-8 text-xs text-gray-400 bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 backdrop-blur-sm">
            <p className="font-semibold mb-2 text-gray-300">🔍 Debug Info:</p>
            <div className="text-left space-y-1">
              <p>URL: {window.location.href}</p>
              <p>Step: {debugInfo.step}</p>
              <p>Details: {debugInfo.details}</p>
              <p>New User: {debugInfo.isNewUser ? 'Oui' : 'Non'}</p>
            </div>
            <p className="mt-4 text-center text-gray-300">Si bloqué plus de 15s :</p>
            <button 
              onClick={() => navigate('/', { replace: true })}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-1 rounded mt-2 transition-colors border border-purple-500/30"
            >
              Forcer redirection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}