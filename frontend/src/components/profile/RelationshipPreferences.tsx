import React, { useState, useEffect } from 'react';
import { Heart, Users, Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from "../../hooks/useProfile";

interface RelationshipPreferencesProps {
  isDarkMode: boolean;
  onSave: (updates: any) => Promise<void>;
}

export const RelationshipPreferences: React.FC<RelationshipPreferencesProps> = ({ 
  isDarkMode, 
  onSave 
}) => {
  const { profile } = useProfile();
  
  // États initialisés avec les données du profil
  const [relationshipType, setRelationshipType] = useState<string[]>(['serious']);
  const [genders, setGenders] = useState<string[]>(['all']);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 🔄 Initialiser avec les données du profil existant
  useEffect(() => {
    if (profile) {
      if (profile.relationship_type) setRelationshipType(profile.relationship_type);
      if (profile.interested_in_genders) setGenders(profile.interested_in_genders);
      if (profile.min_age) setMinAge(profile.min_age);
      if (profile.max_age) setMaxAge(profile.max_age);
    }
  }, [profile]);

  const relationshipTypes = [
    { value: 'serious', label: 'Relation sérieuse', icon: '💕' },
    { value: 'casual', label: 'Relation décontractée', icon: '😊' },
    { value: 'friendship', label: 'Amitié', icon: '🤝' },
    { value: 'hookup', label: 'Rencontres légères', icon: '🔥' }
  ];

  const genderOptions = [
    { value: 'men', label: 'Hommes', icon: '👨' },
    { value: 'women', label: 'Femmes', icon: '👩' },
    { value: 'non-binary', label: 'Non-binaire', icon: '🏳️‍⚧️' },
    { value: 'all', label: 'Tous les genres', icon: '🌈' }
  ];

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRelationshipTypeChange = (type: string) => {
    setRelationshipType(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenderChange = (gender: string) => {
    if (gender === 'all') {
      setGenders(prev => prev.includes('all') ? [] : ['all']);
    } else {
      setGenders(prev => {
        const newGenders = prev.filter(g => g !== 'all');
        return newGenders.includes(gender) 
          ? newGenders.filter(g => g !== gender)
          : [...newGenders, gender];
      });
    }
  };

  // 🔧 VRAIE SAUVEGARDE via onSave
  const handleSave = async () => {
    if (relationshipType.length === 0) {
      showMessage('error', 'Veuillez sélectionner au moins un type de relation');
      return;
    }
    
    if (genders.length === 0) {
      showMessage('error', 'Veuillez sélectionner au moins un genre qui vous intéresse');
      return;
    }

    try {
      setSaving(true);
      
      // 🆕 VRAIE SAUVEGARDE dans la table profiles
      await onSave({
        relationship_type: relationshipType,
        interested_in_genders: genders,
        min_age: minAge,
        max_age: maxAge
      });
      
      showMessage('success', 'Préférences mises à jour avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Vérifier si des changements ont été faits
  const hasChanges = () => {
    return (
      JSON.stringify(relationshipType) !== JSON.stringify(profile?.relationship_type || ['serious']) ||
      JSON.stringify(genders) !== JSON.stringify(profile?.interested_in_genders || ['all']) ||
      minAge !== (profile?.min_age || 18) ||
      maxAge !== (profile?.max_age || 35)
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Mes Préférences
        </h3>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Définissez vos critères pour recevoir des suggestions personnalisées
        </p>
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

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Je recherche
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {relationshipTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleRelationshipTypeChange(type.value)}
              className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                relationshipType.includes(type.value)
                  ? isDarkMode ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-purple-100 border-purple-300 text-purple-700'
                  : isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon}</span>
                <p className="font-medium">{type.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Je suis intéressé(e) par
          </h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map((gender) => (
            <button
              key={gender.value}
              onClick={() => handleGenderChange(gender.value)}
              className={`p-3 rounded-xl text-center transition-all duration-200 border ${
                genders.includes(gender.value)
                  ? isDarkMode ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-blue-100 border-blue-300 text-blue-700'
                  : isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <span className="text-2xl block">{gender.icon}</span>
                <p className="font-medium text-sm">{gender.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Tranche d'âge
        </h4>

        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Âge minimum
              </label>
              <input
                type="range"
                min="18"
                max="80"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
              />
              <div className="text-center mt-2">
                <span className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {minAge} ans
                </span>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Âge maximum
              </label>
              <input
                type="range"
                min="18"
                max="80"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
              />
              <div className="text-center mt-2">
                <span className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {maxAge} ans
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Vous cherchez des personnes entre{' '}
              <span className="font-bold text-green-500">{minAge}</span>
              {' '}et{' '}
              <span className="font-bold text-green-500">{maxAge}</span>
              {' '}ans
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || relationshipType.length === 0 || genders.length === 0 || !hasChanges()}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            !saving && relationshipType.length > 0 && genders.length > 0 && hasChanges()
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
              : isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Sauvegarde...' : hasChanges() ? 'Sauvegarder les préférences' : 'Aucun changement'}
        </button>
      </div>
    </div>
  );
};