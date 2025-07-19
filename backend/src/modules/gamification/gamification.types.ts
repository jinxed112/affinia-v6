// ===============================
// backend/src/modules/gamification/gamification.types.ts
// ===============================

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
  quest?: Quest; // Joined data
}

export interface XpEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_source_id: string | null;
  xp_gained: number;
  credits_gained: number;
  description: string | null;
  created_at: string;
}

export interface QuestProgress {
  total_quests: number;
  completed_quests: number;
  completion_percentage: number;
  next_quest?: Quest;
}

// ===============================
// backend/src/modules/gamification/gamification.service.ts
// ===============================

import { supabaseAdmin } from '../../config/database';
import type { Quest, UserQuest, XpEvent, QuestProgress } from './gamification.types';

class GamificationService {
  /**
   * 🎯 Récupère toutes les quêtes disponibles pour un utilisateur
   */
  async getUserQuests(userId: string): Promise<UserQuest[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_quests')
        .select(`
          *,
          quest:quests(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user quests error:', error);
      throw error;
    }
  }

  /**
   * 🏆 Complète une quête pour un utilisateur
   */
  async completeQuest(userId: string, questType: string): Promise<{
    success: boolean;
    xp_gained: number;
    credits_gained: number;
    level_up: boolean;
    new_level?: number;
  }> {
    try {
      console.log(`[Gamification] Completing quest ${questType} for user ${userId}`);

      // 1. Récupérer la quête par type
      const { data: quest, error: questError } = await supabaseAdmin
        .from('quests')
        .select('*')
        .eq('type', questType)
        .eq('is_active', true)
        .single();

      if (questError || !quest) {
        console.error('Quest not found:', questType);
        return { success: false, xp_gained: 0, credits_gained: 0, level_up: false };
      }

      // 2. Vérifier si déjà complétée
      const { data: userQuest } = await supabaseAdmin
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', quest.id)
        .single();

      if (userQuest?.completed) {
        console.log('Quest already completed');
        return { success: false, xp_gained: 0, credits_gained: 0, level_up: false };
      }

      // 3. Récupérer le profil actuel
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('xp, level, credits')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      const oldLevel = profile.level;
      const newXp = profile.xp + quest.xp_reward;
      const newCredits = profile.credits + quest.credits_reward;
      const newLevel = this.calculateLevel(newXp);

      // 4. Transaction pour tout mettre à jour
      const { error: updateError } = await supabaseAdmin.rpc('complete_quest_transaction', {
        p_user_id: userId,
        p_quest_id: quest.id,
        p_new_xp: newXp,
        p_new_credits: newCredits,
        p_new_level: newLevel,
        p_xp_gained: quest.xp_reward,
        p_credits_gained: quest.credits_reward,
        p_event_description: `Quête complétée: ${quest.title}`
      });

      if (updateError) {
        console.error('Complete quest transaction error:', updateError);
        throw updateError;
      }

      console.log(`[Gamification] Quest completed! XP: +${quest.xp_reward}, Credits: +${quest.credits_reward}`);

      return {
        success: true,
        xp_gained: quest.xp_reward,
        credits_gained: quest.credits_reward,
        level_up: newLevel > oldLevel,
        new_level: newLevel > oldLevel ? newLevel : undefined
      };

    } catch (error) {
      console.error('Complete quest error:', error);
      throw error;
    }
  }

  /**
   * 📊 Récupère les statistiques de progression d'un utilisateur
   */
  async getQuestProgress(userId: string): Promise<QuestProgress> {
    try {
      const userQuests = await this.getUserQuests(userId);
      const totalQuests = userQuests.length;
      const completedQuests = userQuests.filter(q => q.completed).length;
      const completionPercentage = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

      // Trouver la prochaine quête à faire
      const nextQuest = userQuests.find(q => !q.completed)?.quest;

      return {
        total_quests: totalQuests,
        completed_quests: completedQuests,
        completion_percentage: Math.round(completionPercentage),
        next_quest: nextQuest
      };
    } catch (error) {
      console.error('Get quest progress error:', error);
      throw error;
    }
  }

  /**
   * 🎮 Valide automatiquement les quêtes en fonction des actions utilisateur
   */
  async validateQuests(userId: string, action: 'profile_updated' | 'photo_uploaded' | 'questionnaire_completed'): Promise<any[]> {
    const completedQuests = [];

    try {
      switch (action) {
        case 'profile_updated':
          // Vérifier si le profil est maintenant complet
          const profileComplete = await this.isProfileComplete(userId);
          if (profileComplete) {
            const result = await this.completeQuest(userId, 'profile');
            if (result.success) completedQuests.push(result);
          }
          break;

        case 'photo_uploaded':
          const result = await this.completeQuest(userId, 'photo');
          if (result.success) completedQuests.push(result);
          break;

        case 'questionnaire_completed':
          const questionnaireResult = await this.completeQuest(userId, 'questionnaire');
          if (questionnaireResult.success) completedQuests.push(questionnaireResult);
          break;
      }

      return completedQuests;
    } catch (error) {
      console.error('Validate quests error:', error);
      return [];
    }
  }

  /**
   * 📈 Récupère l'historique XP d'un utilisateur
   */
  async getXpHistory(userId: string, limit: number = 10): Promise<XpEvent[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get XP history error:', error);
      throw error;
    }
  }

  /**
   * 🎯 Vérifie si le profil est complet
   */
  private async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name, bio')
        .eq('id', userId)
        .single();

      // Considérer comme complet si nom ET bio sont remplis
      return !!(profile?.name && profile?.bio);
    } catch (error) {
      return false;
    }
  }

  /**
   * 📊 Calcule le niveau à partir de l'XP
   */
  private calculateLevel(xp: number): number {
    // Formule: niveau = floor(sqrt(xp / 100)) + 1
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  }

  /**
   * 🎯 Calcule l'XP nécessaire pour le niveau suivant
   */
  calculateXpForNextLevel(currentLevel: number): number {
    return (currentLevel * currentLevel) * 100;
  }

  /**
   * 🆕 Crée les quêtes de base pour un nouvel utilisateur
   */
  async createBaseQuestsForUser(userId: string): Promise<void> {
    try {
      // Les quêtes sont créées automatiquement via trigger SQL
      // Cette méthode peut servir pour des quêtes spéciales
      console.log(`[Gamification] Base quests created for user ${userId}`);
    } catch (error) {
      console.error('Create base quests error:', error);
    }
  }
}

// ===============================
// backend/src/modules/gamification/gamification.controller.ts
// ===============================

import { Request, Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { gamificationService } from './gamification.service';

class GamificationController {
  /**
   * GET /api/gamification/quests
   * Récupère toutes les quêtes d'un utilisateur
   */
  async getUserQuests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const quests = await gamificationService.getUserQuests(userId);
      
      res.json({
        success: true,
        data: quests
      });
    } catch (error) {
      console.error('Get user quests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user quests'
      });
    }
  }

  /**
   * POST /api/gamification/complete-quest
   * Complète une quête manuellement
   */
  async completeQuest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { questType } = req.body;

      if (!questType) {
        res.status(400).json({
          success: false,
          error: 'Quest type is required'
        });
        return;
      }

      const result = await gamificationService.completeQuest(userId, questType);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Complete quest error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete quest'
      });
    }
  }

  /**
   * GET /api/gamification/progress
   * Récupère la progression des quêtes
   */
  async getQuestProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const progress = await gamificationService.getQuestProgress(userId);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Get quest progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quest progress'
      });
    }
  }

  /**
   * GET /api/gamification/xp-history
   * Récupère l'historique XP
   */
  async getXpHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const history = await gamificationService.getXpHistory(userId, limit);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Get XP history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get XP history'
      });
    }
  }
}

// ===============================
// backend/src/modules/gamification/gamification.routes.ts
// ===============================

import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import { gamificationController } from './gamification.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes des quêtes
router.get('/quests', gamificationController.getUserQuests.bind(gamificationController));
router.post('/complete-quest', gamificationController.completeQuest.bind(gamificationController));
router.get('/progress', gamificationController.getQuestProgress.bind(gamificationController));
router.get('/xp-history', gamificationController.getXpHistory.bind(gamificationController));

export { router as gamificationRoutes };

// ===============================
// backend/src/modules/gamification/index.ts
// ===============================

export { gamificationService } from './gamification.service';
export { gamificationController } from './gamification.controller';
export { gamificationRoutes } from './gamification.routes';
export * from './gamification.types';

// ===============================
// FUNCTION SQL À AJOUTER DANS SUPABASE
// ===============================

/*
-- Fonction de transaction pour compléter une quête
CREATE OR REPLACE FUNCTION complete_quest_transaction(
    p_user_id UUID,
    p_quest_id UUID,
    p_new_xp INTEGER,
    p_new_credits INTEGER,
    p_new_level INTEGER,
    p_xp_gained INTEGER,
    p_credits_gained INTEGER,
    p_event_description TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 1. Marquer la quête comme complétée
    UPDATE user_quests 
    SET 
        completed = true,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id AND quest_id = p_quest_id;
    
    -- 2. Mettre à jour le profil utilisateur
    UPDATE profiles 
    SET 
        xp = p_new_xp,
        credits = p_new_credits,
        level = p_new_level,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- 3. Enregistrer l'événement XP
    INSERT INTO xp_events (
        user_id, 
        event_type, 
        event_source_id, 
        xp_gained, 
        credits_gained, 
        description
    ) VALUES (
        p_user_id,
        'quest_completed',
        p_quest_id,
        p_xp_gained,
        p_credits_gained,
        p_event_description
    );
END;
$$ LANGUAGE plpgsql;
*/