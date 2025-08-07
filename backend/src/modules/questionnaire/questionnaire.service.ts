// backend/src/modules/questionnaire/questionnaire.service.ts
import { supabaseAdmin, createUserSupabase, UserSupabaseClient } from '../../config/database';
import { ProfileJson } from './chatgpt-parser.service';
import { generateAffiniaPromptV8Secure } from '../../../../shared/prompts/affinia-prompt';

// ✅ INTERFACE CORRIGÉE - Match Frontend Store
export interface QuestionnaireAnswers {
  // Step 0 - Identité
  firstName: string;
  age: number;
  gender: 'homme' | 'femme' | 'non-binaire' | 'autre';
  orientation: 'hétéro' | 'homo' | 'bi' | 'autre';

  // Step 1 - Psychologie
  energySource: 'solo_time' | 'social_energy' | 'balanced_mix';
  communicationStyle: 'direct_honest' | 'diplomatic_careful' | 'emotional_expressive' | 'reserved_thoughtful';

  // Step 2 - En amour
  lovePriority: 'emotional_connection' | 'mutual_respect' | 'shared_growth' | 'fun_complicity';
  conflictApproach: 'address_immediately' | 'cool_down_first' | 'avoid_when_possible' | 'seek_compromise';

  // Step 3 - Expression libre (optionnel)
  relationship_learning?: string;
  ideal_partner?: string;
  free_expression?: string;
}

export interface QuestionnaireResponse {
  id: string;
  user_id: string;
  answers: QuestionnaireAnswers;
  prompt_version: string;
  generated_prompt: string | null;
  generated_profile: string | null;
  profile_json: ProfileJson | null;
  completed_at: string;
  created_at: string;
}

class QuestionnaireService {
  /**
   * 🎯 Génère un prompt sécurisé (GARDE SANS RLS - pure logique)
   */
  async generatePrompt(
    answers: QuestionnaireAnswers,
    messageCount: number = 0,
    conversationDuration: number = 0
  ): Promise<{ prompt: string; sessionId: string }> {
    try {
      console.log('📊 Génération prompt - Données reçues:', {
        firstName: answers.firstName,
        age: answers.age,
        gender: answers.gender,
        energySource: answers.energySource,
        communicationStyle: answers.communicationStyle,
        lovePriority: answers.lovePriority,
        conflictApproach: answers.conflictApproach
      });

      const result = generateAffiniaPromptV8Secure(
        answers,
        messageCount,
        conversationDuration
      );

      console.log(`✅ Prompt généré pour ${answers.firstName} - SessionId: ${result.sessionId}`);

      return result;
    } catch (error) {
      console.error('❌ Erreur génération prompt:', error);
      throw new Error('Failed to generate prompt: ' + error.message);
    }
  }

