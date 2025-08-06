import { QuestionnaireAnswers } from '../stores/questionnaireStore';

const getApiBase = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api/questionnaire';
  }
  return 'https://votre-backend-deploye.com/api/questionnaire';
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class QuestionnaireService {
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Réponse non-JSON reçue: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || data.message || `Erreur HTTP ${response.status}`, data: data };
      }

      return { success: true, data: data.data || data, message: data.message };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: 'Impossible de contacter le serveur. Vérifiez que le backend tourne sur localhost:3001' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Erreur réseau inconnue' };
    }
  }

  async generatePrompt(answers: QuestionnaireAnswers, messageCount: number = 0, conversationDuration: number = 0) {
    return this.apiCall('/generate-prompt', { method: 'POST', body: JSON.stringify({ answers, messageCount, conversationDuration }) });
  }

  async verifyProfile(sessionId: string, profileText: string, userId: string) {
    return this.apiCall('/verify-profile', { method: 'POST', body: JSON.stringify({ sessionId, profileText, userId }) });
  }

  async submitQuestionnaire(answers: QuestionnaireAnswers, generatedPrompt: string) {
    return this.apiCall('/submit', { method: 'POST', body: JSON.stringify({ answers, generatedPrompt }) });
  }

  async updateWithAIProfile(responseId: string, chatGPTResponse: string) {
    return this.apiCall(`/${responseId}/ai-profile`, { method: 'PUT', body: JSON.stringify({ chatGPTResponse }) });
  }

  async getMyResponses() { return this.apiCall('/my-responses'); }
  async getLatestResponse() { return this.apiCall('/latest'); }
}

export const questionnaireService = new QuestionnaireService();
export default questionnaireService;
