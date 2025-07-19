const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface QuestCreateData {
  type: 'profile' | 'photo' | 'questionnaire' | 'social' | 'custom';
  title: string;
  description: string;
  xp_reward: number;
  credits_reward: number;
  icon: string;
  required_level: number;
  is_active: boolean;
}

export interface QuestData extends QuestCreateData {
  id: string;
  created_at: string;
  updated_at: string;
  stats: {
    total_assigned: number;
    total_completed: number;
    completion_rate: number;
  };
}

export interface AdminStats {
  total_quests: number;
  active_quests: number;
  total_completions: number;
  completion_rate: number;
}

class AdminService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbcbeitvmtqwoifbkghy.supabase.co';
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
    
    const authData = localStorage.getItem(storageKey);
    if (!authData) throw new Error('No authentication token found');
    
    const parsedAuth = JSON.parse(authData);
    const accessToken = parsedAuth?.access_token;
    if (!accessToken) throw new Error('No access token found');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
  }

  /**
   * 📊 Récupère le dashboard admin
   */
  async getDashboard(): Promise<{
    stats: AdminStats;
    top_quests: QuestData[];
    recent_quests: QuestData[];
    total_quests: number;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get dashboard error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Récupère toutes les quêtes
   */
  async getAllQuests(): Promise<QuestData[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/quests`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quests: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get all quests error:', error);
      throw error;
    }
  }

  /**
   * 📈 Récupère les détails d'une quête
   */
  async getQuestDetails(questId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/quests/${questId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quest details: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get quest details error:', error);
      throw error;
    }
  }

  /**
   * ➕ Crée une nouvelle quête
   */
  async createQuest(questData: QuestCreateData): Promise<QuestData> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/quests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(questData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to create quest: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Create quest error:', error);
      throw error;
    }
  }

  /**
   * ✏️ Met à jour une quête
   */
  async updateQuest(questId: string, questData: Partial<QuestCreateData>): Promise<QuestData> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/quests/${questId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(questData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to update quest: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Update quest error:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Supprime une quête
   */
  async deleteQuest(questId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/quests/${questId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete quest: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Delete quest error:', error);
      throw error;
    }
  }

  /**
   * 🔄 Synchronise une quête avec tous les utilisateurs
   */
  async syncQuestWithUsers(questId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/quests/${questId}/sync`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to sync quest: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Sync quest error:', error);
      throw error;
    }
  }

  /**
   * 🔍 Vérifie si l'utilisateur actuel est admin
   */
  async checkAdminStatus(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const adminService = new AdminService();