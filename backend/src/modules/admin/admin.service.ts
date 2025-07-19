import { supabaseAdmin } from '../../config/database';

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

export interface QuestUpdateData extends Partial<QuestCreateData> {
  id: string;
}

export interface QuestStats {
  total_quests: number;
  active_quests: number;
  total_completions: number;
  completion_rate: number;
}

class AdminService {
  /**
   * 📊 Récupère les statistiques générales des quêtes
   */
  async getQuestStats(): Promise<QuestStats> {
    try {
      // Compter les quêtes totales et actives
      const { data: questCounts } = await supabaseAdmin
        .from('quests')
        .select('is_active');

      const totalQuests = questCounts?.length || 0;
      const activeQuests = questCounts?.filter(q => q.is_active).length || 0;

      // Compter les completions totales
      const { count: totalCompletions } = await supabaseAdmin
        .from('user_quests')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      // Calculer le taux de completion
      const { count: totalUserQuests } = await supabaseAdmin
        .from('user_quests')
        .select('*', { count: 'exact', head: true });

      const completionRate = totalUserQuests > 0 
        ? ((totalCompletions || 0) / totalUserQuests) * 100 
        : 0;

      return {
        total_quests: totalQuests,
        active_quests: activeQuests,
        total_completions: totalCompletions || 0,
        completion_rate: Math.round(completionRate)
      };
    } catch (error) {
      console.error('Get quest stats error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Récupère toutes les quêtes avec leurs statistiques
   */
  async getAllQuests(): Promise<any[]> {
    try {
      const { data: quests, error } = await supabaseAdmin
        .from('quests')
        .select(`
          *,
          user_quests(
            id,
            completed,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ajouter les statistiques à chaque quête
      const questsWithStats = quests?.map(quest => {
        const userQuests = quest.user_quests || [];
        const totalAssigned = userQuests.length;
        const totalCompleted = userQuests.filter((uq: any) => uq.completed).length;
        const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

        return {
          ...quest,
          stats: {
            total_assigned: totalAssigned,
            total_completed: totalCompleted,
            completion_rate: Math.round(completionRate)
          }
        };
      });

      return questsWithStats || [];
    } catch (error) {
      console.error('Get all quests error:', error);
      throw error;
    }
  }

  /**
   * ➕ Crée une nouvelle quête
   */
  async createQuest(questData: QuestCreateData): Promise<any> {
    try {
      const { data: quest, error } = await supabaseAdmin
        .from('quests')
        .insert([questData])
        .select()
        .single();

      if (error) throw error;

      // Si la quête est active, l'assigner à tous les utilisateurs
      if (questData.is_active) {
        await this.assignQuestToAllUsers(quest.id);
      }

      return quest;
    } catch (error) {
      console.error('Create quest error:', error);
      throw error;
    }
  }

  /**
   * ✏️ Met à jour une quête existante
   */
  async updateQuest(questData: QuestUpdateData): Promise<any> {
    try {
      const { id, ...updateData } = questData;

      const { data: quest, error } = await supabaseAdmin
        .from('quests')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Si on active la quête, l'assigner à tous les utilisateurs
      if (updateData.is_active) {
        await this.assignQuestToAllUsers(id);
      }

      return quest;
    } catch (error) {
      console.error('Update quest error:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Supprime une quête (soft delete en désactivant)
   */
  async deleteQuest(questId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('quests')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', questId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete quest error:', error);
      throw error;
    }
  }

  /**
   * 👥 Assigne une quête à tous les utilisateurs
   */
  async assignQuestToAllUsers(questId: string): Promise<void> {
    try {
      // Récupérer tous les utilisateurs
      const { data: users } = await supabaseAdmin
        .from('profiles')
        .select('id');

      if (!users) return;

      // Créer les user_quests pour tous les utilisateurs
      const userQuests = users.map(user => ({
        user_id: user.id,
        quest_id: questId,
        completed: false,
        progress: {}
      }));

      const { error } = await supabaseAdmin
        .from('user_quests')
        .upsert(userQuests, { 
          onConflict: 'user_id,quest_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Assign quest to all users error:', error);
      throw error;
    }
  }

  /**
   * 🔄 Synchronise une quête existante avec tous les utilisateurs
   */
  async syncQuestWithUsers(questId: string): Promise<void> {
    try {
      await this.assignQuestToAllUsers(questId);
    } catch (error) {
      console.error('Sync quest with users error:', error);
      throw error;
    }
  }

  /**
   * 📈 Récupère les statistiques détaillées d'une quête
   */
  async getQuestDetailedStats(questId: string): Promise<any> {
    try {
      const { data: quest, error } = await supabaseAdmin
        .from('quests')
        .select(`
          *,
          user_quests(
            id,
            completed,
            completed_at,
            created_at,
            user:profiles(name, email)
          )
        `)
        .eq('id', questId)
        .single();

      if (error) throw error;

      const userQuests = quest.user_quests || [];
      const completedQuests = userQuests.filter((uq: any) => uq.completed);
      const pendingQuests = userQuests.filter((uq: any) => !uq.completed);

      // Statistiques par jour (derniers 7 jours)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const completionsByDay = last7Days.map(day => {
        const count = completedQuests.filter((uq: any) => 
          uq.completed_at?.startsWith(day)
        ).length;
        return { date: day, completions: count };
      });

      return {
        quest,
        stats: {
          total_assigned: userQuests.length,
          total_completed: completedQuests.length,
          total_pending: pendingQuests.length,
          completion_rate: userQuests.length > 0 
            ? (completedQuests.length / userQuests.length) * 100 
            : 0,
          completions_by_day: completionsByDay,
          recent_completions: completedQuests
            .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
            .slice(0, 10)
        }
      };
    } catch (error) {
      console.error('Get quest detailed stats error:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();