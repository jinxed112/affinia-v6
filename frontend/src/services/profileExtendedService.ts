// src/services/profileExtendedService.ts
import { supabase } from '../lib/supabase';
import type { ProfilePhoto, RelationshipPreferences, City } from '../types/profile';

export class ProfileExtendedService {
  // ==================== PHOTOS ====================
  
  static async getUserPhotos(userId: string): Promise<ProfilePhoto[]> {
    const { data, error } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('photo_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async uploadPhoto(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  static async savePhoto(
    userId: string, 
    photoUrl: string, 
    order: number, 
    isMain: boolean = false
  ): Promise<ProfilePhoto> {
    // Si c'est la photo principale, retirer le statut des autres
    if (isMain) {
      await supabase
        .from('profile_photos')
        .update({ is_main: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('profile_photos')
      .insert({
        user_id: userId,
        photo_url: photoUrl,
        photo_order: order,
        is_main: isMain
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePhoto(photoId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  }

  static async setMainPhoto(userId: string, photoId: string): Promise<void> {
    // Retirer le statut principal de toutes les photos
    await supabase
      .from('profile_photos')
      .update({ is_main: false })
      .eq('user_id', userId);

    // Définir la nouvelle photo principale
    const { error } = await supabase
      .from('profile_photos')
      .update({ is_main: true })
      .eq('id', photoId);

    if (error) throw error;
  }

  static async reorderPhotos(photoUpdates: { id: string; order: number }[]): Promise<void> {
    const updates = photoUpdates.map(update => 
      supabase
        .from('profile_photos')
        .update({ photo_order: update.order })
        .eq('id', update.id)
    );

    await Promise.all(updates);
  }

  // ==================== PRÉFÉRENCES ====================

  static async getRelationshipPreferences(userId: string): Promise<RelationshipPreferences | null> {
    const { data, error } = await supabase
      .from('relationship_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = pas de résultat
      throw error;
    }

    return data;
  }

  static async saveRelationshipPreferences(
    userId: string, 
    preferences: Omit<RelationshipPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<RelationshipPreferences> {
    const { data, error } = await supabase
      .from('relationship_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== SAUVEGARDE PROFIL UNIFIÉE ====================

  /**
   * 🆕 Méthode unifiée pour mettre à jour n'importe quel champ du profil
   * Utilise Supabase directement pour éviter les conflits avec l'API backend
   */
  static async updateProfile(
    userId: string, 
    updates: {
      name?: string;
      bio?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      max_distance?: number;
      avatar_url?: string;
      birth_date?: string;
      mirror_visibility?: string;
      gender?: string; // 🆕 Ajout du champ gender
      // Autres champs de la table profiles...
    }
  ): Promise<any> {
    console.log('💾 ProfileExtendedService.updateProfile', { userId, updates });
    
    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Ajouter seulement les champs définis
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    });
    
    console.log('📝 Données à sauvegarder en DB:', updateData);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur Supabase updateProfile:', error);
      throw error;
    }
    
    console.log('✅ Profil mis à jour avec succès:', data);
    return data;
  }

  // ==================== GÉOLOCALISATION ====================

  static async searchCities(query: string, limit: number = 10): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('population', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getPopularCities(limit: number = 20): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('country', 'France')
      .order('population', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Garder les méthodes spécifiques pour compatibilité
  static async updateProfileLocationComplete(
    userId: string, 
    locationData: {
      city?: string;
      latitude?: number;
      longitude?: number;
      max_distance?: number;
    }
  ): Promise<void> {
    await this.updateProfile(userId, locationData);
  }

  static async updateProfileLocation(
    userId: string, 
    city: string, 
    latitude: number, 
    longitude: number
  ): Promise<void> {
    return this.updateProfile(userId, {
      city,
      latitude,
      longitude
    });
  }

  // ==================== CALCULS ET STATS AVEC FALLBACK ====================

  /**
   * 🆕 FONCTION AMÉLIORÉE avec fallback questionnaire
   * Calcule la complétude en utilisant les données du profil ET du questionnaire
   */
  static calculateProfileCompleteness(profile: any, questionnaire: any, photos: ProfilePhoto[]): {
    percentage: number;
    completed: string[];
    missing: string[];
  } {
    // 🆕 FONCTIONS UTILITAIRES AVEC FALLBACK
    const getName = () => {
      if (profile?.name) return profile.name;
      if (questionnaire?.answers) {
        const answers = typeof questionnaire.answers === 'string' 
          ? JSON.parse(questionnaire.answers) 
          : questionnaire.answers;
        if (answers.firstName) return answers.firstName;
      }
      return null;
    };

    const getGender = () => {
      if (profile?.gender) return profile.gender;
      if (questionnaire?.answers) {
        const answers = typeof questionnaire.answers === 'string' 
          ? JSON.parse(questionnaire.answers) 
          : questionnaire.answers;
        if (answers.gender) return answers.gender;
      }
      return null;
    };

    const getAge = () => {
      // Priorité 1: calculer depuis birth_date du profil
      if (profile?.birth_date) {
        return this.getAgeFromDate(profile.birth_date);
      }
      // Priorité 2: utiliser l'âge du questionnaire
      if (questionnaire?.answers) {
        const answers = typeof questionnaire.answers === 'string' 
          ? JSON.parse(questionnaire.answers) 
          : questionnaire.answers;
        if (answers.age) return answers.age;
      }
      return null;
    };

    const fields = [
      { key: 'name', label: 'Nom', value: getName() },
      { key: 'gender', label: 'Genre', value: getGender() },
      { key: 'age', label: 'Âge', value: getAge() },
      { key: 'bio', label: 'Bio', value: profile?.bio },
      { key: 'photos', label: 'Photos', value: photos.length > 0 },
      { key: 'city', label: 'Localisation', value: profile?.city },
      { key: 'questionnaire', label: 'Questionnaire', value: questionnaire?.profile_json },
    ];

    const completed = fields.filter(field => field.value).map(field => field.label);
    const missing = fields.filter(field => !field.value).map(field => field.label);
    const percentage = Math.round((completed.length / fields.length) * 100);

    return { percentage, completed, missing };
  }

  static calculateLevelProgress(xp: number, level: number): {
    currentLevelXP: number;
    neededForNext: number;
    progressPercent: number;
    nextLevel: number;
  } {
    const xpForCurrentLevel = (level - 1) * 100;
    const xpForNextLevel = level * 100;
    const currentLevelXP = xp - xpForCurrentLevel;
    const neededForNext = xpForNextLevel - xp;
    const progressPercent = Math.min((currentLevelXP / 100) * 100, 100);

    return {
      currentLevelXP,
      neededForNext,
      progressPercent,
      nextLevel: level + 1
    };
  }

  // ==================== SUGGESTIONS DE PROFIL ====================

  static async getUsersInRadius(
    centerLat: number, 
    centerLng: number, 
    radiusKm: number,
    excludeUserId: string,
    limit: number = 50
  ): Promise<any[]> {
    // Utiliser la fonction PostgreSQL pour calculer la distance
    const { data, error } = await supabase.rpc('users_within_radius', {
      center_lat: centerLat,
      center_lng: centerLng,
      radius_km: radiusKm
    });

    if (error) throw error;

    // Filtrer l'utilisateur actuel et limiter les résultats
    return (data || [])
      .filter((user: any) => user.user_id !== excludeUserId)
      .slice(0, limit);
  }

  static async getCompatibleProfiles(
    userId: string,
    preferences: RelationshipPreferences,
    userProfile: any
  ): Promise<any[]> {
    if (!userProfile.latitude || !userProfile.longitude) {
      throw new Error('Localisation requise pour trouver des profils compatibles');
    }

    // Récupérer les utilisateurs dans le rayon
    const nearbyUsers = await this.getUsersInRadius(
      userProfile.latitude,
      userProfile.longitude,
      preferences.search_radius_km,
      userId
    );

    // TODO: Ajouter des filtres basés sur les préférences (âge, genre, etc.)
    // Pour l'instant, on retourne les utilisateurs à proximité

    return nearbyUsers;
  }

  // ==================== UTILS ====================

  static getAgeFromDate(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${Math.round(distanceKm)}km`;
  }

  static getRarityInfo(authenticityScore: number): {
    name: string;
    color: string;
    textColor: string;
    emoji: string;
  } {
    if (authenticityScore >= 9) {
      return {
        name: 'Légendaire',
        color: 'from-yellow-400 to-orange-500',
        textColor: 'text-yellow-400',
        emoji: '🌟'
      };
    }
    if (authenticityScore >= 7) {
      return {
        name: 'Rare',
        color: 'from-purple-400 to-pink-500',
        textColor: 'text-purple-400',
        emoji: '💎'
      };
    }
    if (authenticityScore >= 5) {
      return {
        name: 'Peu Commune',
        color: 'from-blue-400 to-cyan-500',
        textColor: 'text-blue-400',
        emoji: '✨'
      };
    }
    return {
      name: 'Commune',
      color: 'from-gray-400 to-gray-600',
      textColor: 'text-gray-400',
      emoji: '⭐'
    };
  }

  // ==================== 🆕 SYNCHRONISATION QUESTIONNAIRE → PROFIL ====================

  /**
   * 🆕 Synchronise automatiquement les données du questionnaire vers le profil
   * Utilisé lors de la finalisation du questionnaire
   */
  static async syncQuestionnaireToProfile(
    userId: string, 
    questionnaireAnswers: any
  ): Promise<{ success: boolean; syncedFields: string[] }> {
    try {
      console.log('🔄 Synchronisation questionnaire → profil pour utilisateur:', userId);
      
      const profileUpdates: any = {};
      const syncedFields: string[] = [];
      
      // 1. Genre
      if (questionnaireAnswers.gender) {
        profileUpdates.gender = questionnaireAnswers.gender;
        syncedFields.push('genre');
        console.log('📝 Genre à synchroniser:', questionnaireAnswers.gender);
      }
      
      // 2. Âge → birth_date
      if (questionnaireAnswers.age && typeof questionnaireAnswers.age === 'number') {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - questionnaireAnswers.age;
        profileUpdates.birth_date = `${birthYear}-01-01`;
        syncedFields.push('âge');
        console.log('📅 Date de naissance calculée:', profileUpdates.birth_date);
      }
      
      // 3. Prénom → name
      if (questionnaireAnswers.firstName && questionnaireAnswers.firstName.trim()) {
        profileUpdates.name = questionnaireAnswers.firstName.trim();
        syncedFields.push('nom');
        console.log('👤 Nom à synchroniser:', profileUpdates.name);
      }
      
      // Si on a des données à synchroniser
      if (Object.keys(profileUpdates).length > 0) {
        console.log('📝 Données à synchroniser vers le profil:', profileUpdates);
        
        await this.updateProfile(userId, profileUpdates);
        
        console.log(`✅ Synchronisation réussie: ${syncedFields.join(', ')}`);
        return { success: true, syncedFields };
      } else {
        console.log('ℹ️ Aucune donnée à synchroniser');
        return { success: true, syncedFields: [] };
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation questionnaire → profil:', error);
      return { success: false, syncedFields: [] };
    }
  }

  /**
   * 🆕 Vérifie si les données du questionnaire sont plus récentes que le profil
   * Utile pour proposer une synchronisation
   */
  static shouldSyncFromQuestionnaire(profile: any, questionnaire: any): {
    shouldSync: boolean;
    reasons: string[];
    suggestedUpdates: any;
  } {
    const reasons: string[] = [];
    const suggestedUpdates: any = {};

    if (!questionnaire?.answers) {
      return { shouldSync: false, reasons: [], suggestedUpdates: {} };
    }

    const answers = typeof questionnaire.answers === 'string' 
      ? JSON.parse(questionnaire.answers) 
      : questionnaire.answers;

    // Vérifier le genre
    if (answers.gender && !profile?.gender) {
      reasons.push('Genre manquant dans le profil');
      suggestedUpdates.gender = answers.gender;
    }

    // Vérifier l'âge/date de naissance
    if (answers.age && !profile?.birth_date) {
      reasons.push('Date de naissance manquante dans le profil');
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - answers.age;
      suggestedUpdates.birth_date = `${birthYear}-01-01`;
    }

    // Vérifier le nom
    if (answers.firstName && !profile?.name) {
      reasons.push('Nom manquant dans le profil');
      suggestedUpdates.name = answers.firstName;
    }

    return {
      shouldSync: reasons.length > 0,
      reasons,
      suggestedUpdates
    };
  }
}

export default ProfileExtendedService;