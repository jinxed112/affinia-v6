import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../config/database';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  credits: number;
  level: number;
  created_at: string;
  updated_at: string;
}

class AuthService {
  /**
   * Vérifie un token et retourne l'utilisateur
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Récupère l'utilisateur avec son profil
   */
  async getUserWithProfile(userId: string): Promise<{
    user: User | null;
    profile: UserProfile | null;
  }> {
    try {
      // Récupérer l'utilisateur
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !user) {
        return { user: null, profile: null };
      }

      // Récupérer le profil
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return { user, profile: null };
      }

      return { user, profile };
    } catch (error) {
      console.error('Get user with profile error:', error);
      return { user: null, profile: null };
    }
  }

  /**
   * Rafraîchit une session
   */
  async refreshSession(refreshToken: string): Promise<{
    session: any | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken
      });

      return { session: data.session, error };
    } catch (error) {
      console.error('Refresh session error:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Log l'activité utilisateur
   */
  async logUserActivity(userId: string, action: string): Promise<void> {
    try {
      // Optionnel : créer une table user_activities pour tracker
      console.log(`User ${userId} performed action: ${action}`);
      
      // Pour le futur :
      // await supabaseAdmin
      //   .from('user_activities')
      //   .insert({
      //     user_id: userId,
      //     action,
      //     timestamp: new Date().toISOString()
      //   });
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }

  /**
   * Récupère les informations de session
   */
  async getSessionInfo(userId: string): Promise<any> {
    try {
      // Récupérer les stats de connexion
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('created_at, updated_at')
        .eq('id', userId)
        .single();

      // Récupérer le nombre de questionnaires complétés
      const { count: questionnairesCount } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        userId,
        accountCreated: profile?.created_at,
        lastActivity: profile?.updated_at,
        questionnairesCompleted: questionnairesCount || 0,
        // Ajouter d'autres stats si nécessaire
      };
    } catch (error) {
      console.error('Get session info error:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur existe
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Check user exists error:', error);
      return false;
    }
  }

  /**
   * Met à jour la dernière activité
   */
  async updateLastActivity(userId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Update last activity error:', error);
    }
  }
}

export const authService = new AuthService();