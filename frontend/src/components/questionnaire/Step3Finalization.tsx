// src/components/questionnaire/Step3Finalization.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useQuestionnaire } from '../../hooks/useQuestionnaire'
import { useAuth } from '../../contexts/AuthContext'
import { questionnaireServiceAlt as questionnaireService } from '../../services/questionnaireServiceAlt'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'
import { Copy, ExternalLink, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

interface Step3FinalizationProps {
  isDarkMode: boolean
}

const Step3Finalization: React.FC<Step3FinalizationProps> = ({ isDarkMode }) => {
  const navigate = useNavigate()
  const { user, session } = useAuth()
  const { answers, setAnswer } = useQuestionnaireStore()
  
  const { 
    syncToProfile, 
    isSyncing, 
    lastSyncResult,
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

  // Auto-save des réponses optionnelles
  useEffect(() => {
    if (localData.relationship_learning) {
      setAnswer('relationship_learning', localData.relationship_learning)
    }
  }, [localData.relationship_learning])

  useEffect(() => {
    if (localData.ideal_partner) {
      setAnswer('ideal_partner', localData.ideal_partner)
    }
  }, [localData.ideal_partner])

  useEffect(() => {
    if (localData.free_expression) {
      setAnswer('free_expression', localData.free_expression)
    }
  }, [localData.free_expression])

  const guidedPrompts = [
    {
      field: 'relationship_learning',
      question: "Quel est ton plus gros apprentissage amoureux ?",
      placeholder: "Ce que l'amour t'a appris jusqu'ici...",
      icon: '📖',
    },
    {
      field: 'ideal_partner',
      question: "Qu'est-ce que tu cherches vraiment ?",
      placeholder: "Les qualités qui comptent pour toi...",
      icon: '🎯',
    },
    {
      field: 'free_expression',
      question: "Un message pour ton futur match ?",
      placeholder: "Ce que tu aimerais qu'on sache sur toi...",
      icon: '💌',
    }
  ]

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
      console.log('🔍 DEBUG API Response:', data) // 🆕 DEBUG
      return {
        prompt: data.data.prompt,
        sessionId: data.data.sessionId
      }
    } catch (error) {
      console.error('❌ Erreur appel API génération:', error)
      return null
    }
  }

  const verifyProfileViaAPI = async (profileText: string, sessionId: string): Promise<boolean> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const token = session?.access_token
      
      if (!token) return false

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

      if (!response.ok) return false

      const data = await response.json()
      
      setProfileValidation({
        isValid: data.valid,
        message: data.message
      })

      return data.valid
    } catch (error) {
      setProfileValidation({
        isValid: false,
        message: '❌ Erreur lors de la vérification.'
      })
      return false
    }
  }

  // 🆕 VALIDATION SIMPLIFIÉE ET ROBUSTE
  const validateProfileIntegrity = (profileText: string, sessionId: string): boolean => {
    try {
      const cleanText = profileText.trim();
      
      // Vérifications de base
      if (cleanText.length < 800) {
        setProfileValidation({
          isValid: false,
          message: '❌ Le profil est trop court. Copie bien toute la réponse de l\'IA.'
        });
        return false;
      }

      // Chercher n'importe quel code de validation : aff_[nombre]_[sessionId]
      // Si sessionId est vide, on cherche n'importe quel pattern aff_
      const validationRegex = sessionId 
        ? new RegExp(`aff_(\\d+)_${sessionId}`, 'i')
        : /aff_(\d+)_([a-z0-9]+)/i;
      const validationMatch = cleanText.match(validationRegex);
      
      if (!validationMatch) {
        setProfileValidation({
          isValid: false,
          message: '❌ Code de validation manquant. Assure-toi de copier toute la réponse.'
        });
        return false;
      }

      const expectedLength = parseInt(validationMatch[1]);
      const actualLength = cleanText.length;
      const lengthDiff = Math.abs(actualLength - expectedLength);
      
      // Tolérance de 5% pour les petites variations
      const tolerance = Math.max(50, expectedLength * 0.05);
      
      if (lengthDiff > tolerance) {
        setProfileValidation({
          isValid: false,
          message: `❌ Longueur incorrecte. Attendu: ${expectedLength}, reçu: ${actualLength}. Vérifie que tu as copié toute la réponse.`
        });
        return false;
      }

      // Vérifier que les sections essentielles sont présentes
      const hasAnalysis = /PARTIE\s*1|ANALYSE\s+PERSONNELLE/i.test(cleanText);
      const hasJson = /```\s*json|"reliability_score"|"strength_signals"/i.test(cleanText);
      
      if (!hasAnalysis) {
        setProfileValidation({
          isValid: false,
          message: '❌ Section d\'analyse manquante. Copie depuis le début de la réponse.'
        });
        return false;
      }

      if (!hasJson) {
        setProfileValidation({
          isValid: false,
          message: '❌ Données JSON manquantes. Copie jusqu\'à la fin de la réponse.'
        });
        return false;
      }

      // ✅ Tout est OK
      setProfileValidation({
        isValid: true,
        message: `✅ Profil valide ! Longueur: ${actualLength} caractères. Tu peux le sauvegarder.`
      });
      return true;
      
    } catch (error) {
      setProfileValidation({
        isValid: false,
        message: '❌ Erreur lors de la vérification. Réessaye.'
      });
      return false;
    }
  };

  // 🆕 FONCTION HANDLEVERIFYPROFILE SIMPLIFIÉE
  const handleVerifyProfile = async () => {
    if (!generatedProfile.trim()) {
      setProfileValidation({
        isValid: false,
        message: '❌ Aucun profil à vérifier.'
      });
      return;
    }

    // D'abord validation locale (rapide)
    const isLocallyValid = validateProfileIntegrity(generatedProfile, sessionId);
    
    // Si validation locale OK, essayer aussi l'API si disponible
    if (isLocallyValid) {
      try {
        await verifyProfileViaAPI(generatedProfile, sessionId);
      } catch (error) {
        console.log('⚠️ API validation failed, but local validation passed');
        // Ne pas écraser la validation locale réussie
      }
    }
  };

  // 🆕 FONCTION HANDLEFINALIZE CORRIGÉE
  const handleFinalize = async () => {
    setIsGenerating(true)

    try {
      const completeAnswers = { ...answers, ...localData }
      
      console.log('🔄 Début génération:', { userId: user?.id, answers: completeAnswers })
      
      // Synchronisation via hook
      const syncResult = await syncToProfile(completeAnswers)
      
      if (syncResult.success && syncResult.syncedFields.length > 0) {
        console.log(`✅ Synchronisation réussie: ${syncResult.syncedFields.join(', ')}`)
      }
      
      // Génération du prompt
      const result = await generatePromptViaAPI(completeAnswers)
      
      if (result) {
        console.log('✅ Prompt généré:', { sessionId: result.sessionId })
        setGeneratedPrompt(result.prompt)
        setSessionId(result.sessionId)
        
        console.log('🔑 SessionId stocké:', result.sessionId) // 🆕 DEBUG
        
        // 🆕 SAUVEGARDE ROBUSTE - Toujours sauvegarder les réponses
        if (user?.id) {
          try {
            console.log('💾 Sauvegarde des réponses...')
            
            const saveResult = await questionnaireService.saveResponses(
              user.id,
              completeAnswers
            )
            
            console.log('📝 Résultat sauvegarde réponses:', saveResult)
            
            if (saveResult.data?.id) {
              setCurrentResponseId(saveResult.data.id)
              console.log('✅ Response ID défini:', saveResult.data.id)
            } else if (saveResult.error) {
              console.error('❌ Erreur sauvegarde réponses:', saveResult.error)
              // Continuer quand même pour permettre la génération
            }
          } catch (error) {
            console.error('❌ Exception sauvegarde réponses:', error)
            // Continuer quand même
          }
        }
      } else {
        console.error('❌ Échec génération prompt')
        alert('Erreur API. Vérifiez que le backend est démarré.')
      }
    } catch (error) {
      console.error('❌ Erreur génération:', error)
      alert(`Erreur lors de la génération: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt)
    setShowCopySuccess(true)
    setTimeout(() => setShowCopySuccess(false), 3000)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedProfile(e.target.value)
    if (profileValidation) {
      setProfileValidation(null)
    }
  }

  // 🆕 FONCTION HANDLESAVEPROFILE CORRIGÉE AVEC DEBUG
  const handleSaveProfile = async () => {
    if (!generatedProfile.trim() || !user?.id || !currentResponseId) {
      console.error('❌ Données manquantes:', {
        hasProfile: !!generatedProfile.trim(),
        hasUserId: !!user?.id,
        hasResponseId: !!currentResponseId
      });
      return;
    }
    
    if (!profileValidation?.isValid) {
      await handleVerifyProfile()
      if (!profileValidation?.isValid) return
    }
    
    setIsSavingProfile(true)
    
    try {
      console.log('🔄 Sauvegarde du profil:', {
        responseId: currentResponseId,
        userId: user.id,
        profileLength: generatedProfile.length
      });

      const result = await questionnaireService.updateGeneratedProfile(
        currentResponseId,
        user.id,
        generatedProfile
      )
      
      console.log('📝 Résultat sauvegarde:', result);
      
      if (result.error) {
        console.error('❌ Erreur service:', result.error);
        setProfileValidation({
          isValid: false,
          message: `❌ Erreur: ${result.error.message || 'Sauvegarde échouée'}`
        })
      } else {
        console.log('✅ Profil sauvegardé avec succès');
        setShowSaveSuccess(true)
        setTimeout(() => setShowSaveSuccess(false), 3000)
        
        // 🆕 REDIRECT vers le miroir après sauvegarde réussie
        setTimeout(() => {
          navigate('/miroir')
        }, 1500)
      }
    } catch (error) {
      console.error('❌ Exception sauvegarde:', error);
      setProfileValidation({
        isValid: false,
        message: `❌ Exception: ${error.message || 'Erreur technique'}`
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Page de résultat avec le prompt généré
  if (generatedPrompt) {
    return (
      <div className="space-y-6">
        {/* Header de succès */}
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce-gentle">🎉</div>
          <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Ton Prompt Affinia est prêt !
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Suis ces étapes pour créer ton profil
          </p>
        </div>

        {/* Notification de sync */}
        {lastSyncResult && (
          <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-3">
            <div className="flex items-center gap-2">
              {lastSyncResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              )}
              <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                {lastSyncResult.success 
                  ? `✅ Données synchronisées: ${lastSyncResult.syncedFields.join(', ')}`
                  : '⚠️ Synchronisation partielle'
                }
              </p>
            </div>
          </BaseComponents.Card>
        )}

        {/* Instructions compactes */}
        <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">1</span>
              <span>Copie ton prompt personnalisé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">2</span>
              <span>Ouvre ChatGPT ou Claude AI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
              <span>Colle TOUTE la réponse ici</span>
            </div>
          </div>
        </BaseComponents.Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <BaseComponents.Button
            variant="primary"
            size="small"
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {showCopySuccess ? '✓ Copié !' : 'Copier'}
          </BaseComponents.Button>

          <BaseComponents.Button
            variant="secondary"
            size="small"
            onClick={() => window.open('https://chat.openai.com', '_blank')}
            className="flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            ChatGPT
          </BaseComponents.Button>

          <BaseComponents.Button
            variant="ghost"
            size="small"
            onClick={() => window.open('https://claude.ai', '_blank')}
            className="flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            Claude AI
          </BaseComponents.Button>
        </div>

        {/* Zone pour coller le résultat */}
        <div>
          <label className={`block font-medium mb-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📝 Colle ici le profil généré par l'IA :
          </label>
          <textarea
            value={generatedProfile}
            onChange={handleProfileChange}
            placeholder="Colle ici la réponse COMPLÈTE de l'IA..."
            rows={6}
            className={`w-full px-3 py-2 rounded-lg backdrop-blur-sm border-2 transition-all duration-300 resize-none text-sm
              focus:outline-none focus:ring-4 focus:ring-purple-500/20
              ${isDarkMode 
                ? 'bg-gray-800/50 text-white border-gray-600 placeholder-gray-400' 
                : 'bg-white/80 text-gray-900 border-gray-300 placeholder-gray-500'
              } focus:border-purple-500`}
          />
          
          {/* Validation */}
          {profileValidation && (
            <div className={`mt-2 p-2 rounded-lg flex items-start gap-2 text-sm ${
              profileValidation.isValid 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              {profileValidation.isValid ? (
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <p className={profileValidation.isValid ? 'text-green-400' : 'text-red-400'}>
                {profileValidation.message}
              </p>
            </div>
          )}
          
          {/* Actions sur le profil */}
          {generatedProfile && (
            <div className="mt-3 flex items-center gap-3">
              {!profileValidation && (
                <BaseComponents.Button
                  variant="secondary"
                  size="small"
                  onClick={handleVerifyProfile}
                >
                  🔍 Vérifier
                </BaseComponents.Button>
              )}
              
              {profileValidation?.isValid && (
                <BaseComponents.Button
                  variant="primary"
                  size="small"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || !currentResponseId}
                >
                  {isSavingProfile ? 'Sauvegarde...' : showSaveSuccess ? '✓ Sauvé !' : '💾 Sauvegarder'}
                </BaseComponents.Button>
              )}
            </div>
          )}
        </div>

        {/* Message final */}
        {showSaveSuccess && (
          <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-4">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">
                ✨ Profil sauvegardé ! Redirection vers votre miroir...
              </span>
            </div>
          </BaseComponents.Card>
        )}
      </div>
    )
  }

  // Animation de génération
  if (isGenerating) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl animate-spin">⚡</div>
        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Génération en cours...
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          L'IA analyse tes réponses
        </p>
        
        {isSyncing && (
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Synchronisation en cours...
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Page de choix du mode
  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce-gentle">✨</div>
          <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Dernière étape !
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Tu peux enrichir ton profil ou passer directement à la génération
          </p>
        </div>

        {/* Options de finalisation */}
        <div className="space-y-3">
          <button
            onClick={() => {
              setMode('skip')
              handleFinalize()
            }}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group transform hover:scale-105
              ${designSystem.cardBackground} ${designSystem.border} hover:border-yellow-400`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:animate-bounce-gentle">⚡</span>
              <div>
                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Générer mon prompt !
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  J'ai déjà donné l'essentiel
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('free')}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group transform hover:scale-105
              ${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:animate-bounce-gentle">✍️</span>
              <div>
                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Expression libre
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  J'ai des choses à ajouter
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('guided')}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group transform hover:scale-105
              ${designSystem.cardBackground} ${designSystem.border} hover:border-pink-400`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:animate-bounce-gentle">🎤</span>
              <div>
                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Questions guidées
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Inspire-moi avec des questions
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Mode expression libre
  if (mode === 'free') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce-gentle">🦋</div>
          <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Exprime-toi librement
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Raconte ce qui te tient à cœur...
          </p>
        </div>
        
        <textarea
          value={localData.free_expression}
          onChange={(e) => setLocalData({ ...localData, free_expression: e.target.value })}
          placeholder="Raconte ce qui te tient à cœur... Tes apprentissages, ce que tu cherches, qui tu es vraiment..."
          className={`w-full h-32 px-4 py-3 rounded-lg backdrop-blur-sm border-2 transition-all duration-300 resize-none
            focus:outline-none focus:ring-4 focus:ring-purple-500/20
            ${isDarkMode 
              ? 'bg-gray-800/50 text-white border-gray-600 placeholder-gray-400' 
              : 'bg-white/80 text-gray-900 border-gray-300 placeholder-gray-500'
            } focus:border-purple-500`}
        />

        <div className="flex gap-3">
          <BaseComponents.Button
            variant="secondary"
            size="medium"
            onClick={() => setMode(null)}
          >
            ← Changer
          </BaseComponents.Button>
          <BaseComponents.Button
            variant="primary"
            size="medium"
            onClick={handleFinalize}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? 'Génération...' : 'Générer mon prompt ✨'}
          </BaseComponents.Button>
        </div>
      </div>
    )
  }

  // Mode guidé
  if (mode === 'guided') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce-gentle">💭</div>
          <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Questions inspirantes
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Réponds à ce qui te parle
          </p>
        </div>
        
        <div className="space-y-4">
          {guidedPrompts.map((prompt) => (
            <div key={prompt.field}>
              <label className={`flex items-center gap-2 font-medium mb-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="text-lg">{prompt.icon}</span>
                {prompt.question}
              </label>
              <textarea
                value={localData[prompt.field as keyof typeof localData]}
                onChange={(e) => setLocalData({ ...localData, [prompt.field]: e.target.value })}
                placeholder={prompt.placeholder}
                rows={2}
                className={`w-full px-3 py-2 rounded-lg backdrop-blur-sm border-2 transition-all duration-300 resize-none text-sm
                  focus:outline-none focus:ring-4 focus:ring-purple-500/20
                  ${isDarkMode 
                    ? 'bg-gray-800/50 text-white border-gray-600 placeholder-gray-400' 
                    : 'bg-white/80 text-gray-900 border-gray-300 placeholder-gray-500'
                  } focus:border-purple-500`}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <BaseComponents.Button
            variant="secondary"
            size="medium"
            onClick={() => setMode(null)}
          >
            ← Changer
          </BaseComponents.Button>
          <BaseComponents.Button
            variant="primary"
            size="medium"
            onClick={handleFinalize}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? 'Génération...' : 'Générer mon prompt ✨'}
          </BaseComponents.Button>
        </div>
      </div>
    )
  }

  return null
}

export default Step3Finalization