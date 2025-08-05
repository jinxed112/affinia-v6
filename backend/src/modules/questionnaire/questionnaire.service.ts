// src/modules/questionnaire/questionnaire.service.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/environment';

export class QuestionnaireService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_KEY
    );
  }

  async getQuestionnaireResponse(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting questionnaire response:', error);
      throw error;
    }
  }

  async saveQuestionnaireResponse(userId: string, answers: any, profileJson: any) {
    try {
      const { data, error } = await this.supabase
        .from('questionnaire_responses')  
        .upsert({
          user_id: userId,
          answers,
          profile_json: profileJson,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving questionnaire response:', error);
      throw error;
    }
  }

  async generateProfile(answers: any) {
    // Logique de génération de profil IA
    return {
      generated_profile: 'Profile généré basé sur les réponses...',
      profile_json: {
        authenticity_score: 7,
        attachment_style: 'secure',
        strength_signals: ['Communication claire', 'Empathie'],
        weakness_signals: [],
        unconscious_patterns: [],
        ideal_partner_traits: [],
        reliability_score: 0.8
      }
    };
  }
}

// Export par défaut pour compatibilité
export default QuestionnaireService;