import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../auth/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { adminController } from './admin.controller';

const router = Router();

// Toutes les routes nécessitent authentification + rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Validation pour la création/modification de quêtes
const questValidation = [
  body('type')
    .isIn(['profile', 'photo', 'questionnaire', 'social', 'custom'])
    .withMessage('Type must be one of: profile, photo, questionnaire, social, custom'),
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('xp_reward')
    .isInt({ min: 0, max: 10000 })
    .withMessage('XP reward must be between 0 and 10000'),
  body('credits_reward')
    .isInt({ min: 0, max: 1000 })
    .withMessage('Credits reward must be between 0 and 1000'),
  body('icon')
    .isLength({ min: 1, max: 10 })
    .withMessage('Icon must be between 1 and 10 characters'),
  body('required_level')
    .isInt({ min: 1, max: 100 })
    .withMessage('Required level must be between 1 and 100'),
  body('is_active')
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

// Routes principales
router.get('/dashboard', adminController.getDashboard.bind(adminController));
router.get('/stats', adminController.getStats.bind(adminController));

// Routes des quêtes
router.get('/quests', adminController.getAllQuests.bind(adminController));
router.get('/quests/:id', adminController.getQuestDetails.bind(adminController));
router.post('/quests', questValidation, adminController.createQuest.bind(adminController));
router.put('/quests/:id', questValidation, adminController.updateQuest.bind(adminController));
router.delete('/quests/:id', adminController.deleteQuest.bind(adminController));

// Actions spéciales
router.post('/quests/:id/sync', adminController.syncQuestWithUsers.bind(adminController));

export const adminRoutes = router;