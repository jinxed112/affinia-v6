// src/modules/questionnaire/questionnaire.service.ts
import { supabaseAdmin } from '../../config/database';
import { ProfileJson } from './chatgpt-parser.service';
import { generateAffiniaPromptV8Secure } from '../../../../shared/prompts/affinia-prompt';

export interface QuestionnaireAnswers {
  // Step 0 - Identité
  firstName: string;
  age: number;
  location: string;
  
  // Step 1 - Psychologie
  energy: 'introverted' | 'extroverted' | 'ambivert';
  communication: 'words' | 'actions' | 'touch' | 'time' | 'gifts';
  conflict: 'discuss' | 'space' | 'humor' | 'mediator';
  values: string[];
  
  // Step 2 - Préférences & Lifestyle
  interests: string[];
  dealBreakers: string[];
  lifestyle: 'spontaneous' | 'planned' | 'balanced';
  relationshipGoal: 'casual' | 'serious' | 'friendship' | 'open';
  
  // Step 3 - Optionnel
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

// Interface pour la génération de prompt
interface PromptQuestionnaireAnswers {
  firstName: string;
  age: number;
  gender: string;
  orientation: string;
  energySource: string;
  communicationStyle: string;
  lovePriority: string;
  conflictApproach: string;
  relationship_learning?: string;
  ideal_partner?: string;
  free_expression?: string;
}

class QuestionnaireService {
  /**
   * Génère un prompt sécurisé
   */
  async generatePrompt(
    answers: any,
    messageCount: number = 0,
    conversationDuration: number = 0
  ): Promise<{ prompt: string; sessionId: string }> {
    try {
      console.log('📊 Données reçues:', answers);
      
      const result = generateAffiniaPromptV8Secure(
        answers,
        messageCount,
        conversationDuration
      );
      
      console.log(`✅ Prompt généré pour ${answers.firstName} - SessionId: ${result.sessionId}`);
      
      return result;
    } catch (error) {
      console.error('Erreur génération prompt:', error);
      throw new Error('Failed to generate prompt');
    }
  }

  /**
   * Sauvegarde les réponses du questionnaire
   */
  async saveResponses(
    userId: string,
    answers: QuestionnaireAnswers
  ): Promise<{ success: boolean; data?: QuestionnaireResponse; error?: string }> {
    try {
      // Ajouter des XP pour la complétion
      await this.addXpForCompletion(userId);

      const { data, error } = await supabaseAdmin
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
        console.error('Erreur sauvegarde réponses:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception sauvegarde réponses:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Sauvegarde le profil généré par l'IA
   */
  async saveProfile(
    responseId: string,
    generatedProfile: string
  ): Promise<{ success: boolean; data?: QuestionnaireResponse; error?: string }> {
    try {
      // Validation basique
      if (!generatedProfile.trim() || generatedProfile.trim().length < 10) {
        return { success: false, error: 'Profil invalide ou trop court' };
      }

      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .update({
          generated_profile: generatedProfile.trim(),
          analysis_timestamp: new Date().toISOString()
        })
        .eq('id', responseId)
        .select()
        .single();

      if (error) {
        console.error('Erreur sauvegarde profil:', error);
        return { success: false, error: error.message };
      }

      // Ajouter des XP bonus pour avoir complété le profil IA
      const response = await this.getResponse(responseId);
      if (response) {
        await this.addXpForAIProfile(response.user_id);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception sauvegarde profil:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Met à jour avec le profil IA et le JSON parsé
   */
  async updateWithAIProfile(
    responseId: string,
    generatedProfile: string,
    profileJson: ProfileJson
  ): Promise<QuestionnaireResponse> {
    try {
      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .update({
          generated_profile: generatedProfile,
          profile_json: profileJson,
          analysis_timestamp: new Date().toISOString()
        })
        .eq('id', responseId)
        .select()
        .single();

      if (error) throw error;

      // Ajouter des XP bonus pour avoir complété le profil IA
      const response = await this.getResponse(responseId);
      if (response) {
        await this.addXpForAIProfile(response.user_id);
      }

      return data;
    } catch (error) {
      console.error('Update with AI profile error:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les réponses d'un utilisateur
   */
  async getUserResponses(userId: string): Promise<QuestionnaireResponse[]> {
    try {
      const { data, error } = await supabaseAdmin
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
   * Récupère la dernière réponse
   */
  async getLatestResponse(userId: string): Promise<QuestionnaireResponse | null> {
    try {
      const { data, error } = await supabaseAdmin
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
   * Récupère une réponse spécifique
   */
  async getResponse(responseId: string): Promise<QuestionnaireResponse | null> {
    try {
      const { data, error } = await supabaseAdmin
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
   * Soumet un nouveau questionnaire complet
   */
  async submitQuestionnaire(
    userId: string,
    answers: QuestionnaireAnswers,
    generatedPrompt: string
  ): Promise<QuestionnaireResponse> {
    try {
      // Ajouter des XP pour la complétion
      await this.addXpForCompletion(userId);

      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .insert({
          user_id: userId,
          answers,
          generated_prompt: generatedPrompt,
          prompt_version: 'V8',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Submit questionnaire error:', error);
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur peut soumettre un nouveau questionnaire
   */
  async canSubmitNewQuestionnaire(userId: string): Promise<boolean> {
    try {
      const latest = await this.getLatestResponse(userId);

      if (!latest) return true;

      // Limiter à 1 questionnaire par 24h
      const lastSubmission = new Date(latest.created_at);
      const now = new Date();
      const hoursSinceLastSubmission = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastSubmission >= 24;
    } catch (error) {
      console.error('Check can submit error:', error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a complété le questionnaire
   */
  async hasCompletedQuestionnaire(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabaseAdmin
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
   * Ajoute de l'XP pour la complétion du questionnaire
   */
  private async addXpForCompletion(userId: string): Promise<void> {
    try {
      const XP_REWARD = 50;

      const { error } = await supabaseAdmin
        .rpc('add_user_xp', {
          user_id: userId,
          xp_amount: XP_REWARD
        });

      if (error) {
        // Si la fonction RPC n'existe pas, faire une update simple
        await supabaseAdmin
          .from('profiles')
          .update({ 
            xp: supabaseAdmin.raw(`xp + ${XP_REWARD}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Add XP error:', error);
    }
  }

  /**
   * Ajoute de l'XP bonus pour le profil IA
   */
  private async addXpForAIProfile(userId: string): Promise<void> {
    try {
      const XP_BONUS = 100;

      await supabaseAdmin
        .from('profiles')
        .update({ 
          xp: supabaseAdmin.raw(`xp + ${XP_BONUS}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Add XP bonus error:', error);
    }
  }
}

export const questionnaireService = new QuestionnaireService();