import { Router } from 'express';
import { profileController } from './profile.controller';
import { authMiddleware } from '../auth/auth.middleware'; // ← CHANGÉ: requireAuth → authMiddleware
import { validateUpdateProfile, validateProfileId } from './profile.validator';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware); // ← CHANGÉ: requireAuth → authMiddleware

// Routes (reste identique)
router.get('/me', profileController.getMyProfile);
router.get('/:userId', validateProfileId, profileController.getProfile);
router.put('/me', validateUpdateProfile, profileController.updateMyProfile);
router.get('/:userId/card', validateProfileId, profileController.getProfileCard);
router.get('/:userId/stats', validateProfileId, profileController.getProfileStats);
router.post('/me/avatar', profileController.uploadAvatar);

export const profileRoutes = router;