import React, { useState } from 'react';
import { Edit3, Save, RotateCcw, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface BioEditorProps {
  isDarkMode: boolean;
  currentBio: string;
  onSave: (updates: { bio: string }) => Promise<void>;
}

export const BioEditor: React.FC<BioEditorProps> = ({ 
  isDarkMode, 
  currentBio = '', 
  onSave 
}) => {
  const [bio, setBio] = useState(currentBio);
  const [isEditing, setIsEditing] = useState(!currentBio);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const MAX_LENGTH = 500;
  const MIN_LENGTH = 20;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (bio.trim().length < MIN_LENGTH) {
      showMessage('error', `Votre bio doit contenir au moins ${MIN_LENGTH} caractères`);
      return;
    }

    try {
      setSaving(true);
      await onSave({ bio: bio.trim() });
      setIsEditing(false);
      showMessage('success', 'Bio mise à jour avec succès !');
    } catch (error) {
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(currentBio);
    setIsEditing(false);
  };

  const remainingChars = MAX_LENGTH - bio.length;
  const isValid = bio.trim().length >= MIN_LENGTH;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Ma Bio
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Présentez-vous en quelques mots
          </p>
        </div>

        {!isEditing && currentBio && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success'
            ? isDarkMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'
            : isDarkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parlez-nous de vous, vos passions, ce que vous recherchez..."
              className={`w-full h-32 p-4 rounded-xl resize-none transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
              maxLength={MAX_LENGTH}
            />
            
            <div className={`absolute bottom-3 right-3 text-xs font-medium ${
              remainingChars < 50 ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {bio.length}/{MAX_LENGTH}
            </div>
          </div>

          <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className={`h-full transition-all duration-300 ${
                isValid ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${Math.min((bio.length / MIN_LENGTH) * 100, 100)}%` }}
            />
          </div>

          <p className={`text-sm ${
            isValid ? isDarkMode ? 'text-green-400' : 'text-green-600' : isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            {isValid ? '✅ Bio valide' : `❌ Minimum ${MIN_LENGTH} caractères requis (${Math.max(0, MIN_LENGTH - bio.length)} restants)`}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                isValid && !saving
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                  : isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>

            <button
              onClick={handleCancel}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          {currentBio ? (
            <div className="space-y-3">
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentBio}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                  {currentBio.length} caractères
                </span>
                <span className={`flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  <CheckCircle className="w-4 h-4" />
                  Profil complet
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Edit3 className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Aucune bio ajoutée
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Cliquez sur "Modifier" pour ajouter votre bio
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};