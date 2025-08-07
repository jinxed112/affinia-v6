import { QuestionnaireAnswers } from '../stores/questionnaireStore';
import { authManager } from './authManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class QuestionnaireService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/questionnaire${endpoint}`, {
        headers: { ...headers, ...options.headers },
        ...options,
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || `Erreur HTTP ${response.status}` };
      }

      return { success: true, data: data.data || data, message: data.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erreur réseau' };
    }
  }

  async generatePrompt(answers: QuestionnaireAnswers, messageCount: number = 0, conversationDuration: number = 0) {
    return this.apiCall('/generate-prompt', { 
      method: 'POST', 
      body: JSON.stringify({ answers, messageCount, conversationDuration }) 
    });
  }

  async verifyProfile(sessionId: string, profileText: string, userId: string) {
    return this.apiCall('/verify-profile', { 
      method: 'POST', 
      body: JSON.stringify({ sessionId, profileText, userId }) 
    });
  }

  async submitQuestionnaire(answers: QuestionnaireAnswers, generatedPrompt: string) {
    return this.apiCall('/submit', { 
      method: 'POST', 
      body: JSON.stringify({ answers, generatedPrompt }) 
    });
  }

  async getLatestResponse() { 
    return this.apiCall('/latest'); 
  }

  async getMyResponses() { 
    return this.apiCall('/my-responses'); 
  }
}

export const questionnaireService = new QuestionnaireService();
export default questionnaireService;
