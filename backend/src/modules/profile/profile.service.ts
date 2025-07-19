import { supabaseAdmin } from '../../config/database';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
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
  full_name?: string;
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
  // Données utilisateur de base
  profile: {
    id: string;
    name: string;
    email: string;
    credits: number;
    level: number;
    xp: number;
    avatar_url: string | null;
  };
  
  // Données pour l'AffiniaCard
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
  
  // Statut des fonctionnalités
  features: {
    hasStarterCard: boolean;
    hasMirror: boolean;
    mysteryCardsAvailable: number;
    nextCardAvailable: Date | null;
  };
}

class ProfileService {
  /**
   * Récupère un profil complet
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Profile service error:', error);
      throw error;
    }
  }

  /**
   * Met à jour un profil
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      // Valider les données
      const cleanUpdates = this.validateProfileUpdates(updates);

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
   * Récupère les données pour la carte Affinia
   */
  async getProfileCardData(userId: string): Promise<ProfileCard | null> {
    try {
      // Récupérer le profil
      const profile = await this.getProfile(userId);
      if (!profile) return null;

      // Récupérer la dernière réponse au questionnaire
      const { data: questionnaireData } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('profile_json, completed_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Compter le nombre de questionnaires
      const { count } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Construire les données de la carte
      const profileJson = questionnaireData?.profile_json as any || {};
      
      // Déterminer la rareté basée sur le score d'authenticité
      const authenticityScore = profileJson.authenticity_score || 0;
      const rarity = this.calculateRarity(authenticityScore, profile.level);

      return {
        userId,
        name: profile.full_name || 'Anonyme',
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
   * Récupère toutes les données nécessaires pour le dashboard
   * Optimisé pour une seule requête depuis le frontend
   */
  async getDashboardData(userId: string): Promise<DashboardData | null> {
    try {
      console.log(`Récupération des données dashboard pour l'utilisateur: ${userId}`);

      // 1. Récupérer le profil de base
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, avatar_url, credits, level, xp, age')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Profil récupéré:', profile);

      // 2. Récupérer les données du questionnaire pour l'AffiniaCard
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

      // 4. Vérifier les cartes (avec gestion d'erreur si table n'existe pas)
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

      // 5. Vérifier le miroir (avec gestion d'erreur si table n'existe pas)
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
          userName: answers.firstName || profile.full_name || 'Dresseur',
          age: answers.age || profile.age,
          profileJson: questionnaireData.profile_json,
          photos: photos || []
        };
      }

      const dashboardData: DashboardData = {
        profile: {
          id: profile.id,
          name: profile.full_name || profile.email.split('@')[0],
          email: profile.email,
          credits: profile.credits || 0, // ← Vraie valeur depuis la DB
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
   * Récupère les statistiques détaillées
   */
  async getProfileStats(userId: string): Promise<any> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) throw new Error('Profile not found');

      // Stats des questionnaires
      const { data: questionnaires } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('created_at, completed_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Calculer les stats
      const totalQuestionnaires = questionnaires?.length || 0;
      const lastQuestionnaireDate = questionnaires?.[0]?.created_at;
      
      // Temps moyen de complétion
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
          // À implémenter
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
   * Vérifie si un utilisateur peut voir un profil
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
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      level: profile.level,
      bio: profile.bio,
      location: profile.location,
      created_at: profile.created_at
      // On ne montre pas : email, credits, xp exact
    };
  }

  /**
   * Valide et nettoie les updates
   */
  private validateProfileUpdates(updates: ProfileUpdate): ProfileUpdate {
    const clean: ProfileUpdate = {};

    if (updates.full_name !== undefined) {
      clean.full_name = updates.full_name.trim().substring(0, 100);
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

  /**
   * Calcule la rareté basée sur plusieurs facteurs
   */
  private calculateRarity(
    authenticityScore: number, 
    level: number
  ): 'common' | 'rare' | 'epic' | 'legendary' {
    const combinedScore = (authenticityScore * 0.7) + (level * 3);

    if (combinedScore >= 90) return 'legendary';
    if (combinedScore >= 70) return 'epic';
    if (combinedScore >= 50) return 'rare';
    return 'common';
  }

  /**
   * Calcule l'XP nécessaire pour un niveau
   */
  private getXpForLevel(level: number): number {
    // Formule : 100 * level * (level + 1) / 2
    return 100 * level * (level + 1) / 2;
  }

  /**
   * Calcule le temps moyen de complétion
   */
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