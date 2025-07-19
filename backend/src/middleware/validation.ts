// backend/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valider le body de la requête
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))

        return res.status(400).json({
          error: 'Données de requête invalides',
          details: formattedErrors,
          timestamp: new Date().toISOString()
        })
      }

      // Erreur de validation inattendue
      console.error('❌ Erreur validation inattendue:', error)
      return res.status(500).json({
        error: 'Erreur de validation interne'
      })
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Paramètres invalides',
          details: error.errors
        })
      }
      next(error)
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Paramètres de requête invalides',
          details: error.errors
        })
      }
      next(error)
    }
  }
}