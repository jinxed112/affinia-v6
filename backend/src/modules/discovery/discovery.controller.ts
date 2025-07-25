// =============================================
// CONTRÔLEUR BACKEND - Découverte et Miroir Privé - CORRIGÉ
// =============================================

import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { discoveryService } from './discovery.service';
import { validationResult } from 'express-validator';

// Import manquant pour les types
interface DiscoveryFilters {
  gender?: 'male' | 'female' | 'other' | 'all';
  min_age?: number;
  max_age?: number;
  max_distance_km?: number;
  mirror_visibility?: ('public' | 'on_request' | 'private')[];
  has_photos?: boolean;
  has_questionnaire?: boolean;
  sort_by?: 'distance' | 'age' | 'newest' | 'random';
  limit?: number;
  offset?: number;
}

class DiscoveryController {
  
  /**
   * GET /api/discovery - Récupérer les profils pour la découverte
   */
  async getDiscoveryProfiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      // Récupérer et valider les filtres depuis les query params
      const filters: DiscoveryFilters = {
        gender: req.query.gender as any,
        min_age: req.query.min_age ? parseInt(req.query.min_age as string) : undefined,
        max_age: req.query.max_age ? parseInt(req.query.max_age as string) : undefined,
        max_distance_km: req.query.max_distance_km ? parseInt(req.query.max_distance_km as string) : undefined,
        mirror_visibility: req.query.mirror_visibility ? 
          (req.query.mirror_visibility as string).split(',') as any : undefined,
        has_photos: req.query.has_photos === 'true',
        has_questionnaire: req.query.has_questionnaire === 'true',
        sort_by: req.query.sort_by as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      console.log('🔍 Discovery Controller - Filtres reçus:', filters);

      const result = await discoveryService.getDiscoveryProfiles(userId, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Discovery Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch discovery profiles',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/discovery/mirror-request - Demander l'accès au miroir
   */
  async requestMirrorAccess(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const senderId = req.user!.id;
      const { receiver_id } = req.body;

      console.log('🔐 Mirror Request Controller - De:', senderId, 'vers:', receiver_id);

      // Vérifier qu'on ne demande pas l'accès à son propre miroir
      if (senderId === receiver_id) {
        res.status(400).json({
          success: false,
          error: 'Cannot request access to your own mirror'
        });
        return;
      }

      // VRAIE IMPLÉMENTATION - Insertion en base
      const result = await discoveryService.requestMirrorAccess(senderId, receiver_id);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.request
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }

    } catch (error) {
      console.error('❌ Mirror Request Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to request mirror access',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/discovery/mirror-request/:requestId - Répondre à une demande
   */
  async respondToMirrorRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.id;
      const { requestId } = req.params;
      const { response } = req.body;

      console.log('📝 Mirror Response Controller - Request:', requestId, 'Response:', response);

      // VRAIE IMPLÉMENTATION - Mise à jour en base
      const result = await discoveryService.respondToMirrorRequest(requestId, userId, response);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.request
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }

    } catch (error) {
      console.error('❌ Mirror Response Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to respond to mirror request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/discovery/mirror-requests/received - Mes demandes reçues
   */
  async getReceivedMirrorRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // VRAIE IMPLÉMENTATION - Récupération depuis la base
      const requests = await discoveryService.getReceivedMirrorRequests(userId);

      res.json({
        success: true,
        data: requests
      });

    } catch (error) {
      console.error('❌ Get Received Requests Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch received requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/discovery/mirror-requests/sent - Mes demandes envoyées
   */
  async getSentMirrorRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // VRAIE IMPLÉMENTATION - Récupération depuis la base
      const requests = await discoveryService.getSentMirrorRequests(userId);

      res.json({
        success: true,
        data: requests
      });

    } catch (error) {
      console.error('❌ Get Sent Requests Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sent requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/discovery/mirror/:profileId/can-view - Vérifier l'accès au miroir
   */
  async canViewMirror(req: AuthRequest, res: Response): Promise<void> {
    try {
      const viewerId = req.user!.id;
      const { profileId } = req.params;

      // VRAIE IMPLÉMENTATION - Vérification des permissions
      const canView = await discoveryService.canViewMirror(viewerId, profileId);

      res.json({
        success: true,
        data: {
          can_view: canView
        }
      });

    } catch (error) {
      console.error('❌ Can View Mirror Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check mirror access',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/discovery/mirror/:profileId/read - Enregistrer la lecture d'un miroir
   */
  async recordMirrorRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const viewerId = req.user!.id;
      const { profileId } = req.params;

      console.log('📖 Mirror Read Controller - Viewer:', viewerId, 'Profile:', profileId);

      // VRAIE IMPLÉMENTATION - Enregistrement de la lecture
      await discoveryService.recordMirrorRead(viewerId, profileId);

      res.json({
        success: true,
        message: 'Mirror read recorded'
      });

    } catch (error) {
      console.error('❌ Record Mirror Read Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record mirror read',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/discovery/notifications/stats - Statistiques de notifications
   */
  async getNotificationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // VRAIE IMPLÉMENTATION - Calcul des stats depuis la base
      const stats = await discoveryService.getNotificationStats(userId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Notification Stats Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/discovery/notifications - Récupérer les notifications
   */
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // VRAIE IMPLÉMENTATION - Récupération depuis la base
      const notifications = await discoveryService.getNotifications(userId, limit, offset);

      res.json({
        success: true,
        data: notifications
      });

    } catch (error) {
      console.error('❌ Get Notifications Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/discovery/notifications/:id/read - Marquer comme lu
   */
  async markNotificationAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      console.log('✅ Mark Notification Read Controller - User:', userId, 'Notification:', id);

      // VRAIE IMPLÉMENTATION - Mise à jour en base
      await discoveryService.markNotificationAsRead(userId, id);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('❌ Mark Notification Read Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/discovery/notifications/read-all - Marquer toutes comme lues
   */
  async markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      console.log('✅ Mark All Notifications Read Controller - User:', userId);

      // VRAIE IMPLÉMENTATION - Mise à jour en base
      await discoveryService.markAllNotificationsAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });

    } catch (error) {
      console.error('❌ Mark All Notifications Read Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/discovery/profile/:id - Récupérer un profil spécifique pour la découverte
   */
  async getDiscoveryProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      console.log('👤 Get Discovery Profile Controller - User:', userId, 'Profile:', id);

      // VRAIE IMPLÉMENTATION - Récupération depuis la base
      const profile = await discoveryService.getDiscoveryProfile(userId, id);

      res.json({
        success: true,
        data: profile
      });

    } catch (error) {
      console.error('❌ Get Discovery Profile Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch discovery profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const discoveryController = new DiscoveryController();