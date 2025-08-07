// backend/src/modules/profile/profile.service.ts - VERSION DEBUG COMPLÈTE
import { supabaseAdmin, createUserSupabase, UserSupabaseClient } from '../../config/database';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  xp: number;
  credits: number;
  level: number;
  bio?: string;
  location?: string;
  age?: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  age?: number;
}

export interface ProfileCard {
  userId: string;
  name: string;
  level: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  traits: {
    authenticity_score?: number;
    attachment_style?: string;
    strength_signals?: string[];
    weakness_signals?: string[];
  };
  stats: {
    xp: number;
    credits: number;
    questionnairesCompleted: number;
  };
}

export interface DashboardData {
  profile: {
    id: string;
    name: string;
    email: string;
    credits: number;
    level: number;
    xp: number;
    avatar_url: string | null;
  };
  cardData: {
    userName: string;
    age?: number;
    profileJson: any;
    photos: Array<{
      id: string;
      photo_url: string;
      is_main?: boolean;
      photo_order?: number;
    }>;
  } | null;
  features: {
    hasStarterCard: boolean;
    hasMirror: boolean;
    mysteryCardsAvailable: number;
    nextCardAvailable: Date | null;
  };
}

class ProfileService {
  /**
   * ✅ VERSION DEBUG - Avec validation token + bypass RLS temporaire
   */
  async getProfile(userId: string, userToken: string): Promise<Profile | null> {
    try {
      console.log('🔍 DEBUG getProfile:', {
        userId: userId,
        tokenPrefix: userToken.substring(0, 20) + '...',
        tokenLength: userToken.length
      });

      // 1. D'ABORD : Vérifier que le token est valide
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user) {
        console.error('❌ Token invalide:', tokenError);
        return null;
      }
      
      console.log('✅ Token valide pour:', user.email);
      
      // 2. VÉRIFIER : L'userId correspond au token
      if (user.id !== userId) {
        console.error('❌ UserID mismatch:', { tokenUserId: user.id, requestedUserId: userId });
        return null;
      }
      
      console.log('✅ UserID match confirmé');

      // 3. TEMPORAIRE : Utiliser supabaseAdmin avec WHERE explicite (bypass RLS)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile query error:', error);
        return null;
      }

