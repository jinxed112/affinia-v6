import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * 🔧 AMÉLIORÉ - Middleware d'authentification avec messages d'erreur détaillés
 */
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent')?.substring(0, 100) || 'Unknown';
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🔐 [${requestId}] Auth check: ${req.method} ${req.url} from ${clientIP}`);

    // ❌ Pas de header Authorization
    if (!authHeader) {
      console.log(`❌ [${requestId}] No Authorization header`);
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
        code: 'MISSING_AUTH_HEADER',
        hint: 'Please include Authorization header with Bearer token',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // ❌ Format Authorization incorrect
    if (!authHeader.startsWith('Bearer ')) {
      console.log(`❌ [${requestId}] Invalid Authorization header format:`, authHeader.substring(0, 20) + '...');
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format',
        code: 'INVALID_AUTH_FORMAT',
        hint: 'Use: Authorization: Bearer <your_token>',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // ❌ Token vide
    if (!token || token.trim().length === 0) {
      console.log(`❌ [${requestId}] Empty token`);
      return res.status(401).json({
        success: false,
        error: 'Empty token provided',
        code: 'EMPTY_TOKEN',
        hint: 'Token cannot be empty',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Logs pour debug (masquer le token complet)
    console.log(`🔍 [${requestId}] Token validation - Length: ${token.length}, Start: ${token.substring(0, 10)}...`);

    // 🔐 Vérifier le token avec Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    // ❌ Erreur lors de la validation du token
    if (error) {
      console.log(`❌ [${requestId}] Token validation failed:`, {
        error: error.message,
        name: error.name,
        status: error.status
      });

      // Messages d'erreur spécifiques selon le type d'erreur Supabase
      let errorCode = 'INVALID_TOKEN';
      let hint = 'Please login again to get a new token';

      if (error.message?.includes('expired')) {
        errorCode = 'TOKEN_EXPIRED';
        hint = 'Your session has expired. Please login again';
      } else if (error.message?.includes('invalid')) {
        errorCode = 'TOKEN_INVALID';
        hint = 'The token format is invalid. Please login again';
      } else if (error.message?.includes('not found')) {
        errorCode = 'USER_NOT_FOUND';
        hint = 'User associated with this token was not found';
      } else if (error.message?.includes('refresh')) {
        errorCode = 'TOKEN_REFRESH_REQUIRED';
        hint = 'Token needs to be refreshed. Please use refresh token';
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: errorCode,
        hint,
        requestId,
        timestamp: new Date().toISOString(),
        // En développement, inclure plus de détails
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            supabaseError: error.message,
            tokenLength: token.length,
            userAgent
          }
        })
      });
    }

    // ❌ Pas d'utilisateur retourné
    if (!user) {
      console.log(`❌ [${requestId}] No user returned despite no error`);
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        hint: 'The token is valid but no user was found. Please login again',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // ✅ Succès - Ajouter l'utilisateur à la requête
    console.log(`✅ [${requestId}] Auth successful - User: ${user.email} (ID: ${user.id})`);

    req.user = {
      id: user.id,
      email: user.email || ''
    };

    // Logging détaillé en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [${requestId}] User details:`, {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at
      });
    }

    next();

  } catch (error) {
    console.error('💥 Auth middleware unexpected error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Authentication system error',
      code: 'AUTH_SYSTEM_ERROR',
      hint: 'An unexpected error occurred during authentication. Please try again',
      timestamp: new Date().toISOString(),
      // En développement, inclure la stack trace
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          error: error.message,
          stack: error.stack
        }
      })
    });
  }
};

/**
 * 🆕 NOUVEAU - Middleware optionnel pour vérifier le token sans bloquer
 */
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, mais on continue quand même
      req.user = undefined;
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log('ℹ️ Optional auth failed, but continuing:', error?.message);
      req.user = undefined;
    } else {
      console.log('✅ Optional auth successful:', user.email);
      req.user = {
        id: user.id,
        email: user.email || ''
      };
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // En cas d'erreur, on continue sans utilisateur
    req.user = undefined;
    next();
  }
};

/**
 * 🆕 NOUVEAU - Middleware pour vérifier les rôles spécifiques
 */
export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for this action',
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Récupérer le rôle depuis la base de données
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({
          success: false,
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      const userRole = profile.role || 'user';

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required_roles: roles,
          user_role: userRole,
          timestamp: new Date().toISOString()
        });
      }

      next();

    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        error: 'Role verification failed',
        code: 'ROLE_CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * 🆕 NOUVEAU - Alias pour la compatibilité
 */
export const requireAuth = authMiddleware;