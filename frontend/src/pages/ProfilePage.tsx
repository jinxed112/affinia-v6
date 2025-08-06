// ProfilePage.tsx - Version corrigée sans useQuestionnaire
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { AffiniaCard } from '../components/profile/AffiniaCard';
import { PhotoManager } from '../components/profile/PhotoManager';
import { BioEditor } from '../components/profile/BioEditor';
import { LocationPicker } from '../components/profile/LocationPicker';
import { RelationshipPreferences } from '../components/profile/RelationshipPreferences';
import { ProfileStats } from '../components/profile/ProfileStats';
import ProfileExtendedService from '../services/profileExtendedService';
import { useDesignSystem, UnifiedAnimations } from '../styles/designSystem';
import { BaseComponents } from '../components/ui/BaseComponents';
import { 
  Settings, Shield, Heart, MapPin, Camera, FileText, CheckCircle,
  AlertCircle, Loader, User, Star, TrendingUp, Award, Target, Save,
  Users, ChevronDown, Info, RefreshCw, Zap
} from 'lucide-react';
import type { ProfilePhoto } from '../types/profile';

interface ProfilePageProps {
  isDarkMode: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, questionnaire, loading, error, refreshProfile } = useProfile();

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  
  // État local pour le nom (input contrôlé)
  const [userName, setUserName] = useState('');
  const [nameChanged, setNameChanged] = useState(false);
  
  // État local pour le genre
  const [userGender, setUserGender] = useState('');
  const [genderChanged, setGenderChanged] = useState(false);
  
  const designSystem = useDesignSystem(isDarkMode);

  // Refs pour les sections à scroller
  const personalInfoRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const questionnaireRef = useRef<HTMLDivElement>(null);
  const preferencesRef = useRef<HTMLDivElement>(null);

  // Options de genre
  const genderOptions = [
    { value: '', label: 'Non spécifié' },
    { value: 'homme', label: 'Homme' },
    { value: 'femme', label: 'Femme' },
    { value: 'non-binaire', label: 'Non-binaire' },
    { value: 'autre', label: 'Autre' },
  ];

  // 🆕 FONCTIONS UTILITAIRES AVEC FALLBACK QUESTIONNAIRE
  const getUserName = () => {
    if (profile?.name) return profile.name;
    
    if (questionnaire?.answers) {
      const answers = typeof questionnaire.answers === 'string' 
        ? JSON.parse(questionnaire.answers) 
        : questionnaire.answers;
      if (answers.firstName) return answers.firstName;
    }
    
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    return null;
  };

  const getUserGender = () => {
    if (profile?.gender) return profile.gender;
    
    if (questionnaire?.answers) {
      const answers = typeof questionnaire.answers === 'string' 
        ? JSON.parse(questionnaire.answers) 
        : questionnaire.answers;
      if (answers.gender) return answers.gender;
    }
    
    return null;
  };

  const getUserAge = () => {
    if (profile?.birth_date) {
      return ProfileExtendedService.getAgeFromDate(profile.birth_date);
    }
    
    if (questionnaire?.answers) {
      const answers = typeof questionnaire.answers === 'string' 
        ? JSON.parse(questionnaire.answers) 
        : questionnaire.answers;
      if (answers.age) return answers.age;
    }
    
    return null;
  };

  // 🆕 INITIALISATION DU NOM AVEC FALLBACK
  useEffect(() => {
    const nameValue = getUserName();
    if (nameValue && !nameChanged) {
      setUserName(nameValue);
      console.log('📝 Nom initialisé:', nameValue);
    }
  }, [profile?.name, questionnaire?.answers, user?.user_metadata?.full_name, nameChanged]);

  // 🆕 INITIALISATION DU GENRE AVEC FALLBACK
  useEffect(() => {
    const genderValue = getUserGender();
    if (genderValue && !genderChanged) {
      setUserGender(genderValue);
      console.log('👤 Genre initialisé:', genderValue);
    }
  }, [profile?.gender, questionnaire?.answers, genderChanged]);

  // Vérifier si le questionnaire est complété (version simplifiée)
  const hasCompletedQuestionnaire = () => {
    return questionnaire?.profile_json != null;
  };

  // Charger les photos de l'utilisateur
  useEffect(() => {
    const loadPhotos = async () => {
      if (!user) return;

      try {
        setLoadingPhotos(true);
        const userPhotos = await ProfileExtendedService.getUserPhotos(user.id);
        setPhotos(userPhotos);
      } catch (error) {
        console.error('Erreur lors du chargement des photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadPhotos();
  }, [user]);

  const showSaveMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  // 🔧 FONCTION HANDLESAVE UNIFIÉE
  const handleSave = async (updates: any) => {
    if (!user) {
      console.error('❌ Pas d\'utilisateur connecté');
      showSaveMessage('error', 'Erreur: utilisateur non connecté');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Sauvegarde unifiée - données:', updates);
      
      const result = await ProfileExtendedService.updateProfile(user.id, updates);
      console.log('✅ Résultat sauvegarde:', result);
      
      // Rafraîchir le profil pour voir les changements
      await refreshProfile();
      
      showSaveMessage('success', 'Profil mis à jour avec succès !');
      
      // Réinitialiser les états
      if (updates.name) setNameChanged(false);
      if (updates.gender) setGenderChanged(false);
    } catch (err) {
      console.error('❌ Erreur sauvegarde unifiée:', err);
      showSaveMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setUserName(newName);
    setNameChanged(true);
    console.log('📝 Nom changé:', newName);
  };

  const handleNameSave = async () => {
    if (userName.trim() !== '' && userName !== getUserName()) {
      console.log('💾 Sauvegarde du nom:', userName.trim());
      await handleSave({ name: userName.trim() });
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    }
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGender = e.target.value;
    setUserGender(newGender);
    setGenderChanged(true);
    console.log('👤 Genre changé:', newGender);
  };

  const handleGenderSave = async () => {
    if (userGender !== getUserGender()) {
      console.log('💾 Sauvegarde du genre:', userGender);
      await handleSave({ gender: userGender });
    }
  };

  const handlePhotoSave = async (updates: any) => {
    if (user) {
      try {
        const userPhotos = await ProfileExtendedService.getUserPhotos(user.id);
        setPhotos(userPhotos);
        showSaveMessage('success', 'Photos mises à jour !');
      } catch (error) {
        console.error('Erreur lors du rechargement des photos:', error);
        showSaveMessage('error', 'Erreur lors du rechargement des photos');
      }
    }
  };

  const handleLocationSave = async (locationData: any) => {
    console.log('🏠 ProfilePage - Données location reçues:', locationData);
    await handleSave(locationData);
  };

  // 🆕 FONCTION POUR SCROLLER VERS UNE SECTION - AMÉLIORÉE
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      // Calculer la position avec offset pour le header fixe
      const headerHeight = 100; // Header + padding
      const elementTop = ref.current.offsetTop - headerHeight;
      
      // Scroll manuel plus précis
      window.scrollTo({
        top: elementTop,
        behavior: 'smooth'
      });
      
      // Effet visuel avec animation plus marquée
      ref.current.style.transform = 'scale(1.05)';
      ref.current.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      ref.current.style.boxShadow = '0 20px 40px rgba(147, 51, 234, 0.3)';
      ref.current.style.borderColor = 'rgb(147 51 234 / 0.5)';
      
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1)';
          ref.current.style.boxShadow = '';
          ref.current.style.borderColor = '';
        }
      }, 600);
    }
  };

  if (loading || loadingPhotos) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="pt-20 pb-8 px-4 relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader className={`w-6 h-6 animate-spin text-purple-400`} />
              <span className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                Chargement de votre profil...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="pt-20 pb-8 px-4 relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="w-6 h-6" />
              <span className="text-lg">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculer la complétude du profil avec fallback
  const completeness = ProfileExtendedService.calculateProfileCompleteness(profile, questionnaire, photos);

  // SECTIONS DE COMPLÉTUDE (simplifiées sans sync)
  const completenessItems = [
    { 
      label: 'Nom', 
      completed: !!getUserName(), 
      icon: User, 
      value: getUserName() || 'Manquant',
      ref: personalInfoRef,
      action: () => scrollToSection(personalInfoRef),
      source: profile?.name ? 'profil' : questionnaire?.answers?.firstName ? 'questionnaire' : 'Google'
    },
    { 
      label: 'Genre', 
      completed: !!getUserGender(), 
      icon: Users, 
      value: (() => {
        const gender = getUserGender();
        return gender ? genderOptions.find(g => g.value === gender)?.label || gender : 'Manquant';
      })(),
      ref: personalInfoRef,
      action: () => scrollToSection(personalInfoRef),
      source: profile?.gender ? 'profil' : questionnaire?.answers?.gender ? 'questionnaire' : null
    },
    { 
      label: 'Bio', 
      completed: !!profile?.bio, 
      icon: FileText, 
      value: profile?.bio ? 'Complétée' : 'Manquante',
      ref: bioRef,
      action: () => scrollToSection(bioRef),
      source: 'profil'
    },
    { 
      label: 'Ville', 
      completed: !!profile?.city, 
      icon: MapPin, 
      value: profile?.city || 'Manquante',
      ref: locationRef,
      action: () => scrollToSection(locationRef),
      source: 'profil'
    },
    { 
      label: 'Photos', 
      completed: photos.length > 0, 
      icon: Camera, 
      value: `${photos.length}/6`,
      ref: photosRef,
      action: () => scrollToSection(photosRef),
      source: 'profil'
    },
    { 
      label: 'Questionnaire', 
      completed: !!questionnaire, 
      icon: Star, 
      value: questionnaire ? 'Complété' : 'À faire',
      ref: questionnaireRef,
      action: () => questionnaire ? scrollToSection(questionnaireRef) : navigate('/questionnaire'),
      source: 'questionnaire'
    },
    { 
      label: 'Âge', 
      completed: !!getUserAge(), 
      icon: Award, 
      value: getUserAge() ? `${getUserAge()} ans` : 'Manquant',
      ref: questionnaireRef,
      action: () => getUserAge() ? scrollToSection(questionnaireRef) : navigate('/questionnaire'),
      source: profile?.birth_date ? 'profil' : questionnaire?.answers?.age ? 'questionnaire' : null
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      {/* Styles CSS unifiés */}
      <style>{`
        ${UnifiedAnimations}
      `}</style>

      {/* Background mystique unifié */}
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      <div className="pt-20 pb-20 px-4 relative z-10 min-h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          
          {/* Layout principal */}
          <div className="flex flex-col xl:flex-row gap-8">
            
            {/* Colonne gauche - Toutes les sections */}
            <div className="xl:flex-1 xl:max-w-4xl space-y-8">
              
              {/* Indicateur de progression */}
              <BaseComponents.Card 
                isDarkMode={isDarkMode} 
                variant="highlighted" 
                className="p-8 mystical-glow"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-xl font-bold flex items-center gap-3 ${designSystem.getTextClasses('primary')}`}>
                      <TrendingUp className="w-6 h-6 text-purple-400 animate-pulse" />
                      Progression du profil
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Cliquez sur une section pour la compléter
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold gradient-text animate-pulse`}>
                      {completeness.percentage}%
                    </div>
                    <div className="w-32 bg-gray-300 rounded-full h-3 mt-2 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 animate-shimmer ${
                          completeness.percentage === 100
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : completeness.percentage >= 50
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : 'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${completeness.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Grille des critères */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {completenessItems.map((item, index) => (
                    <BaseComponents.Card
                      key={item.label}
                      isDarkMode={isDarkMode}
                      variant="default"
                      className={`p-4 card-hover cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                        item.completed 
                          ? 'border-green-500/30 bg-green-500/5' 
                          : 'border-red-500/30 bg-red-500/5'
                      }`}
                      onClick={item.action}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.completed 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${designSystem.getTextClasses('primary')}`}>
                            {item.label}
                          </p>
                          <p className={`text-xs truncate ${
                            item.completed 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {item.value}
                          </p>
                          {item.source && item.source !== 'profil' && (
                            <p className={`text-xs ${designSystem.getTextClasses('muted')} flex items-center gap-1`}>
                              <Info className="w-2 h-2" />
                              {item.source}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            item.completed ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {item.completed ? (
                              <CheckCircle className="w-3 h-3 text-white" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </BaseComponents.Card>
                  ))}
                </div>
              </BaseComponents.Card>

              {/* Section Informations personnelles */}
              <BaseComponents.Card 
                ref={personalInfoRef}
                isDarkMode={isDarkMode} 
                variant="default" 
                className="p-8 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white animate-float">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      Informations personnelles
                    </h2>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Votre nom, genre et autres informations de base
                    </p>
                  </div>
                  {getUserName() && getUserGender() && (
                    <BaseComponents.Badge variant="success" isDarkMode={isDarkMode}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complété
                    </BaseComponents.Badge>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Nom */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
                      Nom d'affichage
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={userName}
                        onChange={handleNameChange}
                        onKeyPress={handleNameKeyPress}
                        placeholder="Votre nom d'affichage"
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-200 mystical-glow ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        } focus:ring-4 focus:ring-purple-500/20`}
                      />
                      {nameChanged && (
                        <BaseComponents.Button
                          variant="primary"
                          size="medium"
                          onClick={handleNameSave}
                          className="flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Sauver
                        </BaseComponents.Button>
                      )}
                    </div>
                    {nameChanged && (
                      <p className={`text-xs mt-1 text-yellow-500`}>
                        Cliquez sur "Sauver" ou appuyez sur Entrée pour confirmer
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${designSystem.getTextClasses('muted')}`}>
                      Source: {profile?.name ? 'Profil personnalisé' : questionnaire?.answers?.firstName ? 'Questionnaire' : 'Compte Google'}
                    </p>
                  </div>

                  {/* Genre */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
                      Genre
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={userGender}
                        onChange={handleGenderChange}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-200 mystical-glow ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                        } focus:ring-4 focus:ring-purple-500/20`}
                      >
                        {genderOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {genderChanged && (
                        <BaseComponents.Button
                          variant="primary"
                          size="medium"
                          onClick={handleGenderSave}
                          className="flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Sauver
                        </BaseComponents.Button>
                      )}
                    </div>
                    {genderChanged && (
                      <p className={`text-xs mt-1 text-yellow-500`}>
                        Cliquez sur "Sauver" pour confirmer le changement
                      </p>
                    )}
                    <p className={`text-xs mt-2 ${designSystem.getTextClasses('muted')}`}>
                      Source: {profile?.gender ? 'Profil personnalisé' : questionnaire?.answers?.gender ? 'Questionnaire' : 'Non renseigné'}
                    </p>
                  </div>

                  {/* Âge */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
                      Âge
                    </label>
                    <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                      {getUserAge() ? (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-400" />
                          <span className={designSystem.getTextClasses('primary')}>{getUserAge()} ans</span>
                          <span className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                            • Source: {profile?.birth_date ? 'Profil' : 'Questionnaire'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className={designSystem.getTextClasses('muted')}>Non renseigné</span>
                          <BaseComponents.Button
                            variant="primary"
                            size="small"
                            onClick={() => navigate('/questionnaire')}
                          >
                            Faire le questionnaire
                          </BaseComponents.Button>
                        </div>
                      )}
                    </BaseComponents.Card>
                    <p className={`text-xs mt-2 ${designSystem.getTextClasses('muted')}`}>
                      L'âge est calculé depuis votre date de naissance ou questionnaire psychologique
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>

              {/* Section Photos */}
              <BaseComponents.Card 
                ref={photosRef}
                isDarkMode={isDarkMode} 
                variant="default" 
                className="p-8 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-float">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      Mes Photos
                    </h2>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Ajoutez jusqu'à 6 photos pour votre profil
                    </p>
                  </div>
                  {photos.length > 0 && (
                    <BaseComponents.Badge 
                      variant={photos.length >= 3 ? "success" : "warning"} 
                      isDarkMode={isDarkMode}
                    >
                      {photos.length}/6
                    </BaseComponents.Badge>
                  )}
                </div>
                <PhotoManager 
                  isDarkMode={isDarkMode}
                  onSave={handlePhotoSave}
                  currentPhotos={photos}
                />
              </BaseComponents.Card>

              {/* Section Bio */}
              <BaseComponents.Card 
                ref={bioRef}
                isDarkMode={isDarkMode} 
                variant="default" 
                className="p-8 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white animate-float">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      Ma Bio
                    </h2>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Décrivez-vous en quelques mots
                    </p>
                  </div>
                  {profile?.bio && (
                    <BaseComponents.Badge variant="success" isDarkMode={isDarkMode}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complété
                    </BaseComponents.Badge>
                  )}
                </div>
                <BioEditor 
                  isDarkMode={isDarkMode}
                  currentBio={profile?.bio || ''}
                  onSave={handleSave}
                />
              </BaseComponents.Card>

              {/* Section Localisation */}
              <BaseComponents.Card 
                ref={locationRef}
                isDarkMode={isDarkMode} 
                variant="default" 
                className="p-8 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white animate-float">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      Ma Localisation
                    </h2>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Indiquez votre ville et vos préférences de distance
                    </p>
                  </div>
                  {profile?.city && (
                    <BaseComponents.Badge variant="success" isDarkMode={isDarkMode}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complété
                    </BaseComponents.Badge>
                  )}
                </div>
                <LocationPicker 
                  isDarkMode={isDarkMode}
                  currentCity={profile?.city || ''}
                  currentLat={profile?.latitude}
                  currentLng={profile?.longitude}
                  currentMaxDistance={profile?.max_distance || 50}
                  onSave={handleLocationSave}
                />
              </BaseComponents.Card>

              {/* Section Préférences */}
              <BaseComponents.Card 
                ref={preferencesRef}
                isDarkMode={isDarkMode} 
                variant="default" 
                className="p-8 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white animate-float">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      Mes Préférences
                    </h2>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Définissez vos critères de recherche
                    </p>
                  </div>
                </div>
                <RelationshipPreferences 
                  isDarkMode={isDarkMode}
                  onSave={handleSave}
                />
              </BaseComponents.Card>

              {/* Stats du profil */}
              <ProfileStats 
                isDarkMode={isDarkMode}
                profile={profile}
                questionnaire={questionnaire}
              />
            </div>

            {/* Colonne droite - AffiniaCard */}
            <div className="xl:w-96 xl:flex-shrink-0">
              <div className="space-y-4">
                {hasCompletedQuestionnaire() ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="mystical-glow w-full">
                        <div 
                          ref={questionnaireRef}
                          className="overflow-visible flex flex-col items-center justify-start pt-4 pb-4 scroll-mt-24"
                        >
                          <AffiniaCard
                            photos={photos}
                            profile={profile}
                            questionnaire={questionnaire}
                            className="transform hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Informations sur la carte */}
                    <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-4 text-center">
                      <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                        Cette carte est générée à partir de votre analyse psychologique et évolue 
                        avec votre profil.
                      </p>
                    </BaseComponents.Card>
                    
                    {/* Boutons d'action */}
                    <div className="space-y-2">
                      <BaseComponents.Button 
                        variant="secondary"
                        size="small"
                        onClick={() => navigate('/questionnaire')}
                        className="w-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Refaire l'analyse
                      </BaseComponents.Button>
                      
                      <BaseComponents.Button 
                        variant="primary"
                        size="small"
                        onClick={() => navigate('/miroir')}
                        className="w-full"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Voir mon miroir complet
                      </BaseComponents.Button>
                    </div>
                  </div>
                ) : (
                  <BaseComponents.Card 
                    ref={questionnaireRef}
                    isDarkMode={isDarkMode} 
                    variant="highlighted" 
                    className="p-8 text-center scroll-mt-24"
                  >
                    <div className="space-y-6">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <Shield className={`w-8 h-8 ${designSystem.getTextClasses('muted')}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${designSystem.getTextClasses('primary')}`}>
                          Carte non disponible
                        </h3>
                        <p className={`text-sm mt-2 ${designSystem.getTextClasses('muted')}`}>
                          Complétez votre questionnaire pour débloquer votre carte Affinia
                        </p>
                      </div>
                      <BaseComponents.Button 
                        variant="primary"
                        size="large"
                        onClick={() => navigate('/questionnaire')}
                        className="w-full mystical-glow"
                      >
                        Faire le questionnaire
                      </BaseComponents.Button>
                    </div>
                  </BaseComponents.Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message de sauvegarde unifié */}
      {saveMessage && (
        <div className="fixed top-24 right-4 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <BaseComponents.Card
            isDarkMode={isDarkMode}
            variant="highlighted"
            className={`flex items-center gap-3 px-6 py-4 max-w-md ${
              saveMessage.type === 'success'
                ? 'border-green-500/50 bg-green-500/10'
                : saveMessage.type === 'info'
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-red-500/50 bg-red-500/10'
            } animate-pulse-glow`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : saveMessage.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm font-medium ${
              saveMessage.type === 'success' 
                ? 'text-green-400' 
                : saveMessage.type === 'info'
                  ? 'text-blue-400'
                  : 'text-red-400'
            }`}>
              {saveMessage.text}
            </span>
          </BaseComponents.Card>
        </div>
      )}

      {/* Loading overlay unifié */}
      {saving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-8 mystical-glow">
            <div className="flex items-center gap-4">
              <Loader className="w-6 h-6 animate-spin text-purple-600" />
              <span className={`text-lg font-medium ${designSystem.getTextClasses('primary')}`}>
                Sauvegarde en cours...
              </span>
            </div>
          </BaseComponents.Card>
        </div>
      )}
    </div>
  );
};
