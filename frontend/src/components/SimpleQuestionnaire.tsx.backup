import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface SimpleQuestionnaireProps {
  isDarkMode: boolean;
}

interface FormData {
  firstName: string;
  age: string;
  gender: string;
  orientation: string;
  energySource: string;
  communicationStyle: string;
  lovePriority: string;
  conflictApproach: string;
  relationship_learning: string;
  ideal_partner: string;
  free_expression: string;
}

const SimpleQuestionnaire: React.FC<SimpleQuestionnaireProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '', age: '', gender: '', orientation: '',
    energySource: '', communicationStyle: '', lovePriority: '', conflictApproach: '',
    relationship_learning: '', ideal_partner: '', free_expression: ''
  });

  const [step, setStep] = useState<'form' | 'prompt' | 'paste' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.firstName.trim().length >= 2 &&
           parseInt(formData.age) >= 18 && parseInt(formData.age) <= 100 &&
           formData.gender && formData.orientation &&
           formData.energySource && formData.communicationStyle &&
           formData.lovePriority && formData.conflictApproach;
  };

  const handleGeneratePrompt = async () => {
    if (!user || !isFormValid()) return;
    setLoading(true);
    setError(null);

    try {
      const API_BASE = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/api/questionnaire'
        : '/api/questionnaire';

      const response = await fetch(`${API_BASE}/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.session?.access_token || ''}`
        },
        body: JSON.stringify({
          answers: {
            firstName: formData.firstName,
            age: parseInt(formData.age),
            gender: formData.gender,
            orientation: formData.orientation,
            energySource: formData.energySource,
            communicationStyle: formData.communicationStyle,
            lovePriority: formData.lovePriority,
            conflictApproach: formData.conflictApproach,
            relationship_learning: formData.relationship_learning || undefined,
            ideal_partner: formData.ideal_partner || undefined,
            free_expression: formData.free_expression || undefined
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Erreur ${response.status}`);
      if (data.success && data.data) {
        setGeneratedPrompt(data.data.prompt);
        setSessionId(data.data.sessionId);
        setStep('prompt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  const handleVerifyAndSave = async () => {
    if (!user || !aiResponse.trim() || !sessionId) return;
    setVerifying(true);
    setError(null);

    try {
      const API_BASE = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3001/api/questionnaire'
        : '/api/questionnaire';

      const verifyResponse = await fetch(`${API_BASE}/verify-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.session?.access_token || ''}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          profileText: aiResponse.trim(),
          userId: user.id
        })
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.error || 'Erreur de vérification');
      if (!verifyData.valid) throw new Error(verifyData.message || 'Profil invalide');

      setSaving(true);

      const submitResponse = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.session?.access_token || ''}`
        },
        body: JSON.stringify({
          answers: {
            firstName: formData.firstName, age: parseInt(formData.age),
            gender: formData.gender, orientation: formData.orientation,
            energySource: formData.energySource, communicationStyle: formData.communicationStyle,
            lovePriority: formData.lovePriority, conflictApproach: formData.conflictApproach,
            relationship_learning: formData.relationship_learning || undefined,
            ideal_partner: formData.ideal_partner || undefined,
            free_expression: formData.free_expression || undefined
          },
          generatedPrompt: generatedPrompt
        })
      });

      const submitData = await submitResponse.json();
      if (!submitResponse.ok) throw new Error(submitData.error || 'Erreur de sauvegarde');

      const updateResponse = await fetch(`${API_BASE}/${submitData.responseId}/ai-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.session?.access_token || ''}`
        },
        body: JSON.stringify({ chatGPTResponse: aiResponse })
      });

      if (!updateResponse.ok) throw new Error('Erreur de mise à jour du profil');
      setStep('success');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setVerifying(false);
      setSaving(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
    isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  }`;

  const selectClass = `w-full px-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-purple-500 ${
    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const cardClass = `p-8 rounded-2xl border ${
    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/90 border-gray-200'
  }`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🧠</div>
        <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Questionnaire Psychologique Affinia
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Génère ton analyse personnalisée avec l'IA
        </p>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div><p className="font-medium">Erreur</p><p className="text-sm">{error}</p></div>
        </div>
      )}

      {step === 'form' && (
        <div className={cardClass}>
          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleGeneratePrompt(); }}>
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>👤 Identité</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Prénom *</label>
                  <input type="text" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Ton prénom" className={inputClass} required />
                </div>
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Âge *</label>
                  <input type="number" min="18" max="100" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} placeholder="Ton âge" className={inputClass} required />
                </div>
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Genre *</label>
                  <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className={selectClass} required>
                    <option value="">Sélectionne...</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="non-binaire">Non-binaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Orientation *</label>
                  <select value={formData.orientation} onChange={(e) => handleChange('orientation', e.target.value)} className={selectClass} required>
                    <option value="">Sélectionne...</option>
                    <option value="hétéro">Hétérosexuel(le)</option>
                    <option value="homo">Homosexuel(le)</option>
                    <option value="bi">Bisexuel(le)</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>🧠 Psychologie</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Comment tu te ressources ? *</label>
                  <select value={formData.energySource} onChange={(e) => handleChange('energySource', e.target.value)} className={selectClass} required>
                    <option value="">Sélectionne...</option>
                    <option value="solo_time">Plutôt seul(e)</option>
                    <option value="social_energy">Avec les autres</option>
                    <option value="balanced_mix">Les deux selon l'humeur</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Style de communication *</label>
                  <select value={formData.communicationStyle} onChange={(e) => handleChange('communicationStyle', e.target.value)} className={selectClass} required>
                    <option value="">Sélectionne...</option>
                    <option value="direct_honest">Direct et franc</option>
                    <option value="diplomatic_careful">Diplomatique et prudent</option>
                    <option value="emotional_expressive">Expressif et émotionnel</option>
                    <option value="reserved_thoughtful">Réservé mais réfléchi</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>💝 En Amour</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ce qui compte le plus ? *</label>
                  <select value={formData.lovePriority} onChange={(e) => handleChange('lovePriority', e.target.value)} className={selectClass} required>
                    <option value="">Sélectionne...</option>
                    <option value="emotional_connection">Connexion émotionnelle</option>
                    <option value="mutual_respect">Respect mutuel</option>
                    <option value="shared_growth">Évolution ensemble</option>
                    <option value="fun_complicity">Complicité et fun</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Face aux conflits ? *</label>
                  <select value={formData.conflictApproach} onChange={(e) => handleChange('conflictApproach', e.target.value)} className={selectClass} required>
                    <option value="">Sélectionne...</option>
                    <option value="address_immediately">Je dis tout directement</option>
                    <option value="cool_down_first">Je me calme d'abord</option>
                    <option value="avoid_when_possible">J'évite si c'est pas grave</option>
                    <option value="seek_compromise">Je cherche un compromis</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>✨ Questions Optionnelles</h2>
              <div className="space-y-4">
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Qu'as-tu appris de tes relations passées ?</label>
                  <textarea value={formData.relationship_learning} onChange={(e) => handleChange('relationship_learning', e.target.value)} placeholder="Ex: J'ai appris l'importance de la communication..." className={`${inputClass} resize-none`} rows={3} />
                </div>
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Décris ton partenaire idéal</label>
                  <textarea value={formData.ideal_partner} onChange={(e) => handleChange('ideal_partner', e.target.value)} placeholder="Ex: Quelqu'un de bienveillant et curieux..." className={`${inputClass} resize-none`} rows={3} />
                </div>
                <div>
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Expression libre</label>
                  <textarea value={formData.free_expression} onChange={(e) => handleChange('free_expression', e.target.value)} placeholder="Tout ce que tu veux ajouter..." className={`${inputClass} resize-none`} rows={4} />
                </div>
              </div>
            </div>

            <div className="text-center pt-6">
              <button type="submit" disabled={!isFormValid() || loading} className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                isFormValid() && !loading ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}>
                {loading ? (<><Loader className="w-5 h-5 animate-spin" />Génération...</>) : (<><Brain className="w-5 h-5" />Générer mon Analyse IA</>)}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'prompt' && (
        <div className={cardClass}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ton Prompt Personnalisé</h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Copie ce prompt dans ChatGPT ou Claude AI</p>
          </div>

          <div className={`mb-6 rounded-xl border ${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between p-4 border-b border-current border-opacity-10">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Session: {sessionId}</span>
              </div>
              <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                copied ? 'bg-green-100 text-green-700' : isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}>
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier le Prompt'}
              </button>
            </div>
            <pre className={`p-4 text-sm overflow-x-auto max-h-96 whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{generatedPrompt}</pre>
          </div>

          <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            <h3 className="font-bold mb-3">📋 Instructions :</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Copie le prompt ci-dessus</li>
              <li>Va sur <strong>chat.openai.com</strong> ou <strong>claude.ai</strong></li>
              <li>Colle le prompt et envoie</li>
              <li>Tu vas recevoir ton profil psychologique personnalisé !</li>
            </ol>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button onClick={() => setStep('form')} className={`px-6 py-3 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              ← Retour au formulaire
            </button>
            <button onClick={() => setStep('paste')} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium">
              J'ai ma réponse ChatGPT →
            </button>
          </div>
        </div>
      )}

      {step === 'paste' && (
        <div className={cardClass}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Colle ta Réponse ChatGPT</h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Colle ici TOUTE la réponse que ChatGPT t'a donnée</p>
          </div>

          <div className="mb-6">
            <label className={`block font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Réponse complète de ChatGPT/Claude *</label>
            <textarea value={aiResponse} onChange={(e) => setAiResponse(e.target.value)} placeholder="Colle ici toute la réponse de ChatGPT, depuis le début jusqu'à la fin, y compris le JSON..." className={`w-full px-4 py-4 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`} rows={15} required />
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>⚠️ Important : Colle TOUTE la réponse, pas seulement une partie !</p>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={() => setStep('prompt')} className={`px-6 py-3 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>← Retour au prompt</button>
            <button onClick={handleVerifyAndSave} disabled={!aiResponse.trim() || verifying || saving} className={`px-8 py-3 rounded-xl font-medium transition-all ${!aiResponse.trim() || verifying || saving ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'}`}>
              {verifying ? (<span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" />Vérification...</span>) : saving ? (<span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" />Sauvegarde...</span>) : ('Vérifier et Sauvegarder')}
            </button>
          </div>

          <div className={`mt-6 p-4 rounded-xl border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
            <h4 className="font-medium mb-2">🔍 Que vérifions-nous ?</h4>
            <ul className="text-sm space-y-1">
              <li>• Que la réponse correspond bien à ton session</li>
              <li>• Que le profil est complet et valide</li>
              <li>• Que les données JSON sont correctes</li>
            </ul>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className={cardClass}>
          <div className="text-center">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Félicitations !</h2>
            <p className={`text-xl mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ton profil psychologique a été créé et sauvegardé avec succès !</p>
            
            <div className={`p-6 rounded-xl border mb-8 ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div><div className="text-3xl mb-2">✅</div><p className={`font-medium ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>Questionnaire<br/>Complété</p></div>
                <div><div className="text-3xl mb-2">🧠</div><p className={`font-medium ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>Analyse IA<br/>Sauvegardée</p></div>
                <div><div className="text-3xl mb-2">🚀</div><p className={`font-medium ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>Prêt pour<br/>les Rencontres</p></div>
              </div>
            </div>

            <div className="space-y-4">
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tu peux maintenant découvrir d'autres utilisateurs et commencer tes rencontres psychologiques !</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => window.location.href = '/discovery'} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all">🔍 Découvrir la Communauté</button>
                <button onClick={() => window.location.href = '/profile'} className={`px-6 py-4 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>👤 Voir mon Profil</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleQuestionnaire;
