// backend/src/middleware/error.ts
import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Erreur capturée:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Erreur de validation Zod
  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: 'Données de requête invalides',
      details: error.errors,
      timestamp: new Date().toISOString()
    })
  }

  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide',
      timestamp: new Date().toISOString()
    })
  }

  // Erreur de syntaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      error: 'JSON invalide dans la requête',
      timestamp: new Date().toISOString()
    })
  }

  // Erreur générique
  res.status(error.status || 500).json({
    error: error.message || 'Erreur interne du serveur',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  })
}