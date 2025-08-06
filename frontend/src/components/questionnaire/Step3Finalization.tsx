// frontend/src/components/questionnaire/Step3Finalization.tsx
import React, { useState, useEffect } from 'react';
import { useQuestionnaireStore } from '../../stores/questionnaireStore';
import { questionnaireService } from '../../services/questionnaireService';
import { supabase } from '../../config/supabase';
import { Copy, CheckCircle, AlertCircle, Sparkles, Brain, Zap } from 'lucide-react';

interface Step3FinalizationProps {
  isDarkMode: boolean;
}

const Step3Finalization: React.FC<Step3FinalizationProps> = ({ isDarkMode }) => {
  const { answers, setAnswer } = useQuestionnaireStore();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profileText, setProfileText] = useState('');
  const [copied, setCopied] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{valid: boolean; message: string} | null>(null);
  const [saving, setSaving] = useState(false);

  // Phase du flow : questions -> prompt -> ai -> verification -> complete
  const [currentPhase, setCurrentPhase] = useState<'questions' | 'prompt' | 'ai' | 'verification' | 'complete'>('questions');

  // Récupérer l'utilisateur au montage
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  /**
   * 🎯 Phase 1 : Génération du prompt sécurisé
   */
  const handleGeneratePrompt = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Génération prompt avec answers:', answers);

      const result = await questionnaireService.generatePrompt(
        answers,
        0, // messageCount par défaut
        0  // conversationDuration par défaut
      );

      if (!result.success || !result.data) {
        setError(result.error || 'Erreur lors de la génération du prompt');
        return;
      }

      setGeneratedPrompt(result.data.prompt);
      setSessionId(result.data.sessionId);
      setCurrentPhase('prompt');

      console.log('✅ Prompt généré:', {
        sessionId: result.data.sessionId,
        promptLength: result.data.prompt.length
      });

    } catch (error) {
      console.error('💥 Erreur génération prompt:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📋 Copier le prompt dans le presse-papier
   */
  const handleCopyPrompt = async () => {
    if (!generatedPrompt) return;

    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  /**
   * 🔍 Vérifier le profil IA collé
   */
  const handleVerifyProfile = async () => {
    if (!user || !sessionId || !profileText.trim()) {
      setError('Données manquantes pour la vérification');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await questionnaireService.verifyProfile(
        sessionId,
        profileText,
        user.id
      );

      if (!result.success || !result.data) {
        setError(result.error || 'Erreur lors de la vérification');
        return;
      }

      setVerificationResult(result.data);
      
      if (result.data.valid) {
        setCurrentPhase('verification');
      }

    } catch (error) {
      console.error('💥 Erreur vérification:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 💾 Sauvegarder le profil final
   */
  const handleSaveProfile = async () => {
    if (!profileText.trim() || !generatedPrompt) {
      setError('Données manquantes pour la sauvegarde');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Soumettre le questionnaire avec le prompt
      const submitResult = await questionnaireService.submitQuestionnaire(
        answers,
        generatedPrompt
      );

      if (!submitResult.success || !submitResult.data) {
        setError(submitResult.error || 'Erreur lors de la sauvegarde');
        return;
      }

      // Mettre à jour avec le profil IA
      const updateResult = await questionnaireService.updateWithAIProfile(
        submitResult.data.id,
        profileText
      );

      if (!updateResult.success) {
        setError(updateResult.error || 'Erreur lors de la mise à jour du profil');
        return;
      }

      console.log('✅ Questionnaire complet sauvegardé');
      setCurrentPhase('complete');

    } catch (error) {
      console.error('💥 Erreur sauvegarde:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Chargement de votre session...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Erreurs */}
      {error && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-800 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Phase 1 : Questions optionnelles + Génération */}
      {currentPhase === 'questions' && (
        <div className="space-y-8">
          <div className={`p-8 rounded-2xl border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">✨</div>
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Finalisation de Votre Profil
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Ajoutez des détails personnels (optionnel) puis générez votre analyse IA
              </p>
            </div>

            {/* Questions optionnelles */}
            <div className="space-y-6 mb-8">
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Qu'avez-vous appris de vos relations passées ? (optionnel)
                </label>
                <textarea
                  value={answers.relationship_learning || ''}
                  onChange={(e) => setAnswer('relationship_learning', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows={3}
                  placeholder="Ex: J'ai appris l'importance de la communication..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Décrivez votre partenaire idéal (optionnel)
                </label>
                <textarea
                  value={answers.ideal_partner || ''}
                  onChange={(e) => setAnswer('ideal_partner', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows={3}
                  placeholder="Ex: Quelqu'un de bienveillant et curieux..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Expression libre (optionnel)
                </label>
                <textarea
                  value={answers.free_expression || ''}
                  onChange={(e) => setAnswer('free_expression', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows={4}
                  placeholder="Tout ce que vous voulez ajouter sur vous..."
                />
              </div>
            </div>

            {/* Bouton génération */}
            <div className="text-center">
              <button
                onClick={handleGeneratePrompt}
                disabled={loading}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Générer mon Analyse IA
                    <Zap className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2 : Affichage du prompt */}
      {currentPhase === 'prompt' && generatedPrompt && (
        <div className="space-y-6">
          <div className={`p-8 rounded-2xl border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Votre Prompt Personnalisé
              </h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Copiez ce prompt et utilisez-le dans ChatGPT ou Claude AI
              </p>
            </div>

            {/* Zone du prompt */}
            <div className={`relative rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between p-4 border-b border-current border-opacity-10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Session ID: {sessionId}
                  </span>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : isDarkMode
                      ? 'bg-blue-900 text-blue-300 hover:bg-blue-800'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <pre className={`p-4 text-sm overflow-x-auto max-h-96 whitespace-pre-wrap ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {generatedPrompt}
              </pre>
            </div>

            {/* Instructions */}
            <div className={`mt-6 p-6 rounded-xl border ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-800 text-blue-200' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Instructions
              </h4>
              <ol className="space-y-2 text-sm">
                <li>1. Copiez le prompt ci-dessus</li>
                <li>2. Allez sur ChatGPT (chat.openai.com) ou Claude (claude.ai)</li>
                <li>3. Collez le prompt et envoyez</li>
                <li>4. Copiez TOUTE la réponse générée</li>
                <li>5. Revenez ici et collez-la ci-dessous</li>
              </ol>
            </div>

            {/* Zone pour coller la réponse IA */}
            <div className="mt-6">
              <label className={`block text-lg font-medium mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Collez ici la réponse complète de l'IA :
              </label>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                className={`w-full px-4 py-4 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows={12}
                placeholder="Collez ici la réponse complète de ChatGPT ou Claude..."
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setCurrentPhase('questions')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Retour
              </button>
              <button
                onClick={handleVerifyProfile}
                disabled={loading || !profileText.trim()}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                  loading || !profileText.trim()
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Vérification...
                  </div>
                ) : (
                  'Vérifier et Sauvegarder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3 : Résultat de vérification */}
      {verificationResult && (
        <div className={`p-6 rounded-xl border ${
          verificationResult.valid 
            ? isDarkMode 
              ? 'bg-green-900/20 border-green-800 text-green-200' 
              : 'bg-green-50 border-green-200 text-green-700'
            : isDarkMode
              ? 'bg-red-900/20 border-red-800 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-start gap-3">
            {verificationResult.valid ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium mb-2">
                {verificationResult.valid ? 'Profil Validé !' : 'Problème Détecté'}
              </p>
              <p className="text-sm">{verificationResult.message}</p>
              
              {verificationResult.valid && (
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className={`mt-4 px-6 py-2 rounded-lg font-medium transition-all ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : 'bg-white text-green-700 hover:bg-green-100 shadow-sm'
                  }`}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      Finalisation...
                    </div>
                  ) : (
                    '💾 Finaliser mon Profil'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 4 : Complet */}
      {currentPhase === 'complete' && (
        <div className={`p-8 rounded-2xl border text-center ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="text-6xl mb-4">🎉</div>
          <h3 className={`text-3xl font-bold mb-3 ${
            isDarkMode ? 'text-green-200' : 'text-green-800'
          }`}>
            Félicitations !
          </h3>
          <p className={`text-lg mb-6 ${
            isDarkMode ? 'text-green-300' : 'text-green-700'
          }`}>
            Votre profil psychologique a été généré et sauvegardé avec succès.
            Vous pouvez maintenant découvrir d'autres utilisateurs !
          </p>
          <div className="text-sm opacity-75">
            <p>🧠 Analyse IA terminée</p>
            <p>💾 Profil sauvegardé</p>
            <p>🚀 Prêt pour les rencontres</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3Finalization;