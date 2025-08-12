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

// ============ ROUTES PRINCIPALES ============

export const discoveryRoutes = router;
