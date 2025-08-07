import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthRequest } from './auth.middleware';

class AuthController {
  /**
   * Vérifie si un token est valide
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const user = await authService.verifyToken(token);
      
      if (!user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at !== null
        }
      });
    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({ error: 'Failed to verify token' });
    }
  }

  /**
   * Récupère l'utilisateur actuel avec son profil
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const { user, profile } = await authService.getUserWithProfile(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at !== null,
          createdAt: user.created_at
        },
        profile: profile || null
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user data' });
    }
  }

  /**
   * Rafraîchit un token expiré
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      const { session, error } = await authService.refreshSession(refreshToken);
      
      if (error || !session) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      res.json({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: session.expires_at
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }

  /**
   * Déconnexion (optionnel car géré côté client)
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      // Log l'événement de déconnexion
      await authService.logUserActivity(userId, 'logout');
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  /**
   * Récupère les infos de session
   */
  async getSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const sessionInfo = await authService.getSessionInfo(userId);
      
      res.json(sessionInfo);
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({ error: 'Failed to get session info' });
    }
  }
}

export const authController = new AuthController();