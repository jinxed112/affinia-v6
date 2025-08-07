import { z } from 'zod';

// Schema de validation pour le profil JSON
const ProfileJsonSchema = z.object({
  authenticity_score: z.number().min(0).max(100),
  attachment_style: z.string().optional(),
  strength_signals: z.array(z.string()).max(10),
  weakness_signals: z.array(z.string()).max(10),
  unconscious_patterns: z.array(z.string()).max(10),
  ideal_partner_traits: z.array(z.string()).max(10),
  mirroring_warning: z.string().max(500),
  emotional_wounds: z.array(z.string()).optional(),
  defensive_mechanisms: z.array(z.string()).optional(),
  love_language: z.enum(['words', 'acts', 'gifts', 'time', 'touch']).optional(),
  compatibility_factors: z.object({
    must_have: z.array(z.string()),
    nice_to_have: z.array(z.string()),
    deal_breakers: z.array(z.string())
  }).optional()
});

export type ProfileJson = z.infer<typeof ProfileJsonSchema>;

export class ChatGPTParserService {
  /**
   * Parse la réponse ChatGPT et extrait le JSON structuré
   */
  parseResponse(chatGPTResponse: string): {
    profileText: string;
    profileJson: ProfileJson;
  } {
    try {
      // 1. Extraire le texte du profil (avant le JSON)
      const jsonStartIndex = chatGPTResponse.indexOf('```json');
      const profileText = jsonStartIndex > -1 
        ? chatGPTResponse.substring(0, jsonStartIndex).trim()
        : chatGPTResponse;

      // 2. Extraire le JSON
      const jsonMatch = chatGPTResponse.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('No JSON found in ChatGPT response');
      }

      // 3. Parser et valider le JSON
      const rawJson = JSON.parse(jsonMatch[1]);
      const validatedJson = ProfileJsonSchema.parse(rawJson);

      // 4. Vérifier la cohérence des données
      this.validateDataIntegrity(validatedJson);

      return {
        profileText: this.sanitizeProfileText(profileText),
        profileJson: validatedJson
      };
    } catch (error) {
      console.error('ChatGPT parsing error:', error);
      
      if (error instanceof z.ZodError) {
        const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Invalid JSON structure: ${issues}`);
      }
      
      throw new Error(`Failed to parse ChatGPT response: ${error.message}`);
    }
  }

  /**
   * Détecte les tentatives de manipulation
   */
  private validateDataIntegrity(data: ProfileJson): void {
    // Score trop élevé = suspect
    if (data.authenticity_score > 95) {
      throw new Error('Suspiciously high authenticity score detected');
    }

    // Trop de forces sans faiblesses = suspect
    if (data.strength_signals.length > 8 && data.weakness_signals.length < 2) {
      throw new Error('Unrealistic balance between strengths and weaknesses');
    }

    // Vérifier que les arrays ne sont pas vides
    if (data.strength_signals.length === 0 || data.weakness_signals.length === 0) {
      throw new Error('Missing essential personality traits');
    }

    // Vérifier la longueur des textes
    if (data.mirroring_warning.length < 20) {
      throw new Error('Mirroring warning is too short');
    }
  }

  /**
   * Nettoie et normalise le texte du profil
   */
  sanitizeProfileText(text: string): string {
    return text
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Max 2 lignes vides
      .replace(/\*{3,}/g, '***') // Limiter les astérisques
      .substring(0, 5000); // Limite à 5000 caractères
  }
}

export const chatGPTParser = new ChatGPTParserService();