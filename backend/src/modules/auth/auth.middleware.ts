// backend/src/modules/auth/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/database';

// ✅ Interface étendue pour le token
interface AuthenticatedRequest extends Request {
  user?: any;
  userToken?: string; // ✅ NOUVEAU - Token pour RLS
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7);
    
    // ✅ Validation avec admin client (OK - sécurisé)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // ✅ NOUVEAU - Passer le token pour RLS
    req.user = user;
    req.userToken = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
// Alias pour compatibilité avec les routes
export const requireAuth = authMiddleware;
