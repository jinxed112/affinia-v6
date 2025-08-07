import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import { logger } from '../services/logger.service'

// Rate limiting pour les tentatives de connexion
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Combiner IP + email pour un rate limiting plus précis
    const email = req.body?.email || ''
    return `${req.ip}:${email}`
  },
  message: {
    error: 'Trop de tentatives de connexion',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes',
    hint: 'Attendez 15 minutes avant de réessayer'
  },
  onLimitReached: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded for auth', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email
    })
  }
})

// Rate limiting général pour l'API
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  }
})

// Rate limiting strict pour les endpoints sensibles
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 tentatives par heure
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de sécurité atteinte',
    code: 'SECURITY_RATE_LIMIT',
    retryAfter: '1 hour'
  }
})
