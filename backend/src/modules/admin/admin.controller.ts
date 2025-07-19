import { Request, Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { adminService, QuestCreateData, QuestUpdateData } from './admin.service';
import { validationResult } from 'express-validator';

class AdminController {
  /**
   * GET /api/admin/stats
   * Récupère les statistiques générales
   */
  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await adminService.getQuestStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admin stats'
      });
    }
  }

  /**
   * GET /api/admin/quests
   * Récupère toutes les quêtes avec statistiques
   */
  async getAllQuests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const quests = await adminService.getAllQuests();
      
      res.json({
        success: true,
        data: quests
      });
    } catch (error) {
      console.error('Get all quests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quests'
      });
    }
  }

  /**
   * GET /api/admin/quests/:id
   * Récupère les détails d'une quête
   */
  async getQuestDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const questDetails = await adminService.getQuestDetailedStats(id);
      
      res.json({
        success: true,
        data: questDetails
      });
    } catch (error) {
      console.error('Get quest details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quest details'
      });
    }
  }

  /**
   * POST /api/admin/quests
   * Crée une nouvelle quête
   */
  async createQuest(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
        return;
      }

      const questData: QuestCreateData = req.body;
      const quest = await adminService.createQuest(questData);
      
      res.status(201).json({
        success: true,
        data: quest,
        message: 'Quest created successfully'
      });
    } catch (error) {
      console.error('Create quest error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create quest'
      });
    }
  }

  /**
   * PUT /api/admin/quests/:id
   * Met à jour une quête
   */
  async updateQuest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation errors',
          details: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const questData: QuestUpdateData = { ...req.body, id };
      
      const quest = await adminService.updateQuest(questData);
      
      res.json({
        success: true,
        data: quest,
        message: 'Quest updated successfully'
      });
    } catch (error) {
      console.error('Update quest error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update quest'
      });
    }
  }

  /**
   * DELETE /api/admin/quests/:id
   * Supprime (désactive) une quête
   */
  async deleteQuest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await adminService.deleteQuest(id);
      
      res.json({
        success: true,
        message: 'Quest deleted successfully'
      });
    } catch (error) {
      console.error('Delete quest error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete quest'
      });
    }
  }

  /**
   * POST /api/admin/quests/:id/sync
   * Synchronise une quête avec tous les utilisateurs
   */
  async syncQuestWithUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await adminService.syncQuestWithUsers(id);
      
      res.json({
        success: true,
        message: 'Quest synchronized with all users'
      });
    } catch (error) {
      console.error('Sync quest error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync quest'
      });
    }
  }

  /**
   * GET /api/admin/dashboard
   * Dashboard complet pour l'admin
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [stats, quests] = await Promise.all([
        adminService.getQuestStats(),
        adminService.getAllQuests()
      ]);

      // Top 5 des quêtes les plus populaires
      const topQuests = quests
        .sort((a, b) => b.stats.completion_rate - a.stats.completion_rate)
        .slice(0, 5);

      // Quêtes récemment créées
      const recentQuests = quests
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          stats,
          top_quests: topQuests,
          recent_quests: recentQuests,
          total_quests: quests.length
        }
      });
    } catch (error) {
      console.error('Get admin dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admin dashboard'
      });
    }
  }
}

export const adminController = new AdminController();