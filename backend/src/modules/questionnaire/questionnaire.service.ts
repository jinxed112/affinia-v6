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

// Interface pour la génération de prompt (compatible avec affinia-prompt.ts)
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

export interface QuestionnaireResponse {
  id: string;
  user_id: string;
  answers: QuestionnaireAnswers;
  prompt_version: string;
  generated_prompt: string | null;
  generated_profile: string | null;
  profile_json: ProfileJson | null;
  analysis_hash: string | null;
  analysis_timestamp: string | null;
  completed_at: string;
  created_at: string;
}

class QuestionnaireService {
/**
   * 🎯 MÉTHODE CORRIGÉE - Génère un prompt sécurisé
   */
  async generatePrompt(
    answers: any, // ← Accepter n'importe quelle interface
    messageCount: number = 0,
    conversationDuration: number = 0
  ): Promise<{ prompt: string; sessionId: string }> {
    try {
      // ✅ SOLUTION SIMPLE : Les données frontend sont déjà dans le bon format !
      // Pas besoin de transformation, on utilise directement les données
      console.log('📊 Données reçues:', answers);
      
      // Générer le prompt sécurisé directement
      const result = generateAffiniaPromptV8Secure(
        answers, // ← Utiliser les données telles quelles
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
   * Transforme les données du questionnaire pour le générateur de prompt
   */
  private transformAnswersForPrompt(answers: QuestionnaireAnswers): PromptQuestionnaireAnswers {
    return {
      firstName: answers.firstName,
      age: answers.age,
      gender: 'non-spécifié', // TODO: Ajouter gender dans le questionnaire
      orientation: this.mapRelationshipGoalToOrientation(answers.relationshipGoal),
      energySource: this.mapEnergyToEnergySource(answers.energy),
      communicationStyle: this.mapCommunicationToStyle(answers.communication),
      lovePriority: this.mapValuesToLovePriority(answers.values),
      conflictApproach: this.mapConflictToApproach(answers.conflict),
      relationship_learning: answers.relationship_learning,
      ideal_partner: answers.ideal_partner,
      free_expression: answers.free_expression
    };
  }

  /**
   * Mappings des données
   */
  private mapEnergyToEnergySource(energy: string): string {
    const mapping = {
      'introverted': 'solo_time',
      'extroverted': 'social_energy',
      'ambivert': 'balanced_mix'
    };
    return mapping[energy as keyof typeof mapping] || 'balanced_mix';
  }

  private mapCommunicationToStyle(communication: string): string {
    const mapping = {
      'words': 'emotional_expressive',
      'actions': 'direct_honest',
      'touch': 'emotional_expressive',
      'time': 'reserved_thoughtful',
      'gifts': 'diplomatic_careful'
    };
    return mapping[communication as keyof typeof mapping] || 'direct_honest';
  }

  private mapConflictToApproach(conflict: string): string {
    const mapping = {
      'discuss': 'address_immediately',
      'space': 'cool_down_first',
      'humor': 'avoid_when_possible',
      'mediator': 'seek_compromise'
    };
    return mapping[conflict as keyof typeof mapping] || 'seek_compromise';
  }

  private mapRelationshipGoalToOrientation(goal: string): string {
    const mapping = {
      'casual': 'relation décontractée',
      'serious': 'relation sérieuse',
      'friendship': 'amitié',
      'open': 'relation ouverte'
    };
    return mapping[goal as keyof typeof mapping] || 'relation sérieuse';
  }

  private mapValuesToLovePriority(values: string[]): string {
    // Logique simple : prendre la première valeur ou une valeur par défaut
    if (values.includes('emotional_connection') || values.includes('connexion')) {
      return 'emotional_connection';
    }
    if (values.includes('respect') || values.includes('confiance')) {
      return 'mutual_respect';
    }
    if (values.includes('growth') || values.includes('évolution')) {
      return 'shared_growth';
    }
    return 'fun_complicity'; // Par défaut
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
   * Soumet un nouveau questionnaire
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
   * Met à jour avec le profil IA
   */
  async updateWithAIProfile(
    responseId: string,
    generatedProfile: string,
    profileJson: ProfileJson
  ): Promise<QuestionnaireResponse> {
    try {
      // Générer un hash pour l'analyse
      const analysisHash = await this.generateAnalysisHash(profileJson);

      const { data, error } = await supabaseAdmin
        .from('questionnaire_responses')
        .update({
          generated_profile: generatedProfile,
          profile_json: profileJson,
          analysis_hash: analysisHash,
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

  /**
   * Génère un hash pour l'analyse
   */
  private async generateAnalysisHash(profileJson: ProfileJson): Promise<string> {
    // Simple hash basé sur le timestamp et quelques données
    const data = JSON.stringify({
      timestamp: Date.now(),
      score: profileJson.authenticity_score,
      style: profileJson.attachment_style
    });

    // Convertir en base64 (dans un vrai projet, utiliser crypto)
    return Buffer.from(data).toString('base64').substring(0, 16);
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
}

export const questionnaireService = new QuestionnaireService();