import { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '../../config/database'
import { cacheService } from '../../services/cache.service'
import { logger } from '../../services/logger.service'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  xp: number
  credits: number
  level: number
  role: string
  created_at: string
  updated_at: string
}

interface AuthAttempt {
  count: number
  lastAttempt: number
  blockedUntil?: number
}

class EnhancedAuthService {
  private readonly TOKEN_CACHE_TTL = 300 // 5 minutes
  private readonly FAILED_ATTEMPTS_CACHE_TTL = 3600 // 1 hour
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION = 900000 // 15 minutes

  /**
   * Vérifie un token avec mise en cache
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      // Vérifier le cache d'abord
      const cacheKey = `token:${this.hashToken(token)}`
      const cachedUser = await cacheService.get<User>(cacheKey)
      
      if (cachedUser) {
        logger.info('Token validation from cache', { userId: cachedUser.id })
        return cachedUser
      }

      // Validation Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

      if (error || !user) {
        logger.warn('Token validation failed', { error: error?.message })
        return null
      }

      // Mettre en cache le résultat
      await cacheService.set(cacheKey, user, this.TOKEN_CACHE_TTL)
      
      logger.info('Token validation successful', { userId: user.id })
      return user
    } catch (error) {
      logger.error('Token verification error', { error })
      return null
    }
  }

  /**
   * Récupère l'utilisateur avec son profil (optimisé)
   */
  async getUserWithProfile(userId: string): Promise<{
    user: User | null
    profile: UserProfile | null
  }> {
    try {
      const cacheKey = `user_profile:${userId}`
      const cached = await cacheService.get<{ user: User; profile: UserProfile }>(cacheKey)
      
      if (cached) {
        return cached
      }

      // Récupération parallèle pour optimiser
      const [userResult, profileResult] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(userId),
        supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
      ])

      const user = userResult.error ? null : userResult.data.user
      const profile = profileResult.error ? null : profileResult.data

      if (user && profile) {
        const result = { user, profile }
        await cacheService.set(cacheKey, result, this.TOKEN_CACHE_TTL)
      }

      return { user, profile }
    } catch (error) {
      logger.error('Get user with profile error', { error, userId })
      return { user: null, profile: null }
    }
  }

  /**
   * Gestion des tentatives de connexion échouées
   */
  async checkFailedAttempts(identifier: string): Promise<boolean> {
    try {
      const cacheKey = `failed_attempts:${identifier}`
      const attempts = await cacheService.get<AuthAttempt>(cacheKey)

      if (!attempts) return true // Pas de tentatives précédentes

      // Vérifier si le compte est bloqué
      if (attempts.blockedUntil && Date.now() < attempts.blockedUntil) {
        const remainingTime = Math.ceil((attempts.blockedUntil - Date.now()) / 60000)
        logger.warn('Account temporarily blocked', { 
          identifier, 
          remainingMinutes: remainingTime 
        })
        return false
      }

      return true
    } catch (error) {
      logger.error('Check failed attempts error', { error, identifier })
      return true // En cas d'erreur, autoriser
    }
  }

  /**
   * Enregistre une tentative de connexion échouée
   */
  async recordFailedAttempt(identifier: string): Promise<void> {
    try {
      const cacheKey = `failed_attempts:${identifier}`
      const attempts = await cacheService.get<AuthAttempt>(cacheKey) || {
        count: 0,
        lastAttempt: 0
      }

      attempts.count += 1
      attempts.lastAttempt = Date.now()

      // Bloquer le compte après trop de tentatives
      if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
        attempts.blockedUntil = Date.now() + this.LOCKOUT_DURATION
        logger.warn('Account blocked due to failed attempts', { 
          identifier, 
          count: attempts.count 
        })
      }

      await cacheService.set(cacheKey, attempts, this.FAILED_ATTEMPTS_CACHE_TTL)
    } catch (error) {
      logger.error('Record failed attempt error', { error, identifier })
    }
  }

  /**
   * Réinitialise les tentatives échouées après succès
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    try {
      const cacheKey = `failed_attempts:${identifier}`
      await cacheService.delete(cacheKey)
    } catch (error) {
      logger.error('Clear failed attempts error', { error, identifier })
    }
  }

  /**
   * Audit des actions utilisateur
   */
  async logUserActivity(
    userId: string, 
    action: string, 
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Log sécurisé
      logger.info('User activity', {
        userId,
        action,
        details: this.sanitizeDetails(details),
        ipAddress,
        userAgent: userAgent?.substring(0, 100),
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logger.error('Log user activity error', { error, userId, action })
    }
  }

  /**
   * Hash sécurisé du token pour le cache
   */
  private hashToken(token: string): string {
    return require('crypto').createHash('sha256').update(token).digest('hex')
  }

  /**
   * Sanitize les détails pour les logs
   */
  private sanitizeDetails(details: any): any {
    if (!details) return details
    
    const sanitized = { ...details }
    const sensitiveKeys = ['password', 'token', 'secret', 'key']
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[MASKED]'
      }
    }
    
    return sanitized
  }
}

export const enhancedAuthService = new EnhancedAuthService()
