const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Quest {
  id: string;
  type: 'profile' | 'photo' | 'questionnaire' | 'social';
  title: string;
  description: string;
  xp_reward: number;
  credits_reward: number;
  icon: string;
  required_level: number;
  is_active: boolean;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  completed: boolean;
  completed_at: string | null;
  progress: Record<string, any>;
  quest?: Quest;
}

export interface QuestCompletionResult {
  success: boolean;
  xp_gained: number;
  credits_gained: number;
  level_up: boolean;
  new_level?: number;
}

class GamificationService {
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
   * 🎯 Récupère toutes les quêtes de l'utilisateur
   */
  async getUserQuests(): Promise<UserQuest[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/gamification/quests`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quests: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Get user quests error:', error);
      throw error;
    }
  }

  /**
   * 🏆 Complète une quête
   */
  async completeQuest(questType: string): Promise<QuestCompletionResult> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/gamification/complete-quest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questType })
      });

      if (!response.ok) {
        throw new Error(`Failed to complete quest: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Complete quest error:', error);
      throw error;
    }
  }

  /**
   * 📊 Récupère la progression des quêtes
   */
  async getQuestProgress(): Promise<{
    total_quests: number;
    completed_quests: number;
    completion_percentage: number;
    next_quest?: Quest;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/gamification/progress`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quest progress: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get quest progress error:', error);
      throw error;
    }
  }

  /**
   * 📈 Récupère l'historique XP
   */
  async getXpHistory(limit: number = 10): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/gamification/xp-history?limit=${limit}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch XP history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Get XP history error:', error);
      throw error;
    }
  }

  /**
   * 🎮 Valide automatiquement les quêtes après certaines actions
   */
  async validateQuestCompletion(action: 'profile_updated' | 'photo_uploaded' | 'questionnaire_completed'): Promise<void> {
    try {
      console.log(`[Gamification] Validating quest completion for action: ${action}`);
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/gamification/validate/${action}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to validate action: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data.completed_quests.length > 0) {
        console.log(`[Gamification] ${data.data.completed_quests.length} quest(s) completed!`);
        
        // Déclencher des notifications pour chaque quête complétée
        data.data.completed_quests.forEach((quest: QuestCompletionResult) => {
          window.dispatchEvent(new CustomEvent('questCompleted', { 
            detail: quest 
          }));
        });
      }
    } catch (error) {
      console.error('Validate quest completion error:', error);
      // Ne pas faire planter l'app si la validation échoue
    }
  }

  /**
   * 🎯 Méthode simple pour essayer de compléter une quête spécifique
   */
  async tryCompleteQuest(questType: string): Promise<QuestCompletionResult | null> {
    try {
      const result = await this.completeQuest(questType);
      
      if (result.success) {
        console.log(`[Gamification] Quest ${questType} completed! +${result.xp_gained} XP, +${result.credits_gained} crédits`);
        
        // Déclencher une notification
        window.dispatchEvent(new CustomEvent('questCompleted', { 
          detail: result 
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Try complete quest ${questType} error:`, error);
      return null;
    }
  }
}

export const gamificationService = new GamificationService();