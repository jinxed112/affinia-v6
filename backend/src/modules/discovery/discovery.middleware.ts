import { Request, Response, NextFunction } from 'express';

/**
 * Middleware pour les routes de découverte
 * Peut être étendu avec des validations spécifiques
 */
export const discoveryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Middleware de découverte - peut être étendu selon les besoins
  next();
};
