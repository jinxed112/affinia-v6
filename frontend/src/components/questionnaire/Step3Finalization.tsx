// frontend/src/components/questionnaire/Step3Finalization.tsx
import React, { useState, useEffect } from 'react';
import { useQuestionnaireStore } from '../../stores/questionnaireStore';
import { useAuthStore } from '../../stores/authStore';
import { questionnaireService } from '../../services/questionnaireService';

interface Step3FinalizationProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const Step3Finalization: React.FC<Step3FinalizationProps> = ({
  onNext,
  onPrevious
}) => {
  const { answers, setAnswer } = useQuestionnaireStore();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profileText, setProfileText] = useState('');
  const [verificationResult, setVerificationResult] = useState<{valid: boolean; message: string} | null>(null);

  // État du flow
  const [currentPhase, setCurrentPhase] = useState<'questions' | 'prompt' | 'ai' | 'verification' | 'complete'>('questions');

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
        0, // messageCount
        0  // conversationDuration
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
   * 🔍 Phase 3 : Vérification du profil IA
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
        setCurrentPhase('complete');
      }

    } catch (error) {
      console.error('💥 Erreur vérification:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 💾 Phase finale : Sauvegarder le profil
   */
  const handleSaveProfile = async () => {
    if (!profileText.trim()) {
      setError('Veuillez coller la réponse de l\'IA');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // D'abord soumettre le questionnaire
      const submitResult = await questionnaireService.submitQuestionnaire(
        answers,
        generatedPrompt || ''
      );

      if (!submitResult.success || !submitResult.data) {
        setError(submitResult.error || 'Erreur lors de la sauvegarde');
        return;
      }

      // Puis mettre à jour avec le profil IA
      const updateResult = await questionnaireService.updateWithAIProfile(
        submitResult.data.id,
        profileText
      );

      if (!updateResult.success) {
        setError(updateResult.error || 'Erreur lors de la mise à jour du profil');
        return;
      }

      console.log('✅ Questionnaire complètement sauvegardé');
      onNext(); // Passer à l'étape suivante

    } catch (error) {
      console.error('💥 Erreur sauvegarde:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Phase 1 : Questions optionnelles */}
      {currentPhase === 'questions' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🎯 Finalisation - Questions Optionnelles
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qu'avez-vous appris de vos relations passées ?
              </label>
              <textarea
                value={answers.relationship_learning || ''}
                onChange={(e) => setAnswer('relationship_learning', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optionnel : partagez vos apprentissages..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Décrivez votre partenaire idéal
              </label>
              <textarea
                value={answers.ideal_partner || ''}
                onChange={(e) => setAnswer('ideal_partner', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optionnel : qualités recherchées..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expression libre
              </label>
              <textarea
                value={answers.free_expression || ''}
                onChange={(e) => setAnswer('free_expression', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Optionnel : tout ce que vous voulez ajouter..."
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={onPrevious}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Précédent
            </button>
            <button
              onClick={handleGeneratePrompt}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄 Génération...' : '🎯 Générer mon prompt IA'}
            </button>
          </div>
        </div>
      )}

      {/* Phase 2 : Affichage du prompt */}
      {currentPhase === 'prompt' && generatedPrompt && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📋 Votre Prompt Personnalisé
          </h2>

          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Session ID: {sessionId}</span>
              <button
                onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                📋 Copier
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border overflow-x-auto max-h-96">
              {generatedPrompt}
            </pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📝 Instructions :</h3>
            <ol className="text-blue-700 space-y-1 text-sm">
              <li>1. Copiez le prompt ci-dessus</li>
              <li>2. Allez sur ChatGPT ou Claude AI</li>
              <li>3. Collez le prompt et envoyez</li>
              <li>4. Copiez TOUTE la réponse générée</li>
              <li>5. Revenez ici et collez-la ci-dessous</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collez ici la réponse complète de l'IA :
            </label>
            <textarea
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={10}
              placeholder="Collez ici la réponse complète de ChatGPT ou Claude..."
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentPhase('questions')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Retour
            </button>
            <button
              onClick={handleVerifyProfile}
              disabled={loading || !profileText.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '🔄 Vérification...' : '🔍 Vérifier et Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {/* Phase 4 : Résultat de la vérification */}
      {verificationResult && (
        <div className={`border rounded-lg p-4 ${
          verificationResult.valid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={verificationResult.valid ? 'text-green-700' : 'text-red-700'}>
            {verificationResult.message}
          </p>
          
          {verificationResult.valid && (
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '💾 Sauvegarde...' : '💾 Finaliser mon Profil'}
            </button>
          )}
        </div>
      )}

      {/* Phase 5 : Complet */}
      {currentPhase === 'complete' && (
        <div className="text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800">
            Félicitations !
          </h2>
          <p className="text-gray-600">
            Votre profil psychologique a été généré avec succès.
            Vous pouvez maintenant découvrir d'autres utilisateurs !
          </p>
          <button
            onClick={onNext}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            🚀 Découvrir la Communauté
          </button>
        </div>
      )}
    </div>
  );
};