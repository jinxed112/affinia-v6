// backend/src/modules/profile/profile.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { profileService } from './profile.service';
import { validationResult } from 'express-validator';

class ProfileController {
  /**
   * ✅ CORRIGÉ - Récupère le profil de l'utilisateur connecté
   */
  async getMyProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await profileService.getProfile(userId, req.userToken!);

      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      console.error('Get my profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère un profil par ID
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requesterId = req.user!.id;

      // Vérifier si l'utilisateur peut voir ce profil
      const canView = await profileService.canViewProfile(requesterId, userId);
      if (!canView) {
        res.status(403).json({ error: 'Cannot view this profile' });
        return;
      }

      const profile = await profileService.getProfile(userId, req.userToken!);

      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Filtrer les infos sensibles si ce n'est pas son propre profil
      const publicProfile = requesterId === userId
        ? profile
        : profileService.getPublicProfile(profile);

      res.json(publicProfile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  /**
   * ✅ CORRIGÉ - Met à jour le profil de l'utilisateur connecté
   */
  async updateMyProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.id;
      const updates = req.body;

      const updatedProfile = await profileService.updateProfile(userId, updates, req.userToken!);

      res.json(updatedProfile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère les données pour la carte Affinia
   */
  async getProfileCard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requesterId = req.user!.id;

      // Vérifier les permissions
      const canView = await profileService.canViewProfile(requesterId, userId);
      if (!canView) {
        res.status(403).json({ error: 'Cannot view this profile card' });
        return;
      }

      const cardData = await profileService.getProfileCardData(userId, req.userToken!);

      if (!cardData) {
        res.status(404).json({ error: 'Profile card not found' });
        return;
      }

      res.json(cardData);
    } catch (error) {
      console.error('Get profile card error:', error);
      res.status(500).json({ error: 'Failed to get profile card' });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère les statistiques du profil
   */
  async getProfileStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requesterId = req.user!.id;

      // Seul l'utilisateur peut voir ses propres stats détaillées
      if (requesterId !== userId) {
        res.status(403).json({ error: 'Cannot view these stats' });
        return;
      }

      const stats = await profileService.getProfileStats(userId, req.userToken!);

      res.json(stats);
    } catch (error) {
      console.error('Get profile stats error:', error);
      res.status(500).json({ error: 'Failed to get profile stats' });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère toutes les données nécessaires pour le dashboard
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      console.log(`[Dashboard] Récupération des données pour l'utilisateur: ${userId}`);

      const dashboardData = await profileService.getDashboardData(userId, req.userToken!);

      if (!dashboardData) {
        res.status(404).json({
          success: false,
          error: 'Dashboard data not found'
        });
        return;
      }

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('[Dashboard] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - Version alternative qui permet de récupérer le dashboard d'un autre utilisateur
   */
  async getUserDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requesterId = req.user!.id;

      // Vérifier les permissions
      const canView = await profileService.canViewProfile(requesterId, userId);
      if (!canView) {
        res.status(403).json({
          success: false,
          error: 'Cannot view this user dashboard'
        });
        return;
      }

      const dashboardData = await profileService.getDashboardData(userId, req.userToken!);

      if (!dashboardData) {
        res.status(404).json({
          success: false,
          error: 'User dashboard not found'
        });
        return;
      }

      // Filtrer les données sensibles si ce n'est pas l'utilisateur lui-même
      if (requesterId !== userId) {
        // Masquer les infos sensibles
        dashboardData.profile.credits = 0; // Cacher les crédits
        dashboardData.features = {
          hasStarterCard: false,
          hasMirror: !!dashboardData.cardData, // Juste indiquer s'il a une carte
          mysteryCardsAvailable: 0,
          nextCardAvailable: null
        };
      }

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('[UserDashboard] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user dashboard data'
      });
    }
  }

  /**
   * Upload un avatar (placeholder)
   */
  async uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // TODO: Implémenter l'upload réel avec Supabase Storage
      // Pour l'instant, on simule

      res.json({
        message: 'Avatar upload endpoint - to be implemented',
        userId
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
}

export const profileController = new ProfileController();