      console.log('✅ Profile trouvé via admin:', data.email);
      return data;

    } catch (error) {
      console.error('💥 Profile service error:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Met à jour un profil avec validation token
   */
  async updateProfile(userId: string, updates: ProfileUpdate, userToken: string): Promise<Profile> {
    try {
      // Valider le token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        throw new Error('Token invalide ou UserID mismatch');
      }

      // Valider les données
      const cleanUpdates = this.validateProfileUpdates(updates);

      // TEMPORAIRE : Utiliser supabaseAdmin
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère les données pour la carte Affinia
   */
  async getProfileCardData(userId: string, userToken: string): Promise<ProfileCard | null> {
    try {
      // Valider token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        return null;
      }

      // Récupérer le profil
      const profile = await this.getProfile(userId, userToken);
      if (!profile) return null;

      // Récupérer questionnaire avec supabaseAdmin
      const { data: questionnaireData } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('profile_json, completed_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Compter questionnaires
      const { count } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Construire les données de la carte
      const profileJson = questionnaireData?.profile_json as any || {};
      const authenticityScore = profileJson.authenticity_score || 0;
      const rarity = this.calculateRarity(authenticityScore, profile.level);

      return {
        userId,
        name: profile.name || 'Anonyme',
        level: profile.level,
        rarity,
        traits: {
          authenticity_score: profileJson.authenticity_score,
          attachment_style: profileJson.attachment_style,
          strength_signals: profileJson.strength_signals?.slice(0, 3),
          weakness_signals: profileJson.weakness_signals?.slice(0, 2)
        },
        stats: {
          xp: profile.xp,
          credits: profile.credits,
          questionnairesCompleted: count || 0
        }
      };
    } catch (error) {
      console.error('Get profile card error:', error);
      return null;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère toutes les données nécessaires pour le dashboard
   */
  async getDashboardData(userId: string, userToken: string): Promise<DashboardData | null> {
    try {
      console.log(`Récupération des données dashboard pour l'utilisateur: ${userId}`);
      
      // Valider token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('Token validation failed:', tokenError);
        return null;
      }

      // 1. Récupérer le profil de base avec supabaseAdmin
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, name, avatar_url, credits, level, xp, age')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Profil récupéré:', profile);

      // 2. Récupérer les données du questionnaire
      const { data: questionnaireData, error: questionnaireError } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('profile_json, answers')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaireError && questionnaireError.code !== 'PGRST116') {
        console.log('Questionnaire error (non-critique):', questionnaireError);
      }

      // 3. Récupérer les photos du profil
      const { data: photos, error: photosError } = await supabaseAdmin
        .from('profile_photos')
        .select('id, photo_url, is_main, photo_order')
        .eq('user_id', userId)
        .order('photo_order', { ascending: true });

      if (photosError && photosError.code !== 'PGRST116') {
        console.log('Photos error (non-critique):', photosError);
      }

      console.log('Photos récupérées:', photos);

      // 4. Vérifier les cartes (gestion d'erreur si table n'existe pas)
      let hasStarterCard = false;
      let mysteryCardsAvailable = 0;
      let nextCardAvailable = null;

      try {
        const { data: userCards } = await supabaseAdmin
          .from('user_cards')
          .select('type, is_mystery, available, created_at')
          .eq('user_id', userId);

        if (userCards && userCards.length > 0) {
          hasStarterCard = userCards.some(card => card.type === 'starter');
          mysteryCardsAvailable = userCards.filter(card => card.is_mystery && card.available).length;

          // Calculer prochaine carte (24h après la dernière)
          const lastCard = userCards.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          if (lastCard) {
            const nextAvailable = new Date(new Date(lastCard.created_at).getTime() + 24 * 60 * 60 * 1000);
            if (nextAvailable.getTime() > Date.now()) {
              nextCardAvailable = nextAvailable;
            }
          }
        }
      } catch (cardsError: any) {
        console.log('Table user_cards non accessible:', cardsError.message);
      }

      // 5. Vérifier le miroir
      let hasMirror = false;
      try {
        const { data: mirror } = await supabaseAdmin
          .from('user_mirrors')
          .select('id')
          .eq('user_id', userId)
          .single();

        hasMirror = !!mirror;
      } catch (mirrorError: any) {
        console.log('Table user_mirrors non accessible:', mirrorError.message);
      }

      // 6. Construire les données de la carte si questionnaire existe
      let cardData = null;
      if (questionnaireData && questionnaireData.profile_json) {
        const answers = questionnaireData.answers || {};
        cardData = {
          userName: answers.firstName || profile.name || 'Dresseur',
          age: answers.age || profile.age,
          profileJson: questionnaireData.profile_json,
          photos: photos || []
        };
      }

      const dashboardData: DashboardData = {
        profile: {
          id: profile.id,
          name: profile.name || profile.email.split('@')[0],
          email: profile.email,
          credits: profile.credits || 0,
          level: profile.level || 1,
          xp: profile.xp || 0,
          avatar_url: profile.avatar_url
        },
        cardData,
        features: {
          hasStarterCard,
          hasMirror,
          mysteryCardsAvailable,
          nextCardAvailable
        }
      };

      console.log('Dashboard data assemblé:', dashboardData);
      return dashboardData;

    } catch (error) {
      console.error('Dashboard data error:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère les statistiques détaillées
   */
  async getProfileStats(userId: string, userToken: string): Promise<any> {
    try {
      const profile = await this.getProfile(userId, userToken);
      if (!profile) throw new Error('Profile not found');

      // Stats des questionnaires avec supabaseAdmin
      const { data: questionnaires } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('created_at, completed_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Calculer les stats
      const totalQuestionnaires = questionnaires?.length || 0;
      const lastQuestionnaireDate = questionnaires?.[0]?.created_at;
      const avgCompletionTime = this.calculateAvgCompletionTime(questionnaires || []);

      // Progression XP
      const nextLevelXp = this.getXpForLevel(profile.level + 1);
      const currentLevelXp = this.getXpForLevel(profile.level);
      const progressPercent = ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

      return {
        profile: {
          level: profile.level,
          xp: profile.xp,
          credits: profile.credits,
          memberSince: profile.created_at
        },
        progression: {
          currentXp: profile.xp,
          nextLevelXp,
          progressPercent: Math.round(progressPercent),
          xpToNextLevel: nextLevelXp - profile.xp
        },
        questionnaires: {
          total: totalQuestionnaires,
          lastCompleted: lastQuestionnaireDate,
          avgCompletionTime
        },
        achievements: {
          unlocked: [],
          inProgress: []
        }
      };
    } catch (error) {
      console.error('Get profile stats error:', error);
      throw error;
    }
  }

  /**
   * ✅ GARDE ADMIN - Vérifie si un utilisateur peut voir un profil (logique métier)
   */
  async canViewProfile(requesterId: string, targetId: string): Promise<boolean> {
    // Pour l'instant, tout le monde peut voir les profils publics
    // À terme : vérifier les matchs, les blocages, etc.
    return true;
  }

  /**
   * Filtre les infos sensibles d'un profil
   */
  getPublicProfile(profile: Profile): Partial<Profile> {
    return {
      id: profile.id,
      name: profile.name,
      avatar_url: profile.avatar_url,
      level: profile.level,
      bio: profile.bio,
      location: profile.location,
      created_at: profile.created_at
      // On ne montre pas : email, credits, xp exact
    };
  }

  // ============ MÉTHODES PRIVÉES ============

  private validateProfileUpdates(updates: ProfileUpdate): ProfileUpdate {
    const clean: ProfileUpdate = {};

    if (updates.name !== undefined) {
      clean.name = updates.name.trim().substring(0, 100);
    }

    if (updates.bio !== undefined) {
      clean.bio = updates.bio.trim().substring(0, 500);
    }

    if (updates.location !== undefined) {
      clean.location = updates.location.trim().substring(0, 100);
    }

    if (updates.age !== undefined) {
      const age = parseInt(updates.age.toString());
      if (age >= 18 && age <= 120) {
        clean.age = age;
      }
    }

    return clean;
  }

  private calculateRarity(authenticityScore: number, level: number): 'common' | 'rare' | 'epic' | 'legendary' {
    const combinedScore = (authenticityScore * 0.7) + (level * 3);

    if (combinedScore >= 90) return 'legendary';
    if (combinedScore >= 70) return 'epic';
    if (combinedScore >= 50) return 'rare';
    return 'common';
  }

  private getXpForLevel(level: number): number {
    return 100 * level * (level + 1) / 2;
  }

  private calculateAvgCompletionTime(questionnaires: any[]): string {
    if (questionnaires.length === 0) return 'N/A';

    const times = questionnaires
      .filter(q => q.created_at && q.completed_at)
      .map(q => {
        const start = new Date(q.created_at).getTime();
        const end = new Date(q.completed_at).getTime();
        return end - start;
      });

    if (times.length === 0) return 'N/A';

    const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
    const avgMinutes = Math.round(avgMs / 60000);

    return `${avgMinutes} minutes`;
  }
}

export const profileService = new ProfileService();