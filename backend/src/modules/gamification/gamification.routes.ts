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

// Route pour valider automatiquement les actions
router.post('/validate/:action', gamificationController.validateAction.bind(gamificationController));

export { router as gamificationRoutes };