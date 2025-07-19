// src/services/profileService.ts

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
  private async getAuthHeaders(): Promise<Record<string, string>> {
    // ✅ RÉCUPÉRER LE TOKEN DEPUIS LE LOCALSTORAGE DIRECTEMENT
    console.log('🔑 profileService: Récupération du token...');
    
    // Clé de stockage Supabase (même que dans supabase.ts)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbcbeitvmtqwoifbkghy.supabase.co';
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
    
    const authData = localStorage.getItem(storageKey);
    
    if (!authData) {
      throw new Error('No authentication token found in localStorage');
    }
    
    let parsedAuth;
    try {
      parsedAuth = JSON.parse(authData);
    } catch {
      throw new Error('Invalid auth data in localStorage');
    }
    
    const accessToken = parsedAuth?.access_token;
    
    if (!accessToken) {
      throw new Error('No access token in auth data');
    }

    console.log('✅ profileService: Token récupéré depuis localStorage');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
  }

  /**
   * Récupère mon profil complet - APPEL BACKEND
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
      throw error;
    }
  }

  /**
   * Met à jour mon profil - APPEL BACKEND
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
   * Récupère ma dernière réponse questionnaire - APPEL BACKEND
   */
  async getLatestQuestionnaire(): Promise<QuestionnaireResponse | null> {
    try {
      console.log('🌐 profileService: Appel backend getLatestQuestionnaire');
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/questionnaire/latest`, {
        headers
      });

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
      throw error;
    }
  }

  /**
   * Récupère toutes mes réponses questionnaire - APPEL BACKEND
   */
  async getAllMyQuestionnaires(): Promise<QuestionnaireResponse[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/questionnaire/my-responses`, {
        headers
      });

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
   * Récupère les données pour la carte Affinia d'un utilisateur - APPEL BACKEND
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
   * Récupère les stats détaillées d'un profil - APPEL BACKEND
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