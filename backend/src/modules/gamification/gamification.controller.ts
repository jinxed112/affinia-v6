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

  /**
   * POST /api/gamification/validate/:action
   * Valide automatiquement les quêtes après une action
   */
  async validateAction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { action } = req.params;

      const validActions = ['profile_updated', 'photo_uploaded', 'questionnaire_completed'];
      if (!validActions.includes(action)) {
        res.status(400).json({
          success: false,
          error: 'Invalid action type'
        });
        return;
      }

      const completedQuests = await gamificationService.validateQuests(
        userId, 
        action as 'profile_updated' | 'photo_uploaded' | 'questionnaire_completed'
      );
      
      res.json({
        success: true,
        data: {
          completed_quests: completedQuests,
          count: completedQuests.length
        }
      });
    } catch (error) {
      console.error('Validate action error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate action'
      });
    }
  }
}

export const gamificationController = new GamificationController();