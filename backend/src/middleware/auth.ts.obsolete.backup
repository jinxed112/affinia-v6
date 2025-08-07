// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extension du type Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email?: string
        role?: string
      }
    }
  }
}

interface JWTPayload {
  sub: string // user ID
  email?: string
  role?: string
  iat?: number
  exp?: number
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Récupération du token depuis l'header Authorization
    const authHeader = req.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token d\'authentification manquant',
        message: 'Utilisez: Authorization: Bearer <token>',
        timestamp: new Date().toISOString()
      })
    }

    const token = authHeader.substring(7) // Retire "Bearer "

    if (!token) {
      return res.status(401).json({
        error: 'Token invalide',
        timestamp: new Date().toISOString()
      })
    }

    // Pour le développement, on accepte des tokens simplifiés
    // En production, on utilisera les vrais tokens Supabase
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      req.user = {
        id: 'dev-user-123',
        email: 'dev@affinia.com',
        role: 'user'
      }
      return next()
    }

    // Tentative de décodage du token JWT
    try {
      // Si on a une clé JWT configurée, on l'utilise
      const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET
      
      if (!jwtSecret) {
        console.warn('⚠️ Aucune clé JWT configurée, mode développement')
        // En mode dev sans clé, on simule un utilisateur
        if (process.env.NODE_ENV === 'development') {
          req.user = {
            id: `dev-${Date.now()}`,
            email: 'dev@affinia.com',
            role: 'user'
          }
          return next()
        }
        throw new Error('JWT Secret manquant')
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload
      
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'user'
      }

      next()

    } catch (jwtError) {
      console.error('❌ Erreur JWT:', jwtError)
      
      // Si on est en développement et que c'est juste un problème de clé
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Token JWT invalide en dev, simulation utilisateur')
        req.user = {
          id: 'dev-fallback-user',
          email: 'dev@affinia.com',
          role: 'user'
        }
        return next()
      }

      return res.status(401).json({
        error: 'Token invalide ou expiré',
        details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Erreur middleware auth:', error)
    
    return res.status(500).json({
      error: 'Erreur d\'authentification interne',
      timestamp: new Date().toISOString()
    })
  }
}

// Middleware optionnel - vérifie le token mais ne bloque pas si absent
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  
  if (authHeader?.startsWith('Bearer ')) {
    // Si un token est présent, on l'utilise
    return authMiddleware(req, res, next)
  } else {
    // Sinon on continue sans utilisateur
    req.user = undefined
    next()
  }
}

// Middleware pour vérifier les rôles
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise'
      })
    }

    if (!roles.includes(req.user.role || 'user')) {
      return res.status(403).json({
        error: 'Permissions insuffisantes',
        required_roles: roles,
        user_role: req.user.role
      })
    }

    next()
  }
}