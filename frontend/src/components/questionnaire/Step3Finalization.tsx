// src/components/questionnaire/Step3Finalization.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useQuestionnaire } from '../../hooks/useQuestionnaire' // 🆕 Hook amélioré
import { useAuth } from '../../contexts/AuthContext'
import { questionnaireServiceAlt as questionnaireService } from '../../services/questionnaireServiceAlt'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'
import { ArrowLeft, Copy, ExternalLink, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

interface Step3FinalizationProps {
  isDarkMode: boolean
}

const Step3Finalization: React.FC<Step3FinalizationProps> = ({ isDarkMode }) => {
  const navigate = useNavigate()
  const { user, session } = useAuth()
  const { answers, setAnswer, previousStep } = useQuestionnaireStore()
  
  // 🆕 Utiliser le hook amélioré
  const { 
    syncToProfile, 
    isSyncing, 
    lastSyncResult,
    completeQuestionnaireWithSync 
  } = useQuestionnaire()
  
  const designSystem = useDesignSystem(isDarkMode)
  
  const [mode, setMode] = useState<'skip' | 'free' | 'guided' | null>(null)
  const [localData, setLocalData] = useState({
    relationship_learning: answers.relationship_learning || '',
    ideal_partner: answers.ideal_partner || '',
    free_expression: answers.free_expression || ''
  })
  
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [generatedProfile, setGeneratedProfile] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null)
  const [profileValidation, setProfileValidation] = useState<{
    isValid: boolean
    message: string
  } | null>(null)

  const guidedPrompts = [
    {
      field: 'relationship_learning',
      question: "Quel est ton plus gros apprentissage amoureux ?",
      placeholder: "Ce que l'amour t'a appris jusqu'ici...",
      icon: '📖',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      field: 'ideal_partner',
      question: "Qu'est-ce que tu cherches vraiment chez un(e) partenaire ?",
      placeholder: "Les qualités qui font vraiment la différence pour toi...",
      icon: '🎯',
      color: 'from-purple-500 to-pink-500'
    },
    {
      field: 'free_expression',
      question: "Un message pour ton futur match ?",
      placeholder: "Ce que tu aimerais qu'on sache sur toi...",
      icon: '💌',
      color: 'from-pink-500 to-red-500'
    }
  ]

  // Fonction pour générer le prompt via API
  const generatePromptViaAPI = async (completeAnswers: any): Promise<{ prompt: string, sessionId: string } | null> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const token = session?.access_token
      
      if (!token) {
        console.error('❌ Pas de token d\'authentification')
        return null
      }

      const response = await fetch(`${apiUrl}/api/questionnaire/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: completeAnswers,
          messageCount: 0,
          conversationDuration: 0
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erreur API génération prompt:', errorData)
        return null
      }

      const data = await response.json()
      return {
        prompt: data.data.prompt,
        sessionId: data.data.sessionId
      }
    } catch (error) {
      console.error('❌ Erreur appel API génération:', error)
      return null
    }
  }

  // Validation via API
  const verifyProfileViaAPI = async (profileText: string, sessionId: string): Promise<boolean> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const token = session?.access_token
      
      if (!token) {
        console.error('❌ Pas de token pour validation')
        return false
      }

      const response = await fetch(`${apiUrl}/api/questionnaire/verify-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          profileText,
          userId: user?.id || 'unknown'
        })
      })

      if (!response.ok) {
        console.error('❌ Erreur API validation:', response.status)
        return false
      }

      const data = await response.json()
      
      setProfileValidation({
        isValid: data.valid,
        message: data.message
      })

      return data.valid
    } catch (error) {
      console.error('❌ Erreur validation API:', error)
      setProfileValidation({
        isValid: false,
        message: '❌ Erreur lors de la vérification. Réessaye.'
      })
      return false
    }
  }

  // Validation locale (fallback)
  const verifyProfileIntegrity = (profileText: string): boolean => {
    try {
      const cleanText = profileText.trim()
      
      if (cleanText.length < 500) {
        setProfileValidation({
          isValid: false,
          message: '❌ Le profil est trop court. Copie bien toute la réponse de l\'IA.'
        })
        return false
      }

      if (!cleanText.includes(sessionId)) {
        setProfileValidation({
          isValid: false,
          message: '❌ Ce profil ne correspond pas à ta session. Génère un nouveau prompt.'
        })
        return false
      }

      const hasAnalysis = /PARTIE\s*1|ANALYSE\s+PERSONNELLE|profil\s+miroir/i.test(cleanText)
      const hasJson = /```\s*json|"reliability_score"|"strength_signals"/i.test(cleanText)
      
      if (!hasAnalysis) {
        setProfileValidation({
          isValid: false,
          message: '❌ Il manque l\'analyse personnelle. Assure-toi de copier depuis le début.'
        })
        return false
      }

      if (!hasJson) {
        setProfileValidation({
          isValid: false,
          message: '❌ Il manque les données JSON. Copie bien jusqu\'à la fin de la réponse.'
        })
        return false
      }

      setProfileValidation({
        isValid: true,
        message: '✅ Profil complet et valide ! Tu peux le sauvegarder.'
      })
      return true
      
    } catch (error) {
      setProfileValidation({
        isValid: false,
        message: '❌ Erreur lors de la vérification. Réessaye.'
      })
      return false
    }
  }

  // 🆕 FONCTION HANDLEFINALIZE SIMPLIFIÉE AVEC LE HOOK
  const handleFinalize = async () => {
    if (mode === 'free' || mode === 'guided') {
      setAnswer('relationship_learning', localData.relationship_learning)
      setAnswer('ideal_partner', localData.ideal_partner)
      setAnswer('free_expression', localData.free_expression)
    }

    setIsGenerating(true)

    setTimeout(async () => {
      try {
        const completeAnswers = { ...answers, ...localData }
        
        // 🆕 UTILISER LE HOOK POUR LA SYNCHRONISATION
        console.log('🔄 Utilisation du hook pour synchronisation automatique');
        const syncResult = await syncToProfile(completeAnswers);
        
        if (syncResult.success && syncResult.syncedFields.length > 0) {
          console.log(`✅ Synchronisation réussie via hook: ${syncResult.syncedFields.join(', ')}`);
        } else if (syncResult.success) {
          console.log('ℹ️ Synchronisation via hook réussie (aucune donnée à synchroniser)');
        } else {
          console.warn('⚠️ Synchronisation via hook échouée (non bloquant):', syncResult.error);
        }
        
        // Continuer avec la génération du prompt
        const result = await generatePromptViaAPI(completeAnswers)
        
        if (result) {
          setGeneratedPrompt(result.prompt)
          setSessionId(result.sessionId)
          
          if (user?.id) {
            try {
              const saveResult = await questionnaireService.saveResponses(
                user.id,
                completeAnswers
              )
              if (saveResult.data?.id) {
                setCurrentResponseId(saveResult.data.id)
              }
            } catch (error) {
              console.error('Erreur lors de la sauvegarde:', error)
            }
          }
        } else {
          alert('Erreur lors de la génération via API. Vérifiez que le backend est démarré sur le port 3001.')
        }
      } catch (error) {
        console.error('❌ Erreur dans setTimeout:', error)
      } finally {
        setIsGenerating(false)
      }
    }, 200)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt)
    setShowCopySuccess(true)
    setTimeout(() => setShowCopySuccess(false), 3000)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setGeneratedProfile(newValue)
    
    if (profileValidation) {
      setProfileValidation(null)
    }
  }

  const handleVerifyProfile = async () => {
    if (!generatedProfile.trim()) return

    const apiValid = await verifyProfileViaAPI(generatedProfile, sessionId)
    
    if (!apiValid && !profileValidation) {
      verifyProfileIntegrity(generatedProfile)
    }
  }

  const handleSaveProfile = async () => {
    if (!generatedProfile.trim() || !user?.id || !currentResponseId) return
    
    if (!profileValidation?.isValid) {
      await handleVerifyProfile()
      if (!profileValidation?.isValid) return
    }
    
    setIsSavingProfile(true)
    
    try {
      const result = await questionnaireService.updateGeneratedProfile(
        currentResponseId,
        user.id,
        generatedProfile
      )
      
      if (result.error) {
        setProfileValidation({
          isValid: false,
          message: '❌ Erreur lors de la sauvegarde. Réessaye.'
        })
      } else {
        setShowSaveSuccess(true)
        setTimeout(() => setShowSaveSuccess(false), 3000)
      }
    } catch (error) {
      setProfileValidation({
        isValid: false,
        message: '❌ Erreur lors de la sauvegarde. Réessaye.'
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Page de résultat avec le prompt généré
  if (generatedPrompt) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <BaseComponents.Card 
          isDarkMode={isDarkMode} 
          variant="highlighted"
          className="p-8 relative overflow-hidden"
        >
          {/* Particules de célébration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-float`}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 200}ms`
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-6xl mb-4 animate-bounce-gentle">🎉</div>
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Ton Prompt Affinia est prêt !
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
              Suis ces étapes pour créer ton profil miroir émotionnel
            </p>
            
            {/* 🆕 NOTIFICATION DE SYNCHRONISATION AMÉLIORÉE */}
            {lastSyncResult && (
              <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-4 mb-4">
                <div className="flex items-center gap-2 justify-center">
                  {lastSyncResult.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                        ✅ {lastSyncResult.syncedFields.length > 0 
                          ? `Données synchronisées: ${lastSyncResult.syncedFields.join(', ')}`
                          : 'Profil déjà à jour'
                        }
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                        ⚠️ Synchronisation partielle (questionnaire sauvé)
                      </p>
                    </>
                  )}
                </div>
              </BaseComponents.Card>
            )}
            
            {sessionId && (
              <BaseComponents.Badge variant="default" className="mt-4">
                Session: {sessionId} | 🔐 Généré via API sécurisée
              </BaseComponents.Badge>
            )}
          </div>

          {/* Instructions */}
          <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="mb-8 p-6">
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="w-5 h-5 text-purple-400" />
              Mode d'emploi
            </h3>
            <ol className={`space-y-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {[
                'Copie ton prompt personnalisé avec le bouton ci-dessous',
                'Ouvre ChatGPT ou Claude AI dans un nouvel onglet',
                'Colle le prompt et envoie-le',
                'Copie TOUTE la réponse de l\'IA',
                'Colle-la dans la zone ci-dessous et clique sur "Vérifier"'
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </BaseComponents.Card>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
            <BaseComponents.Button
              variant="primary"
              size="medium"
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {showCopySuccess ? '✓ Copié !' : 'Copier le prompt'}
            </BaseComponents.Button>

            <BaseComponents.Button
              variant="secondary"
              size="medium"
              onClick={() => window.open('https://chat.openai.com', '_blank')}
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir ChatGPT
            </BaseComponents.Button>

            <BaseComponents.Button
              variant="ghost"
              size="medium"
              onClick={() => window.open('https://claude.ai', '_blank')}
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir Claude AI
            </BaseComponents.Button>
          </div>

          {/* Zone pour coller le résultat */}
          <div className="mb-8 relative z-10">
            <label className={`block font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <span className="text-xl">📝</span>
              Colle ici le profil généré par l'IA :
            </label>
            <textarea
              value={generatedProfile}
              onChange={handleProfileChange}
              placeholder="Colle ici la réponse COMPLÈTE de ChatGPT ou Claude AI..."
              rows={8}
              className={`w-full px-4 py-3 rounded-lg backdrop-blur-sm border-2 transition-all duration-300 resize-none
                focus:outline-none focus:ring-4 focus:ring-purple-500/20
                ${isDarkMode 
                  ? 'bg-gray-800/50 text-white border-gray-600 placeholder-gray-400' 
                  : 'bg-white/80 text-gray-900 border-gray-300 placeholder-gray-500'
                } focus:border-purple-500`}
            />
            
            {/* Indicateur de validation */}
            {profileValidation && (
              <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
                profileValidation.isValid 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-red-500/20 border border-red-500/50'
              }`}>
                {profileValidation.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm font-medium ${
                  profileValidation.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {profileValidation.message}
                </p>
              </div>
            )}
            
            {/* Boutons d'action */}
            {generatedProfile && (
              <div className="mt-4 flex items-center gap-4">
                {!profileValidation && (
                  <BaseComponents.Button
                    variant="secondary"
                    size="medium"
                    onClick={handleVerifyProfile}
                  >
                    🔍 Vérifier le profil
                  </BaseComponents.Button>
                )}
                
                {profileValidation?.isValid && (
                  <BaseComponents.Button
                    variant="primary"
                    size="medium"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !currentResponseId}
                  >
                    {isSavingProfile ? (
                      'Sauvegarde...'
                    ) : showSaveSuccess ? (
                      '✓ Profil sauvegardé !'
                    ) : (
                      '💾 Sauvegarder mon profil'
                    )}
                  </BaseComponents.Button>
                )}
                
                {showSaveSuccess && (
                  <p className="text-green-400 animate-pulse">
                    ✨ Ton profil a été enregistré avec succès !
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions finales */}
          <div className="flex gap-4 relative z-10">
            <BaseComponents.Button
              variant="primary"
              size="large"
              onClick={() => navigate('/miroir')}
              disabled={generatedProfile && !showSaveSuccess}
              className="flex-1"
            >
              {generatedProfile && !showSaveSuccess 
                ? '⚠️ Sauvegarde ton profil d\'abord' 
                : 'Découvrir mon miroir de l\'âme ✨'
              }
            </BaseComponents.Button>
          </div>
        </BaseComponents.Card>
      </div>
    )
  }

  // Animation de génération avec indicateur de sync
  if (isGenerating) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <BaseComponents.Card 
          isDarkMode={isDarkMode} 
          variant="highlighted"
          className="p-8 text-center relative overflow-hidden"
        >
          {/* Particules de génération */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-1 bg-purple-400 rounded-full animate-ping`}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 150}ms`
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="text-6xl mb-6 animate-spin">⚡</div>
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Génération de ton prompt magique...
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
              L'IA analyse tes réponses et synchronise ton profil
            </p>
            
            {/* 🆕 INDICATEUR DE SYNCHRONISATION */}
            {isSyncing && (
              <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} flex items-center justify-center gap-2`}>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  Synchronisation questionnaire → profil en cours...
                </p>
              </div>
            )}
            
            {/* Barre de progression animée */}
            <div className={`w-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden mb-4`}>
              <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" 
                   style={{ width: '100%' }} />
            </div>
            
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse`}>
              ✨ Création d'une expérience personnalisée unique...
            </p>
          </div>
        </BaseComponents.Card>
      </div>
    )
  }

  // Page de choix du mode
  if (!mode) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <BaseComponents.Card 
          isDarkMode={isDarkMode} 
          variant="highlighted"
          className="p-8 relative overflow-hidden"
        >
          {/* Particules finales */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400/40 rounded-full animate-float" />
            <div className="absolute top-20 right-20 w-1 h-1 bg-orange-400/40 rounded-full animate-float delay-100" />
            <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float delay-200" />
          </div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-6xl mb-4 animate-bounce-gentle">✨</div>
            <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Dernière étape !
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tu peux enrichir ton profil ou passer directement à la génération
            </p>
            <div className="mt-4 flex justify-center">
              <div className="w-20 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Options avec largeur uniforme */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8 relative z-10">
            <button
              onClick={() => {
                setMode('skip')
                handleFinalize()
              }}
              className={`w-full h-full min-h-[120px] p-6 rounded-xl border-2 transition-all duration-300 text-left group transform hover:scale-105
                ${designSystem.cardBackground} ${designSystem.border} hover:border-yellow-400`}
            >
              <div className="flex items-center gap-4 h-full">
                <span className="text-3xl group-hover:animate-bounce-gentle">⚡</span>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Je passe, génère mon prompt !
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    J'ai déjà donné l'essentiel, allons-y
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('free')}
              className={`w-full h-full min-h-[120px] p-6 rounded-xl border-2 transition-all duration-300 text-left group transform hover:scale-105
                ${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`}
            >
              <div className="flex items-center gap-4 h-full">
                <span className="text-3xl group-hover:animate-bounce-gentle">✍️</span>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Je veux m'exprimer librement
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    J'ai des choses à ajouter sur moi et mes attentes
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('guided')}
              className={`w-full h-full min-h-[120px] p-6 rounded-xl border-2 transition-all duration-300 text-left group transform hover:scale-105
                ${designSystem.cardBackground} ${designSystem.border} hover:border-pink-400`}
            >
              <div className="flex items-center gap-4 h-full">
                <span className="text-3xl group-hover:animate-bounce-gentle">🎤</span>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Guide-moi avec des questions
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    J'aimerais être inspiré(e) par des questions
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Bouton retour */}
          <BaseComponents.Button
            variant="secondary"
            size="medium"
            onClick={previousStep}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </BaseComponents.Button>

          {/* Indicateur d'étape */}
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${designSystem.cardBackground} ${designSystem.border}`}>
              <span className="text-yellow-400">✨</span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Étape 4/4 - Finalisation
              </span>
            </div>
          </div>
        </BaseComponents.Card>
      </div>
    )
  }

  // Mode expression libre
  if (mode === 'free') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <BaseComponents.Card 
          isDarkMode={isDarkMode} 
          variant="highlighted"
          className="p-8 relative overflow-hidden"
        >
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-6xl mb-4 animate-bounce-gentle">🦋</div>
            <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Exprime-toi librement
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Raconte ce qui te tient à cœur...
            </p>
          </div>
          
          {/* Textarea */}
          <textarea
            value={localData.free_expression}
            onChange={(e) => setLocalData({ ...localData, free_expression: e.target.value })}
            placeholder="Raconte ce qui te tient à cœur... Tes apprentissages, ce que tu cherches, qui tu es vraiment..."
            className={`w-full h-64 px-4 py-3 rounded-lg backdrop-blur-sm border-2 transition-all duration-300 resize-none mb-8
              focus:outline-none focus:ring-4 focus:ring-purple-500/20
              ${isDarkMode 
                ? 'bg-gray-800/50 text-white border-gray-600 placeholder-gray-400' 
                : 'bg-white/80 text-gray-900 border-gray-300 placeholder-gray-500'
              } focus:border-purple-500`}
          />

          {/* Boutons */}
          <div className="flex gap-4">
            <BaseComponents.Button
              variant="secondary"
              size="medium"
              onClick={() => setMode(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer de mode
            </BaseComponents.Button>
            <BaseComponents.Button
              variant="primary"
              size="large"
              onClick={handleFinalize}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Génération en cours...' : 'Générer mon prompt ✨'}
            </BaseComponents.Button>
          </div>
        </BaseComponents.Card>
      </div>
    )
  }

  // Mode guidé
  if (mode === 'guided') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <BaseComponents.Card 
          isDarkMode={isDarkMode} 
          variant="highlighted"
          className="p-8 relative overflow-hidden"
        >
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-6xl mb-4 animate-bounce-gentle">💭</div>
            <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Quelques questions pour t'inspirer
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tu peux répondre à une, plusieurs ou toutes les questions
            </p>
          </div>
          
          {/* Questions guidées */}
          <div className="space-y-6 mb-8 relative z-10">
            {guidedPrompts.map((prompt) => (
              <div key={prompt.field}>
                <label className={`flex items-center gap-2 font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-2xl">{prompt.icon}</span>
                  {prompt.question}
                </label>
                <textarea
                  value={localData[prompt.field as keyof typeof localData]}
                  onChange={(e) => setLocalData({ ...localData, [prompt.field]: e.target.value })}
                  placeholder={prompt.placeholder}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg backdrop-blur-sm border-2 transition-all duration-300 resize-none
                    focus:outline-none focus:ring-4 focus:ring-purple-500/20
                    ${isDarkMode 
                      ? 'bg-gray-800/50 text-white border-gray-600 placeholder-gray-400' 
                      : 'bg-white/80 text-gray-900 border-gray-300 placeholder-gray-500'
                    } focus:border-purple-500`}
                />
              </div>
            ))}
          </div>

          {/* Note */}
          <p className={`text-sm mb-8 text-center italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            * Tu peux répondre à une, plusieurs ou toutes les questions
          </p>

          {/* Boutons */}
          <div className="flex gap-4">
            <BaseComponents.Button
              variant="secondary"
              size="medium"
              onClick={() => setMode(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer de mode
            </BaseComponents.Button>
            <BaseComponents.Button
              variant="primary"
              size="large"
              onClick={handleFinalize}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Génération en cours...' : 'Générer mon prompt ✨'}
            </BaseComponents.Button>
          </div>
        </BaseComponents.Card>
      </div>
    )
  }

  return null
}

export default Step3Finalization