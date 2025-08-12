// =============================================
// ROUTES BACKEND - Découverte et Miroir Privé + CONTACT REQUESTS
// =============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../auth/auth.middleware';
import { discoveryController } from './discovery.controller';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// ============ ROUTES DISCOVERY PRINCIPALES ============

/**
 * GET /api/discovery - Récupérer les profils pour la découverte
 */
router.get(
  '/',
  [
    query('gender').optional().isIn(['male', 'female', 'other', 'all']),
    query('min_age').optional().isInt({ min: 18, max: 100 }),
    query('max_age').optional().isInt({ min: 18, max: 100 }),
    query('max_distance_km').optional().isInt({ min: 1, max: 1000 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  discoveryController.getDiscoveryProfiles
);

/**
 * GET /api/discovery/profile/:id - Récupérer un profil spécifique
 */
router.get(
  '/profile/:id',
  [
    param('id').isUUID().withMessage('Profile ID must be a valid UUID')
  ],
  discoveryController.getDiscoveryProfile
);

// ============ ROUTES MIRROR REQUESTS ============

/**
 * POST /api/discovery/mirror-request - Demander l'accès au miroir
 */
router.post(
  '/mirror-request',
  [
    body('receiver_id').isUUID().withMessage('Receiver ID must be a valid UUID')
  ],
  discoveryController.requestMirrorAccess
);

/**
 * PUT /api/discovery/mirror-request/:requestId - Répondre à une demande de miroir
 */
router.put(
  '/mirror-request/:requestId',
  [
    param('requestId').isUUID().withMessage('Request ID must be a valid UUID'),
    body('response').isIn(['accepted', 'rejected']).withMessage('Response must be accepted or rejected')
  ],
  discoveryController.respondToMirrorRequest
);

/**
 * GET /api/discovery/mirror-requests/received - Mes demandes reçues
 */
router.get(
  '/mirror-requests/received',
  discoveryController.getReceivedMirrorRequests
);

/**
 * GET /api/discovery/mirror-requests/sent - Mes demandes envoyées
 */
router.get(
  '/mirror-requests/sent',
  discoveryController.getSentMirrorRequests
);

/**
 * GET /api/discovery/mirror/:profileId/can-view - Vérifier l'accès au miroir
 */
router.get(
  '/mirror/:profileId/can-view',
  [
    param('profileId').isUUID().withMessage('Profile ID must be a valid UUID')
  ],
  discoveryController.canViewMirror
);

/**
 * POST /api/discovery/mirror/:profileId/read - Enregistrer la lecture d'un miroir
 */
router.post(
  '/mirror/:profileId/read',
  [
    param('profileId').isUUID().withMessage('Profile ID must be a valid UUID')
  ],
  discoveryController.recordMirrorRead
);

// ============ ROUTES NOTIFICATIONS ============

/**
 * GET /api/discovery/notifications/stats - Statistiques de notifications
 */
router.get(
  '/notifications/stats',
  discoveryController.getNotificationStats
);

/**
 * GET /api/discovery/notifications/grouped - Notifications regroupées
 */
router.get(
  '/notifications/grouped',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  discoveryController.getGroupedNotifications
);

/**
 * GET /api/discovery/notifications - Récupérer les notifications
 */
router.get(
  '/notifications',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  discoveryController.getNotifications
);

/**
 * PUT /api/discovery/notifications/:id/read - Marquer une notification comme lue
 */
router.put(
  '/notifications/:id/read',
  [
    param('id').isUUID().withMessage('Notification ID must be a valid UUID')
  ],
  discoveryController.markNotificationAsRead
);

/**
 * PUT /api/discovery/notifications/read-all - Marquer toutes comme lues
 */
router.put(
  '/notifications/read-all',
  discoveryController.markAllNotificationsAsRead
);

// ============ ROUTES CONTACT REQUESTS ============

/**
 * POST /api/discovery/contact-request - Demander un contact
 */
router.post(
  '/contact-request',
  [
    body('receiver_id').isUUID().withMessage('Receiver ID must be a valid UUID'),
    body('message').optional().isLength({ max: 500 }).withMessage('Message too long')
  ],
  discoveryController.requestContact
);

/**
 * PUT /api/discovery/contact-request/:requestId - Répondre à une demande de contact
 */
router.put(
  '/contact-request/:requestId',
  [
    param('requestId').isUUID().withMessage('Request ID must be a valid UUID'),
    body('response').isIn(['accepted', 'declined']).withMessage('Response must be accepted or declined')
  ],
  discoveryController.respondToContactRequest
);

/**
 * GET /api/discovery/contact-requests/received - Mes demandes de contact reçues
 */
router.get(
  '/contact-requests/received',
  discoveryController.getReceivedContactRequests
);

/**
 * GET /api/discovery/contact-requests/sent - Mes demandes de contact envoyées
 */
router.get(
  '/contact-requests/sent',
  discoveryController.getSentContactRequests
);

/**
 * GET /api/discovery/contact-requests/can-request/:targetId - Vérifier si on peut demander un contact
 */
router.get(
  '/contact-requests/can-request/:targetId',
  [
    param('targetId').isUUID().withMessage('Target ID must be a valid UUID')
  ],
  discoveryController.canRequestContact
);

// ============ ROUTES UTILITAIRES ============

/**
 * GET /api/discovery/search - Recherche avancée (pour plus tard)
 */
router.get('/search', (req, res) => {
  res.json({
    success: false,
    message: 'Advanced search not implemented yet'
  });
});

/**
 * GET /api/discovery/filters - Récupérer les filtres disponibles
 */
router.get('/filters', (req, res) => {
  res.json({
    success: true,
    data: {
      genders: ['male', 'female', 'other', 'all'],
      age_range: { min: 18, max: 99 },
      distance_range: { min: 1, max: 500 },
      sort_options: ['distance', 'age', 'newest', 'random'],
      mirror_visibility: ['public', 'on_request', 'private']
    }
  });
});

export const discoveryRoutes = router;
