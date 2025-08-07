import { Request, Response, NextFunction } from 'express'
import { enhancedAuthService } from './auth.service.enhanced'
import { logger } from '../../services/logger.service'
import helmet from 'helmet'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role?: string
  }
  requestId?: string
}

/**
 * Middleware de sécurité avancé avec audit complet
 */
export const enhancedAuthMiddleware = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  req.requestId = requestId

  try {
    const authHeader = req.headers.authorization
    const clientIP = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent')?.substring(0, 100) || 'Unknown'

    // Log sécurisé de la requête
    logger.info('Auth check initiated', {
      requestId,
      method: req.method,
      url: req.url,
      ip: clientIP,
      userAgent
    })

    // Validation du header
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Invalid authorization header', { requestId, ip: clientIP })
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
        code: 'MISSING_AUTH_HEADER',
        hint: 'Include: Authorization: Bearer <token>',
        requestId
      })
    }

    const token = authHeader.substring(7)

    if (!token?.trim()) {
      logger.warn('Empty token provided', { requestId, ip: clientIP })
      return res.status(401).json({
        success: false,
        error: 'Empty token provided',
        code: 'EMPTY_TOKEN',
        requestId
      })
    }

    // Validation avec service amélioré
    const user = await enhancedAuthService.verifyToken(token)

    if (!user) {
      logger.warn('Token validation failed', { requestId, ip: clientIP })
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        hint: 'Please login again to get a new token',
        requestId
      })
    }

    // Récupérer le profil pour le rôle
    const { profile } = await enhancedAuthService.getUserWithProfile(user.id)

    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile?.role || 'user'
    }

    // Log du succès (sans informations sensibles)
    logger.info('Authentication successful', {
      requestId,
      userId: user.id,
      userEmail: user.email,
      userRole: profile?.role || 'user'
    })

    // Audit de l'activité
    await enhancedAuthService.logUserActivity(
      user.id,
      `API_ACCESS:${req.method}:${req.url}`,
      { requestId },
      clientIP,
      userAgent
    )

    next()

  } catch (error: any) {
    logger.error('Auth middleware error', {
      requestId,
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    })

    res.status(500).json({
      success: false,
      error: 'Authentication system error',
      code: 'AUTH_SYSTEM_ERROR',
      requestId
    })
  }
}

// Garder les autres middleware existants pour compatibilité
// export { authMiddleware, optionalAuthMiddleware, requireRole } from './auth.middleware.old' // Désactivé car .old a des erreurs

// Middleware de sécurité avec helmet
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
export const requireAuth = enhancedAuthMiddleware;
