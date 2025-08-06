// frontend/src/services/questionnaireService.ts
import { QuestionnaireAnswers } from '../stores/questionnaireStore';

const API_BASE = '/api/questionnaire';

// Interface pour les réponses API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface GeneratePromptResponse {
  prompt: string;
  sessionId: string;
  generatedAt: string;
  userId: string;
}

interface QuestionnaireResponse {
  id: string;
  user_id: string;
  answers: QuestionnaireAnswers;
  generated_prompt: string | null;
  generated_profile: string | null;
  profile_json: any | null;
  completed_at: string;
  created_at: string;
}

class QuestionnaireService {
  private async apiCall<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'API Error',
          data: data
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * 🎯 Génère un prompt sécurisé via le backend
   */
  async generatePrompt(
    answers: QuestionnaireAnswers,
    messageCount: number = 0,
    conversationDuration: number = 0
  ): Promise<ApiResponse<GeneratePromptResponse>> {
    console.log('🎯 Génération prompt via backend Express');
    
    return this.apiCall<GeneratePromptResponse>('/generate-prompt', {
      method: 'POST',
      body: JSON.stringify({
        answers,
        messageCount,
        conversationDuration
      })
    });
  }

  /**
   * 🔍 Vérifie l'intégrité d'un profil IA
   */
  async verifyProfile(
    sessionId: string,
    profileText: string,
    userId: string
  ): Promise<ApiResponse<{ valid: boolean; message: string }>> {
    console.log('🔍 Vérification profil via backend Express');
    
    return this.apiCall('/verify-profile', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        profileText,
        userId
      })
    });
  }

  /**
   * 📝 Soumet un questionnaire complet
   */
  async submitQuestionnaire(
    answers: QuestionnaireAnswers,
    generatedPrompt: string
  ): Promise<ApiResponse<QuestionnaireResponse>> {
    console.log('📝 Soumission questionnaire via backend Express');
    
    return this.apiCall<QuestionnaireResponse>('/submit', {
      method: 'POST',
      body: JSON.stringify({
        answers,
        generatedPrompt
      })
    });
  }

  /**
   * 🤖 Parse la réponse de ChatGPT/Claude
   */
  async parseAIResponse(
    chatGPTResponse: string
  ): Promise<ApiResponse<{ profileText: string; profileJson: any }>> {
    console.log('🤖 Parsing réponse IA via backend Express');
    
    return this.apiCall('/parse-ai', {
      method: 'POST',
      body: JSON.stringify({
        chatGPTResponse
      })
    });
  }

  /**
   * 💾 Met à jour avec profil IA
   */
  async updateWithAIProfile(
    responseId: string,
    chatGPTResponse: string
  ): Promise<ApiResponse<QuestionnaireResponse>> {
    console.log('💾 Mise à jour profil IA via backend Express');
    
    return this.apiCall<QuestionnaireResponse>(`/${responseId}/ai-profile`, {
      method: 'PUT',
      body: JSON.stringify({
        chatGPTResponse
      })
    });
  }

  /**
   * 📊 Récupère mes réponses
   */
  async getMyResponses(): Promise<ApiResponse<{ total: number; responses: QuestionnaireResponse[] }>> {
    return this.apiCall('/my-responses');
  }

  /**
   * 📄 Récupère la dernière réponse
   */
  async getLatestResponse(): Promise<ApiResponse<QuestionnaireResponse | null>> {
    return this.apiCall('/latest');
  }

  /**
   * 📋 Récupère une réponse spécifique
   */
  async getResponse(responseId: string): Promise<ApiResponse<QuestionnaireResponse>> {
    return this.apiCall(`/${responseId}`);
  }

  /**
   * 📜 Récupère le prompt généré
   */
  async getGeneratedPrompt(responseId: string): Promise<ApiResponse<{ prompt: string; createdAt: string }>> {
    return this.apiCall(`/${responseId}/prompt`);
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Vérifie si l'utilisateur peut soumettre un nouveau questionnaire
   */
  async canSubmit(): Promise<boolean> {
    const result = await this.getLatestResponse();
    if (!result.success || !result.data) return true;

    const lastSubmission = new Date(result.data.created_at);
    const now = new Date();
    const hoursSince = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60);
    
    return hoursSince >= 24;
  }

  /**
   * Vérifie si l'utilisateur a complété le questionnaire
   */
  async hasCompleted(): Promise<boolean> {
    const result = await this.getLatestResponse();
    return result.success && !!result.data;
  }

  /**
   * Vérifie si l'utilisateur a un profil IA généré
   */
  async hasGeneratedProfile(): Promise<boolean> {
    const result = await this.getLatestResponse();
    return result.success && !!result.data?.generated_profile;
  }
}

// Export singleton
export const questionnaireService = new QuestionnaireService();
export default questionnaireService;