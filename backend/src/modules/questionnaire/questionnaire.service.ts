// backend/src/modules/questionnaire/questionnaire.service.ts - VERSION SÉCURISÉE
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
   * ✅ SÉCURISÉ - Soumet un nouveau questionnaire avec validation token
   */
  async submitQuestionnaire(
    userId: string,
    answers: QuestionnaireAnswers,
    generatedPrompt: string,
    userToken: string
  ): Promise<QuestionnaireResponse> {
    try {
      console.log('📝 Soumission questionnaire pour userId:', userId);

      // 🔒 VALIDATION TOKEN OBLIGATOIRE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        throw new Error('Token invalide ou UserID mismatch');
      }

      console.log('✅ Token validé pour soumission questionnaire:', user.email);

      // Ajouter des XP pour la complétion (avant insertion pour éviter erreurs)
      await this.addXpForCompletion(userId);

      // 🔒 SÉCURISÉ : Utiliser supabaseAdmin avec WHERE explicite après validation token
      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .insert({
          user_id: userId, // ✅ Vérifié via token
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
   * ✅ SÉCURISÉ - Met à jour avec le profil IA avec validation token
   */
  async updateWithAIProfile(
    responseId: string,
    generatedProfile: string,
    profileJson: ProfileJson,
    userToken: string
  ): Promise<QuestionnaireResponse> {
    try {
      console.log('🤖 Mise à jour profil IA pour response:', responseId);

      // 🔒 VALIDATION TOKEN OBLIGATOIRE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user) {
        throw new Error('Token invalide');
      }

      // Vérifier que la réponse appartient à l'utilisateur
      const { data: existingResponse, error: checkError } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('user_id')
        .eq('id', responseId)
        .single();

      if (checkError || !existingResponse || existingResponse.user_id !== user.id) {
        throw new Error('Accès non autorisé à cette réponse');
      }

      console.log('✅ Token et ownership validés pour mise à jour IA');

      // 🔒 SÉCURISÉ : Update avec WHERE sur responseId ET user_id
      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .update({
          generated_profile: generatedProfile,
          profile_json: profileJson,
          profile_updated_at: new Date().toISOString()
        })
        .eq('id', responseId)
        .eq('user_id', user.id) // ✅ Double sécurité
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour profil IA:', error);
        throw error;
      }

      // Ajouter des XP bonus pour avoir complété le profil IA
      await this.addXpForAIProfile(user.id);

      console.log('✅ Profil IA mis à jour avec succès');
      return data;
    } catch (error) {
      console.error('❌ Update with AI profile error:', error);
      throw error;
    }
  }

  /**
   * ✅ SÉCURISÉ - Récupère toutes les réponses d'un utilisateur avec validation token
   */
  async getUserResponses(userId: string, userToken: string): Promise<QuestionnaireResponse[]> {
    try {
      // 🔒 VALIDATION TOKEN OBLIGATOIRE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        throw new Error('Token invalide ou UserID mismatch');
      }

      // 🔒 SÉCURISÉ : supabaseAdmin avec WHERE explicite après validation
      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', userId) // ✅ Vérifié via token
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Get user responses error:', error);
      throw error;
    }
  }

  /**
   * ✅ SÉCURISÉ - Récupère la dernière réponse avec validation token
   */
  async getLatestResponse(userId: string, userToken: string): Promise<QuestionnaireResponse | null> {
    try {
      // 🔒 VALIDATION TOKEN OBLIGATOIRE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token validation failed for getLatestResponse');
        return null;
      }

      console.log('✅ Token validated for getLatestResponse:', user.email);

      // 🔒 SÉCURISÉ : supabaseAdmin avec WHERE explicite après validation
      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', userId) // ✅ Vérifié via token
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // ✅ maybeSingle() pour éviter erreur si pas de résultat

      if (error) {
        console.error('❌ Questionnaire query error:', error);
        throw error;
      }

      console.log('✅ Latest questionnaire:', data ? 'Trouvé' : 'Aucun');
      return data; // Retourne null si pas de questionnaire (normal)

    } catch (error) {
      console.error('💥 Get latest response error:', error);
      throw error;
    }
  }

  /**
   * ✅ SÉCURISÉ - Récupère une réponse spécifique avec validation token
   */
  async getResponse(responseId: string, userToken: string): Promise<QuestionnaireResponse | null> {
    try {
      // 🔒 VALIDATION TOKEN OBLIGATOIRE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user) {
        throw new Error('Token invalide');
      }

      // 🔒 SÉCURISÉ : supabaseAdmin avec WHERE sur responseId ET user_id
      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*')
        .eq('id', responseId)
        .eq('user_id', user.id) // ✅ Double sécurité
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Get response error:', error);
      return null;
    }
  }

  /**
   * ✅ SÉCURISÉ - Vérifie si l'utilisateur peut soumettre un nouveau questionnaire
   */
  async canSubmitNewQuestionnaire(userId: string, userToken: string): Promise<boolean> {
    try {
      const latest = await this.getLatestResponse(userId, userToken);

      if (!latest) return true;

      // Limiter à 1 questionnaire par 24h (optionnel)
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
   * ✅ SÉCURISÉ - Vérifie si un utilisateur a complété le questionnaire
   */
  async hasCompletedQuestionnaire(userId: string, userToken: string): Promise<boolean> {
    try {
      // 🔒 VALIDATION TOKEN OBLIGATOIRE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        return false;
      }

      // 🔒 SÉCURISÉ : supabaseAdmin avec WHERE explicite après validation
      const { count, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId); // ✅ Vérifié via token

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('Check questionnaire completion error:', error);
      return false;
    }
  }

  /**
   * 💎 CORRIGÉ - Ajoute de l'XP pour la complétion du questionnaire (système)
   */
  private async addXpForCompletion(userId: string): Promise<void> {
    try {
      const XP_REWARD = 50;

      console.log(`🎯 Attribution ${XP_REWARD} XP pour complétion questionnaire - User: ${userId}`);

      // VERSION SIMPLE ET SÛRE : Récupérer XP actuel puis mettre à jour
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();

      if (!profile) {
        console.error('❌ Profil non trouvé pour attribution XP');
        return;
      }

      const currentXp = profile.xp || 0;
      const newXp = currentXp + XP_REWARD;
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          xp: newXp,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erreur attribution XP:', error);
      } else {
        console.log(`✅ XP attribués : ${currentXp} → ${newXp}`);
      }
    } catch (error) {
      console.error('❌ Exception attribution XP:', error);
      // Ne pas faire échouer la fonction principale pour une erreur XP
    }
  }

  /**
   * 💎 CORRIGÉ - Ajoute de l'XP bonus pour le profil IA (système)
   */
  private async addXpForAIProfile(userId: string): Promise<void> {
    try {
      const XP_BONUS = 100;

      console.log(`🤖 Attribution ${XP_BONUS} XP bonus profil IA - User: ${userId}`);

      // VERSION SIMPLE ET SÛRE : Récupérer XP actuel puis mettre à jour
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();

      if (!profile) {
        console.error('❌ Profil non trouvé pour attribution XP bonus');
        return;
      }

      const currentXp = profile.xp || 0;
      const newXp = currentXp + XP_BONUS;
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          xp: newXp,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erreur attribution XP bonus:', error);
      } else {
        console.log(`✅ XP bonus attribués : ${currentXp} → ${newXp}`);
      }
    } catch (error) {
      console.error('❌ Exception attribution XP bonus:', error);
    }
  }
}

export const questionnaireService = new QuestionnaireService();