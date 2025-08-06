import React, { useState } from 'react';
import { useQuestionnaireStore } from '../../stores/questionnaireStore';
import { questionnaireService } from '../../services/questionnaireService';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, CheckCircle, AlertCircle, Sparkles, Brain, Zap } from 'lucide-react';

interface Step3FinalizationProps {
  isDarkMode: boolean;
}

const Step3Finalization: React.FC<Step3FinalizationProps> = ({ isDarkMode }) => {
  const { answers, setAnswer } = useQuestionnaireStore();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profileText, setProfileText] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'questions' | 'prompt' | 'complete'>('questions');

  const handleGeneratePrompt = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await questionnaireService.generatePrompt(answers, 0, 0);

      if (!result.success || !result.data) {
        setError(result.error || 'Erreur lors de la génération du prompt');
        return;
      }

      setGeneratedPrompt(result.data.prompt);
      setSessionId(result.data.sessionId);
      setCurrentPhase('prompt');
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

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

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {currentPhase === 'questions' && (
        <div className={`p-8 rounded-2xl border ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
        }`}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">✨</div>
            <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Génération de Votre Profil IA
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Créons votre analyse psychologique personnalisée
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Qu'avez-vous appris de vos relations passées ? (optionnel)
              </label>
              <textarea
                value={answers.relationship_learning || ''}
                onChange={(e) => setAnswer('relationship_learning', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows={3}
                placeholder="Ex: J'ai appris l'importance de la communication..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Décrivez votre partenaire idéal (optionnel)
              </label>
              <textarea
                value={answers.ideal_partner || ''}
                onChange={(e) => setAnswer('ideal_partner', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows={3}
                placeholder="Ex: Quelqu'un de bienveillant et curieux..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Expression libre (optionnel)
              </label>
              <textarea
                value={answers.free_expression || ''}
                onChange={(e) => setAnswer('free_expression', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows={4}
                placeholder="Tout ce que vous voulez ajouter sur vous..."
              />
            </div>
          </div>

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
      )}

      {currentPhase === 'prompt' && generatedPrompt && (
        <div className="space-y-6">
          <div className={`p-8 rounded-2xl border ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
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

            <div className={`relative rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'
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

            <div className={`mt-6 p-6 rounded-xl border ${
              isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'
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
                <li>5. Revenez ici pour sauvegarder votre profil</li>
              </ol>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => setCurrentPhase('complete')}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
              >
                J'ai terminé avec l'IA →
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPhase === 'complete' && (
        <div className={`p-8 rounded-2xl border text-center ${
          isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
        }`}>
          <div className="text-6xl mb-4">🎉</div>
          <h3 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
            Prompt Généré !
          </h3>
          <p className={`text-lg ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
            Utilisez votre prompt dans ChatGPT pour générer votre profil psychologique.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3Finalization;
