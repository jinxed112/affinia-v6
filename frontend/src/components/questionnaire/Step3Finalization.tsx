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

  // 🆕 IMPLÉMENTATION MD5 COMPLÈTE ET FIABLE
  const calculateMD5 = (text: string): string => {
    // Implémentation MD5 complète (compatible avec les générateurs en ligne)
    function md5(string: string): string {
      function md5_RotateLeft(lValue: number, iShiftBits: number) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
      }

      function md5_AddUnsigned(lX: number, lY: number) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
          return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
          if (lResult & 0x40000000) {
            return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
          } else {
            return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
          }
        } else {
          return (lResult ^ lX8 ^ lY8);
        }
      }

      function md5_F(x: number, y: number, z: number) { return (x & y) | ((~x) & z); }
      function md5_G(x: number, y: number, z: number) { return (x & z) | (y & (~z)); }
      function md5_H(x: number, y: number, z: number) { return (x ^ y ^ z); }
      function md5_I(x: number, y: number, z: number) { return (y ^ (x | (~z))); }

      function md5_FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
      }

      function md5_GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
      }

      function md5_HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
      }

      function md5_II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
      }

      function md5_ConvertToWordArray(string: string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
          lWordCount = (lByteCount - (lByteCount % 4)) / 4;
          lBytePosition = (lByteCount % 4) * 8;
          lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
          lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
      }

      function md5_WordToHex(lValue: number) {
        var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
          lByte = (lValue >>> (lCount * 8)) & 255;
          WordToHexValue_temp = "0" + lByte.toString(16);
          WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
      }

      var x = Array();
      var k, AA, BB, CC, DD, a, b, c, d;
      var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
      var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
      var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
      var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

      string = string.replace(/\r\n/g, "\n");
      
      x = md5_ConvertToWordArray(string);

      a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

      for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = md5_FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = md5_FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = md5_FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = md5_FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = md5_FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = md5_FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = md5_FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = md5_FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = md5_FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = md5_GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = md5_GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = md5_GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = md5_GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = md5_GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = md5_GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = md5_GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = md5_GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = md5_GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = md5_GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = md5_GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = md5_HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = md5_HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = md5_HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = md5_HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = md5_HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = md5_HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = md5_HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = md5_HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = md5_HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = md5_HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = md5_HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = md5_II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = md5_II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = md5_II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = md5_II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = md5_II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = md5_II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = md5_II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = md5_II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = md5_II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = md5_II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = md5_II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = md5_II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = md5_II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = md5_II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = md5_II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = md5_AddUnsigned(a, AA);
        b = md5_AddUnsigned(b, BB);
        c = md5_AddUnsigned(c, CC);
        d = md5_AddUnsigned(d, DD);
      }

      return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
    }

    return md5(text);
  };

  // 🆕 VALIDATION AVEC HASH MD5
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

      // Chercher le code de validation MD5 : aff_[hash]_[sessionId]
      // Gérer les backslashes d'échappement ET les ** de markdown : **aff\_[hash]\_[sessionId]**
      const validationRegex = /\*{0,2}aff[_\\]*([a-f0-9]{8,32})[_\\]*([a-z0-9]+)\*{0,2}/i;
      const validationMatch = cleanText.match(validationRegex);
      
      console.log('🔍 DEBUG Regex search:', validationRegex);
      console.log('🔍 DEBUG Match result:', validationMatch);
      
      if (!validationMatch) {
        setProfileValidation({
          isValid: false,
          message: '❌ Code de validation manquant. Assure-toi de copier toute la réponse.'
        });
        return false;
      }

      const expectedHash = validationMatch[1];
      console.log('🔍 DEBUG Expected hash:', expectedHash);
      
  // 🆕 VALIDATION BASIQUE - JUSTE ANTI-INJECTION
  const validateAndSanitizeProfile = (profileText: string): { isValid: boolean, sanitizedText: string, message: string } => {
    try {
      let cleanText = profileText.trim();
      
      // Vérification basique - pas vide
      if (cleanText.length < 50) {
        return {
          isValid: false,
          sanitizedText: '',
          message: '❌ Le profil est trop court.'
        };
      }

      // Sanitize basique - supprime les scripts et trucs dangereux
      cleanText = cleanText
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Supprime les scripts
        .replace(/<[^>]*>/g, '') // Supprime les balises HTML
        .replace(/javascript:/gi, '') // Supprime javascript:
        .replace(/on\w+\s*=/gi, '') // Supprime les event handlers
        .trim();

      return {
        isValid: true,
        sanitizedText: cleanText,
        message: `✅ Profil prêt ! ${cleanText.length} caractères. Sauvegarde en cours...`
      };
      
    } catch (error) {
      return {
        isValid: false,
        sanitizedText: '',
        message: '❌ Erreur lors du traitement. Réessaye.'
      };
    }
  };
      
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

    // Validation avec hash MD5 (synchrone maintenant)
    const isValid = validateProfileIntegrity(generatedProfile, sessionId);
    
    // Si validation locale OK, essayer aussi l'API si disponible
    if (isValid) {
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
    // Plus besoin de reset la validation
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
              <span>Colle la réponse ici et sauvegarde</span>
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
            placeholder="Colle ici la réponse de l'IA et clique sur sauvegarder..."
            rows={6}
            className={`w-full px-3 py-2 rounded-lg backdrop-blur-sm border-2 transition-all duration-300 resize-none text-sm
              focus:outline-none focus:ring-4 focus:ring-purple-500/20
              ${isDarkMode 
                ? 'bg-gray-800/50 text-white border-gray-600 placeholder-gray-400' 
                : 'bg-white/80 text-gray-900 border-gray-300 placeholder-gray-500'
              } focus:border-purple-500`}
          />
          
          {/* Affichage du résultat de sauvegarde */}
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
              <BaseComponents.Button
                variant="primary"
                size="small"
                onClick={handleVerifyProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Sauvegarde...' : showSaveSuccess ? '✓ Sauvé !' : '💾 Sauvegarder maintenant'}
              </BaseComponents.Button>
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