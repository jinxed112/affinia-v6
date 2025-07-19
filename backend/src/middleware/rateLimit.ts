// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit'

// Rate limiting général
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes, réessayez plus tard',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit dépassé pour ${req.ip} sur ${req.url}`)
    res.status(429).json({
      error: 'Trop de requêtes',
      message: 'Vous avez dépassé la limite de requêtes autorisées',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    })
  }
})

// Rate limiting strict pour la génération de prompts
export const promptGenerationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 générations maximum par 5 minutes
  keyGenerator: (req) => {
    // Limiter par utilisateur si authentifié, sinon par IP
    return req.user?.id || req.ip
  },
  message: {
    error: 'Limite de génération de prompts atteinte',
    message: 'Vous ne pouvez générer que 5 prompts par 5 minutes',
    timestamp: new Date().toISOString()
  },
  handler: (req, res) => {
    console.log(`🚨 Limite prompt dépassée pour user ${req.user?.id || req.ip}`)
    res.status(429).json({
      error: 'Limite de génération atteinte',
      message: 'Attendez quelques minutes avant de générer un nouveau prompt',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    })
  }
})

// Rate limiting pour la validation de profils
export const profileValidationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 validations par minute
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Limite de validation de profils atteinte',
    retryAfter: '1 minute'
  }
})