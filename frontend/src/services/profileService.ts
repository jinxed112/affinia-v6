// src/services/profileService.ts

import { supabase } from '../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  xp: number;
  credits: number;
  level: number;
  created_at: string;
  updated_at?: string;
  bio?: string | null;
  birth_date?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  max_distance?: number | null;
  role?: string;
  mirror_visibility?: string;
  
  // 🆕 Nouveau champ gender
  gender?: string | null;
  
  // 🆕 Nouveaux champs de préférences
  relationship_type?: string[] | null;
  interested_in_genders?: string[] | null;
  min_age?: number | null;
  max_age?: number | null;
  show_me_on_affinia?: boolean | null;
}

export interface QuestionnaireResponse {
  id: string;
  user_id: string;
  answers: {
    firstName: string;
    age: number;
    location?: string;
    energy: string;
    communication: string;
    conflict: string;
    values: string[];
    interests: string[];
    dealBreakers: string[];
    lifestyle: string;
    relationshipGoal: string;
    relationship_learning?: string;
    ideal_partner?: string;
    free_expression?: string;
  };
  generated_prompt: string;
  generated_profile: string;
  profile_json: {
    authenticity_score: number;
    attachment_style: string;
    strength_signals: string[];
    weakness_signals: string[];
    unconscious_patterns: string[];
    ideal_partner_traits: string[];
    reliability_score: number;
    affective_indicators: {
      emotion_expression: string;
      defense_mechanisms: string[];
    };
    cognitive_signals: {
      language_level: string;
      thinking_style: string;
      complexity: string;
    };
  };
  completed_at: string;
  created_at: string;
}

class ProfileService {
  
  /**
   * 🚨 NOUVEAU - Gestion automatique des tokens expirés
   */
  private async handleExpiredToken(): Promise<never> {
    console.log('🔄 Token expiré détecté, nettoyage session...')
    
    // Nettoyer localStorage
    localStorage.clear()
    
    // Déconnexion Supabase
    await supabase.auth.signOut()
    
    // Redirection vers login
    window.location.href = '/login'
    
    // Jeter une erreur pour arrêter l'exécution
    throw new Error('Session expired - redirecting to login')
  }

  /**
   * 🔧 AMÉLIORÉ - Récupération token avec gestion d'expiration
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      console.log('🔑 profileService: Récupération du token...');
      
      // ✅ MÉTHODE PLUS ROBUSTE - Utiliser Supabase directement
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Erreur récupération session Supabase:', error)
        await this.handleExpiredToken()
      }
      
      if (!session) {
        console.log('❌ Aucune session active')
        await this.handleExpiredToken()
      }
      
      const accessToken = session!.access_token
      
      if (!accessToken) {
        console.log('❌ Aucun access token dans la session')
        await this.handleExpiredToken()
      }

      console.log('✅ profileService: Token récupéré depuis Supabase');

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };
      
    } catch (error) {
      console.error('💥 Erreur dans getAuthHeaders:', error)
      await this.handleExpiredToken()
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Gestion universelle des erreurs API
   */
  private async handleApiResponse(response: Response): Promise<Response> {
    // Gestion spécifique 401 - Token expiré/invalide
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}))
      console.error('🚨 Erreur 401 détectée:', errorData)
      
      // Vérifier si c'est vraiment un problème de token
      if (errorData.error?.includes('Invalid') || errorData.error?.includes('expired')) {
        console.log('🔄 Token invalide confirmé, déconnexion automatique')
        await this.handleExpiredToken()
      }
    }
    
    return response
  }

  /**
   * 🔧 AMÉLIORÉ - Récupère mon profil avec gestion d'erreur robuste
   */
  async getMyProfile(): Promise<Profile> {
    try {
      console.log('🌐 profileService: Appel backend getMyProfile');
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
        headers
      });

      console.log('📡 profileService: Réponse backend profil', { 
        status: response.status, 
        ok: response.ok,
        url: response.url 
      });

      // ✅ NOUVEAU - Gérer les erreurs d'auth avant tout
      await this.handleApiResponse(response)

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ profileService: Erreur backend profil:', { 
          status: response.status, 
          text: errorText 
        });
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ profileService: Profil récupéré depuis backend:', data);
      return data;
    } catch (error) {
      console.error('💥 profileService: Erreur dans getMyProfile:', error);
      
      // Ne pas re-throw si c'est une redirection de token expiré
      if (error.message === 'Session expired - redirecting to login') {
        return Promise.reject(error) // Permettre la gestion par le composant
      }
      
      throw error;
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Met à jour mon profil avec gestion d'erreur
   */
  async updateMyProfile(updates: Partial<Profile>): Promise<Profile> {
    try {
      console.log('🌐 profileService: Appel backend updateMyProfile');
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      // ✅ NOUVEAU - Gérer les erreurs d'auth
      await this.handleApiResponse(response)

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ profileService: Profil mis à jour depuis backend');
      return data;
    } catch (error) {
      console.error('💥 profileService: Erreur dans updateMyProfile:', error);
      throw error;
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Récupère ma dernière réponse questionnaire avec gestion d'erreur
   */
  async getLatestQuestionnaire(): Promise<QuestionnaireResponse | null> {
    try {
      console.log('🌐 profileService: Appel backend getLatestQuestionnaire');
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/questionnaire/latest`, {
        headers
      });

      // ✅ NOUVEAU - Gérer les erreurs d'auth avant les autres
      await this.handleApiResponse(response)

      if (response.status === 404) {
        console.log('ℹ️ profileService: Aucun questionnaire trouvé');
        return null; // Pas de questionnaire trouvé
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch questionnaire: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ profileService: Questionnaire récupéré depuis backend');
      return data;
    } catch (error) {
      console.error('💥 profileService: Erreur dans getLatestQuestionnaire:', error);
      
      // Ne pas re-throw si c'est une redirection de token expiré
      if (error.message === 'Session expired - redirecting to login') {
        return Promise.reject(error)
      }
      
      throw error;
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Récupère toutes mes réponses questionnaire avec gestion d'erreur
   */
  async getAllMyQuestionnaires(): Promise<QuestionnaireResponse[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/questionnaire/my-responses`, {
        headers
      });

      await this.handleApiResponse(response)

      if (!response.ok) {
        throw new Error(`Failed to fetch questionnaires: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      throw error;
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Récupère les données pour la carte Affinia avec gestion d'erreur
   */
  async getAffiniaCardData(userId: string): Promise<{
    profile: Profile;
    questionnaire: QuestionnaireResponse | null;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/profiles/${userId}/card`, {
        headers
      });

      await this.handleApiResponse(response)

      if (!response.ok) {
        throw new Error(`Failed to fetch card data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching card data:', error);
      throw error;
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Récupère les stats détaillées avec gestion d'erreur
   */
  async getProfileStats(userId: string): Promise<{
    xp: number;
    level: number;
    credits: number;
    questionnaires_completed: number;
    matches_count: number;
    profile_views: number;
    join_date: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/profiles/${userId}/stats`, {
        headers
      });

      await this.handleApiResponse(response)

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Upload d'avatar (pour plus tard avec Supabase Storage)
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      // TODO: Implémenter l'upload vers Supabase Storage
      console.log('TODO: Upload avatar', file.name);
      
      // Simuler un upload
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('https://via.placeholder.com/150');
        }, 1000);
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();