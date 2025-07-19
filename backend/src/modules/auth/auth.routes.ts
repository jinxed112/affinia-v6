import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

// Routes publiques
router.post('/verify', authController.verifyToken);
router.post('/refresh', authController.refreshToken);

// Routes protégées
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/logout', requireAuth, authController.logout);
router.get('/session', requireAuth, authController.getSession);

export const authRoutes = router;