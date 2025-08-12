// backend/src/modules/discovery/discovery.controller.ts
// =============================================
// CONTRÔLEUR BACKEND - Découverte et Miroir Privé - CORRIGÉ RLS + CONTACT REQUESTS
// =============================================

import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { discoveryService } from './discovery.service';
import { contactService } from './contact.service';
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
   * ✅ CORRIGÉ - GET /api/discovery - Récupérer les profils pour la découverte
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

      const result = await discoveryService.getDiscoveryProfiles(userId, req.userToken!, filters);

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
   * ✅ CORRIGÉ - POST /api/discovery/mirror-request - Demander l'accès au miroir
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

      // ✅ CORRIGÉ - Insertion en base avec RLS
      const result = await discoveryService.requestMirrorAccess(senderId, receiver_id, req.userToken!);

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
   * ✅ CORRIGÉ - PUT /api/discovery/mirror-request/:requestId - Répondre à une demande
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

      // ✅ CORRIGÉ - Mise à jour en base avec RLS
      const result = await discoveryService.respondToMirrorRequest(requestId, userId, response, req.userToken!);

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
   * ✅ CORRIGÉ - GET /api/discovery/mirror-requests/received - Mes demandes reçues
   */
  async getReceivedMirrorRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // ✅ CORRIGÉ - Récupération depuis la base avec RLS
      const requests = await discoveryService.getReceivedMirrorRequests(userId, req.userToken!);

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
   * ✅ CORRIGÉ - GET /api/discovery/mirror-requests/sent - Mes demandes envoyées
   */
  async getSentMirrorRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // ✅ CORRIGÉ - Récupération depuis la base avec RLS
      const requests = await discoveryService.getSentMirrorRequests(userId, req.userToken!);

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
   * ✅ CORRIGÉ - GET /api/discovery/mirror/:profileId/can-view - Vérifier l'accès au miroir
   */
  async canViewMirror(req: AuthRequest, res: Response): Promise<void> {
    try {
      const viewerId = req.user!.id;
      const { profileId } = req.params;

      // ✅ CORRIGÉ - Vérification des permissions avec RLS
      const canView = await discoveryService.canViewMirror(viewerId, profileId, req.userToken!);

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
   * ✅ CORRIGÉ - POST /api/discovery/mirror/:profileId/read - Enregistrer la lecture d'un miroir
   */
  async recordMirrorRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const viewerId = req.user!.id;
      const { profileId } = req.params;

      console.log('📖 Mirror Read Controller - Viewer:', viewerId, 'Profile:', profileId);

      // ✅ CORRIGÉ - Enregistrement de la lecture avec RLS
      await discoveryService.recordMirrorRead(viewerId, profileId, req.userToken!);

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
   * ✅ CORRIGÉ - GET /api/discovery/notifications/stats - Statistiques de notifications
   */
  async getNotificationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // ✅ CORRIGÉ - Calcul des stats depuis la base avec RLS
      const stats = await discoveryService.getNotificationStats(userId, req.userToken!);

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
   * ✅ CORRIGÉ - GET /api/discovery/notifications - Récupérer les notifications
   */
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // ✅ CORRIGÉ - Récupération depuis la base avec RLS
      const notifications = await discoveryService.getNotifications(userId, req.userToken!, limit, offset);

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
   * ✅ CORRIGÉ - PUT /api/discovery/notifications/:id/read - Marquer comme lu
   */
  async markNotificationAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      console.log('✅ Mark Notification Read Controller - User:', userId, 'Notification:', id);

      // ✅ CORRIGÉ - Mise à jour en base avec RLS
      await discoveryService.markNotificationAsRead(userId, id, req.userToken!);

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
   * ✅ CORRIGÉ - PUT /api/discovery/notifications/read-all - Marquer toutes comme lues
   */
  async markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      console.log('✅ Mark All Notifications Read Controller - User:', userId);

      // ✅ CORRIGÉ - Mise à jour en base avec RLS
      await discoveryService.markAllNotificationsAsRead(userId, req.userToken!);

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
   * ✅ CORRIGÉ - GET /api/discovery/profile/:id - Récupérer un profil spécifique pour la découverte
   */
  async getDiscoveryProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      console.log('👤 Get Discovery Profile Controller - User:', userId, 'Profile:', id);

      // ✅ CORRIGÉ - Récupération depuis la base avec RLS
      const profile = await discoveryService.getDiscoveryProfile(userId, id, req.userToken!);

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

  // =============================================
  // 🆕 CONTACT REQUEST SYSTEM METHODS
  // =============================================

  /**
   * 🆕 POST /api/discovery/contact-request - Demander un contact
   */
  async requestContact(req: AuthRequest, res: Response): Promise<void> {
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

      const senderId = req.user!.id;
      const { receiver_id, message } = req.body;

      console.log('💬 Contact Request Controller - De:', senderId, 'vers:', receiver_id);

      const result = await contactService.requestContact(senderId, receiver_id, message, req.userToken!);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.request
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          can_retry_after: result.can_retry_after
        });
      }

    } catch (error) {
      console.error('❌ Contact Request Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to request contact',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 🆕 PUT /api/discovery/contact-request/:requestId - Répondre à une demande de contact
   */
  async respondToContactRequest(req: AuthRequest, res: Response): Promise<void> {
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

      console.log('📝 Contact Response Controller - Request:', requestId, 'Response:', response);

      const result = await contactService.respondToContactRequest(requestId, userId, response, req.userToken!);

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
      console.error('❌ Contact Response Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to respond to contact request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 🆕 GET /api/discovery/contact-requests/received
   */
  async getReceivedContactRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      console.log('📥 Get Received Contact Requests Controller - User:', userId);

      const requests = await contactService.getReceivedContactRequests(userId, req.userToken!);

      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('❌ Get Received Contact Requests Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch received contact requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 🆕 GET /api/discovery/contact-requests/sent
   */
  async getSentContactRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      console.log('📤 Get Sent Contact Requests Controller - User:', userId);

      const requests = await contactService.getSentContactRequests(userId, req.userToken!);

      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('❌ Get Sent Contact Requests Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sent contact requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 🆕 GET /api/discovery/contact-requests/can-request/:targetId
   */
  async canRequestContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { targetId } = req.params;

      console.log('🤔 Can Request Contact Controller - User:', userId, 'Target:', targetId);

      const canRequest = await contactService.canRequestContact(userId, targetId, req.userToken!);

      res.json({
        success: true,
        data: { can_request: canRequest }
      });
    } catch (error) {
      console.error('❌ Can Request Contact Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check contact request permission',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const discoveryController = new DiscoveryController();
  /**
   * 🆕 GET /api/discovery/notifications/grouped - Notifications regroupées intelligentes
   */
  async getGroupedNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 15;

      console.log('📊 Get Grouped Notifications Controller - User:', userId, 'Limit:', limit);

      const groupedNotifications = await discoveryService.getGroupedNotifications(userId, req.userToken!, limit);

      res.json({
        success: true,
        data: groupedNotifications
      });
    } catch (error) {
      console.error('❌ Get Grouped Notifications Controller - Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch grouped notifications'
      });
    }
  }
