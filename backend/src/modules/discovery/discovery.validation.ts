import { body, query } from 'express-validator';

/**
 * Validations pour les routes de découverte
 */
export const discoveryValidation = {
  // Validation des filtres de découverte
  getProfiles: [
    query('gender').optional().isIn(['homme', 'femme', 'non-binaire', 'autre']),
    query('min_age').optional().isInt({ min: 18, max: 99 }),
    query('max_age').optional().isInt({ min: 18, max: 99 }),
    query('max_distance_km').optional().isInt({ min: 1, max: 500 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  
  // Validation des demandes de miroir
  mirrorRequest: [
    body('receiver_id').isUUID().withMessage('ID destinataire invalide')
  ]
};