  /**
   * ✅ CORRIGÉ - Soumet un nouveau questionnaire complet avec RLS
   */
  async submitQuestionnaire(
    userId: string,
    answers: QuestionnaireAnswers,
    generatedPrompt: string,
    userToken: string
  ): Promise<QuestionnaireResponse> {
    try {
      console.log('📝 Soumission questionnaire pour userId:', userId);
      const userSupabase = createUserSupabase(userToken);

      // Ajouter des XP pour la complétion (utilise supabaseAdmin car système)
      await this.addXpForCompletion(userId);

      const { data, error } = await userSupabase
        .from('questionnaire_responses')
        .insert({
          user_id: userId,
          answers,
          prompt_version: 'V8',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur insertion questionnaire:', error);
        throw error;
      }

      console.log('✅ Questionnaire sauvegardé:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Submit questionnaire error:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Met à jour avec le profil IA et le JSON parsé avec RLS
   */
  async updateWithAIProfile(
    responseId: string,
    generatedProfile: string,
    profileJson: ProfileJson,
    userToken: string
  ): Promise<QuestionnaireResponse> {
    try {
      console.log('🤖 Mise à jour profil IA pour response:', responseId);
      const userSupabase = createUserSupabase(userToken);

      const { data, error } = await userSupabase
        .from('questionnaire_responses')
        .update({
          generated_profile: generatedProfile,
          profile_json: profileJson,
          profile_updated_at: new Date().toISOString()
        })
        .eq('id', responseId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour profil IA:', error);
        throw error;
      }

      // Ajouter des XP bonus pour avoir complété le profil IA (utilise supabaseAdmin car système)
      if (data.user_id) {
        await this.addXpForAIProfile(data.user_id);
      }

      console.log('✅ Profil IA mis à jour avec succès');
      return data;
    } catch (error) {
      console.error('❌ Update with AI profile error:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère toutes les réponses d'un utilisateur avec RLS
   */
  async getUserResponses(userId: string, userToken: string): Promise<QuestionnaireResponse[]> {
    try {
      const userSupabase = createUserSupabase(userToken);
      
      const { data, error } = await userSupabase
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Get user responses error:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère la dernière réponse avec RLS
   */
  async getLatestResponse(userId: string, userToken: string): Promise<QuestionnaireResponse | null> {
    try {
      const userSupabase = createUserSupabase(userToken);
      
      const { data, error } = await userSupabase
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Get latest response error:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère une réponse spécifique avec RLS
   */
  async getResponse(responseId: string, userToken: string): Promise<QuestionnaireResponse | null> {
    try {
      const userSupabase = createUserSupabase(userToken);
      
      const { data, error } = await userSupabase
        .from('questionnaire_responses')
        .select('*')
        .eq('id', responseId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Get response error:', error);
      return null;
    }
  }

  /**
   * ✅ CORRIGÉ - Vérifie si l'utilisateur peut soumettre un nouveau questionnaire avec RLS
   */
  async canSubmitNewQuestionnaire(userId: string, userToken: string): Promise<boolean> {
    try {
      const latest = await this.getLatestResponse(userId, userToken);

      if (!latest) return true;

      // Limiter à 1 questionnaire par 24h
      const lastSubmission = new Date(latest.created_at);
      const now = new Date();
      const hoursSinceLastSubmission = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60);

      return true; // Pour l'instant on autorise toujours
    } catch (error) {
      console.error('Check can submit error:', error);
      return false;
    }
  }

  /**
   * ✅ CORRIGÉ - Vérifie si un utilisateur a complété le questionnaire avec RLS
   */
  async hasCompletedQuestionnaire(userId: string, userToken: string): Promise<boolean> {
    try {
      const userSupabase = createUserSupabase(userToken);
      
      const { count, error } = await userSupabase
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('Check questionnaire completion error:', error);
      return false;
    }
  }

  /**
   * 💎 GARDE ADMIN - Ajoute de l'XP pour la complétion du questionnaire (système)
   */
  private async addXpForCompletion(userId: string): Promise<void> {
    try {
      const XP_REWARD = 50;

      console.log(`🎯 Attribution ${XP_REWARD} XP pour complétion questionnaire - User: ${userId}`);

      // Utiliser supabaseAdmin car c'est une opération système
      const { error: rpcError } = await supabaseAdmin
        .rpc('add_user_xp', {
          user_id: userId,
          xp_amount: XP_REWARD
        });

      if (rpcError) {
        console.log('🔄 RPC add_user_xp non disponible, utilisation UPDATE direct');

        // Fallback : Update direct avec supabaseAdmin
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            xp: supabaseAdmin.raw(`xp + ${XP_REWARD}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Erreur attribution XP:', updateError);
        } else {
          console.log('✅ XP attribués avec succès');
        }
      } else {
        console.log('✅ XP attribués via RPC avec succès');
      }
    } catch (error) {
      console.error('❌ Exception attribution XP:', error);
      // Ne pas faire échouer la fonction principale pour une erreur XP
    }
  }

  /**
   * 💎 GARDE ADMIN - Ajoute de l'XP bonus pour le profil IA (système)
   */
  private async addXpForAIProfile(userId: string): Promise<void> {
    try {
      const XP_BONUS = 100;

      console.log(`🤖 Attribution ${XP_BONUS} XP bonus profil IA - User: ${userId}`);

      // Utiliser supabaseAdmin car c'est une opération système
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          xp: supabaseAdmin.raw(`xp + ${XP_BONUS}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erreur attribution XP bonus:', error);
      } else {
        console.log('✅ XP bonus attribués avec succès');
      }
    } catch (error) {
      console.error('❌ Exception attribution XP bonus:', error);
    }
  }
}

export const questionnaireService = new QuestionnaireService();