// =============================================
// ROUTES BACKEND - Découverte et Miroir Privé
// =============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../auth/auth.middleware';
import { discoveryController } from './discovery.controller';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// ============ ROUTES PRINCIPALES ============

/**
 * GET /api/discovery - Récupérer les profils pour la découverte
 * Query params : gender, min_age, max_age, max_distance_km, etc.
 */
router.get(
  '/',
  [
    query('gender').optional().isIn(['male', 'female', 'other', 'all']),
    query('min_age').optional().isInt({ min: 18, max: 99 }),
    query('max_age').optional().isInt({ min: 18, max: 99 }),
    query('max_distance_km').optional().isInt({ min: 1, max: 500 }),
    query('sort_by').optional().isIn(['distance', 'age', 'newest', 'random']),
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

// ============ ROUTES MIROIR ============

/**
 * POST /api/discovery/mirror-request - Demander l'accès au miroir
 * Body: { receiver_id: string }
 */
router.post(
  '/mirror-request',
  [
    body('receiver_id')
      .isUUID()
      .withMessage('Receiver ID must be a valid UUID')
  ],
  discoveryController.requestMirrorAccess
);

/**
 * PUT /api/discovery/mirror-request/:requestId - Répondre à une demande
 * Body: { response: 'accepted' | 'rejected' }
 */
router.put(
  '/mirror-request/:requestId',
  [
    param('requestId').isUUID().withMessage('Request ID must be a valid UUID'),
    body('response')
      .isIn(['accepted', 'rejected'])
      .withMessage('Response must be "accepted" or "rejected"')
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

export default router;

// ============ FICHIER À CRÉER: discovery.validation.ts ============
/*
import { body, query, param } from 'express-validator';

export const discoveryValidation = {
  // Validation pour la récupération des profils
  getProfiles: [
    query('gender').optional().isIn(['male', 'female', 'other', 'all']),
    query('min_age').optional().isInt({ min: 18, max: 99 }),
    query('max_age').optional().isInt({ min: 18, max: 99 }),
    query('max_distance_km').optional().isInt({ min: 1, max: 500 }),
    query('sort_by').optional().isIn(['distance', 'age', 'newest', 'random']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 })
  ],

  // Validation pour la demande de miroir
  requestMirror: [
    body('receiver_id')
      .isUUID()
      .withMessage('Receiver ID must be a valid UUID'),
    body('message')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Message must be less than 500 characters')
  ],

  // Validation pour la réponse à une demande
  respondToRequest: [
    param('requestId').isUUID().withMessage('Request ID must be a valid UUID'),
    body('response')
      .isIn(['accepted', 'rejected'])
      .withMessage('Response must be "accepted" or "rejected"'),
    body('message')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Message must be less than 500 characters')
  ]
};
*/

// ============ FICHIER À CRÉER: discovery.middleware.ts ============
/*
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { discoveryService } from './discovery.service';

export const validateMirrorAccess = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { profileId } = req.params;

    const canView = await discoveryService.canViewMirror(userId, profileId);
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this mirror'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Mirror Access Middleware - Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate mirror access'
    });
  }
};

export const rateLimitMirrorRequests = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  // Implémenter rate limiting pour éviter le spam
  // Ex: max 10 demandes par jour par utilisateur
  next();
};
*/