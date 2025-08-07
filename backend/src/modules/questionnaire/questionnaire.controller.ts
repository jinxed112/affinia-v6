// backend/src/modules/questionnaire/questionnaire.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { questionnaireService } from './questionnaire.service';
import { chatGPTParser } from './chatgpt-parser.service';
import { validationResult } from 'express-validator';

/**
 * 🛠️ Helper pour nettoyer le JSON dupliqué de ChatGPT (Version Spécifique)
 */
function cleanDuplicatedJsonFields(jsonString: string): string {
  try {
    // Première tentative : parser directement
    JSON.parse(jsonString);
    return jsonString; // Si ça marche, pas besoin de nettoyer
  } catch (originalError) {
    console.log('🔧 JSON nécessite un nettoyage, erreur:', originalError.message);

    let cleaned = jsonString.trim();

    // 1. Isoler le premier objet JSON complet
    let braceCount = 0;
    let firstJsonEnd = -1;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          firstJsonEnd = i;
          break;
        }
      }
    }

    if (firstJsonEnd > -1) {
      cleaned = cleaned.substring(0, firstJsonEnd + 1);
    }

    // 2. Pattern spécifique ChatGPT : supprimer les champs après "mirroring_warning"
    const mirroringWarningMatch = cleaned.match(/"mirroring_warning":\s*"[^"]*"/);
    if (mirroringWarningMatch) {
      const mirroringEnd = mirroringWarningMatch.index + mirroringWarningMatch[0].length;

      // Chercher la prochaine virgule puis les champs dupliqués
      const afterMirroring = cleaned.substring(mirroringEnd);
      const duplicateFieldsPattern = /,\s*"(intellectual_indicators|emotional_regulation_signs|social_behavior_patterns|motivational_clues|authenticity_markers)"/;

      if (duplicateFieldsPattern.test(afterMirroring)) {
        // Tronquer juste après mirroring_warning et fermer l'objet proprement
        cleaned = cleaned.substring(0, mirroringEnd) + '\n}';
        console.log('✂️ Champs dupliqués supprimés après mirroring_warning');
      }
    }

    // 3. Nettoyer les virgules en trop
    cleaned = cleaned.replace(/,(\s*})/g, '$1'); // Virgule avant }
    cleaned = cleaned.replace(/,(\s*])/g, '$1'); // Virgule avant ]

    // 4. Vérifier que le JSON nettoyé est valide
    try {
      const parsed = JSON.parse(cleaned);
      console.log('✅ JSON nettoyé avec succès');
      return cleaned;
    } catch (cleanedError) {
      console.log('❌ JSON toujours invalide après nettoyage:', cleanedError.message);

      // 5. Dernière tentative : supprimer tout ce qui est après trait_observations
      const traitObsMatch = cleaned.match(/"trait_observations":\s*{[^}]*}/);
      if (traitObsMatch) {
        const traitObsEnd = traitObsMatch.index + traitObsMatch[0].length;
        const beforeTraitObs = cleaned.substring(0, traitObsEnd);

        // Ajouter les champs manquants minimaux et fermer
        const minimalEnd = `,
  "relationnal_risks": [],
  "ideal_partner_traits": [],
  "mirroring_warning": "Données partiellement récupérées"
}`;
        const fallbackJson = beforeTraitObs + minimalEnd;

        try {
          JSON.parse(fallbackJson);
          console.log('🔄 JSON de secours créé');
          return fallbackJson;
        } catch {
          // Dernier recours : JSON minimal
          const emergency = {
            reliability_score: 0.5,
            authenticity_score: 5,
            message_count: 0,
            bias_warning: null,
            strength_signals: ["Données extraites partiellement"],
            weakness_signals: ["JSON invalide récupéré"],
            cognitive_signals: {},
            affective_indicators: {},
            unconscious_patterns: {},
            trait_observations: {},
            relationnal_risks: [],
            ideal_partner_traits: [],
            mirroring_warning: "JSON de sécurité"
          };

          console.log('🆘 JSON d\'urgence utilisé');
          return JSON.stringify(emergency, null, 2);
        }
      }

      return JSON.stringify({ error: "JSON parsing failed" }, null, 2);
    }
  }
}

class QuestionnaireController {
  /**
   * 🎯 NOUVELLE MÉTHODE - Génère un prompt sécurisé
   */
  async generatePrompt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { answers, messageCount, conversationDuration } = req.body;
      const userId = req.user!.id;

      console.log(`🎯 Génération prompt pour ${answers.firstName} (user: ${userId})`);

      // Générer le prompt sécurisé
      const result = await questionnaireService.generatePrompt(
        answers,
        messageCount || 0,
        conversationDuration || 0
      );

      res.json({
        success: true,
        data: {
          prompt: result.prompt,
          sessionId: result.sessionId,
          generatedAt: new Date().toISOString(),
          userId
        }
      });

    } catch (error) {
      console.error('❌ Erreur génération prompt:', error);
      res.status(500).json({
        error: 'Erreur lors de la génération du prompt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère toutes les réponses de l'utilisateur
   */
  async getMyResponses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const responses = await questionnaireService.getUserResponses(userId, req.userToken!);

      res.json({
        total: responses.length,
        responses
      });
    } catch (error) {
      console.error('Get my responses error:', error);
      res.status(500).json({ error: 'Failed to get questionnaire responses' });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère la dernière réponse
   */
  async getLatestResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const response = await questionnaireService.getLatestResponse(userId, req.userToken!);

      if (!response) {
        res.status(404).json({ error: 'No questionnaire response found' });
        return;
      }

      res.json(response);
    } catch (error) {
      console.error('Get latest response error:', error);
      res.status(500).json({ error: 'Failed to get latest response' });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère une réponse spécifique
   */
  async getResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { responseId } = req.params;
      const userId = req.user!.id;

      const response = await questionnaireService.getResponse(responseId, req.userToken!);

      if (!response) {
        res.status(404).json({ error: 'Response not found' });
        return;
      }

      // Vérifier que la réponse appartient à l'utilisateur
      if (response.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(response);
    } catch (error) {
      console.error('Get response error:', error);
      res.status(500).json({ error: 'Failed to get response' });
    }
  }

  /**
   * ✅ CORRIGÉ - Soumet un nouveau questionnaire
   */
  async submitQuestionnaire(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.id;
      const { answers, generatedPrompt } = req.body;

      // Vérifier si l'utilisateur n'a pas déjà soumis récemment (anti-spam)
      const canSubmit = await questionnaireService.canSubmitNewQuestionnaire(userId, req.userToken!);
      if (!canSubmit) {
        res.status(429).json({
          error: 'Please wait before submitting another questionnaire',
          retryAfter: '24 hours'
        });
        return;
      }

      const response = await questionnaireService.submitQuestionnaire(
        userId,
        answers,
        generatedPrompt,
        req.userToken!
      );

      res.status(201).json({
        message: 'Questionnaire submitted successfully',
        responseId: response.id,
        nextStep: 'Copy the prompt to ChatGPT and paste the response back'
      });
    } catch (error) {
      console.error('Submit questionnaire error:', error);
      res.status(500).json({ error: 'Failed to submit questionnaire' });
    }
  }

  /**
   * Parse la réponse de ChatGPT/Claude
   */
  async parseAIResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { chatGPTResponse } = req.body;

      // Parser la réponse
      const parsedData = chatGPTParser.parseResponse(chatGPTResponse);

      // Retourner le résultat parsé pour validation côté client
      res.json({
        success: true,
        parsed: {
          profileText: parsedData.profileText,
          profileJson: parsedData.profileJson
        },
        message: 'Response parsed successfully. Review and confirm to save.'
      });
    } catch (error) {
      console.error('Parse AI response error:', error);

      // Erreur détaillée pour aider l'utilisateur
      if (error instanceof Error) {
        res.status(400).json({
          error: 'Failed to parse AI response',
          details: error.message,
          hint: 'Make sure you copied the complete response including the JSON block'
        });
      } else {
        res.status(500).json({ error: 'Failed to parse AI response' });
      }
    }
  }

  /**
   * ✅ CORRIGÉ - Met à jour une réponse avec le profil IA
   */
  async updateWithAIProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { responseId } = req.params;
      const userId = req.user!.id;
      const { chatGPTResponse } = req.body;

      // Vérifier que la réponse appartient à l'utilisateur
      const response = await questionnaireService.getResponse(responseId, req.userToken!);
      if (!response || response.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Vérifier qu'il n'y a pas déjà un profil IA
      if (response.profile_json) {
        res.status(400).json({
          error: 'AI profile already exists for this response',
          hint: 'Create a new questionnaire to generate a new profile'
        });
        return;
      }

      // Parser et sauvegarder
      const parsedData = chatGPTParser.parseResponse(chatGPTResponse);

      const updated = await questionnaireService.updateWithAIProfile(
        responseId,
        parsedData.profileText,
        parsedData.profileJson,
        req.userToken!
      );

      res.json({
        message: 'AI profile saved successfully',
        response: updated
      });
    } catch (error) {
      console.error('Update with AI profile error:', error);
      res.status(500).json({ error: 'Failed to save AI profile' });
    }
  }

  /**
   * ✅ CORRIGÉ - Récupère uniquement le prompt généré
   */
  async getGeneratedPrompt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { responseId } = req.params;
      const userId = req.user!.id;

      const response = await questionnaireService.getResponse(responseId, req.userToken!);

      if (!response || response.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (!response.generated_prompt) {
        res.status(404).json({ error: 'No prompt found for this response' });
        return;
      }

      res.json({
        prompt: response.generated_prompt,
        createdAt: response.created_at,
        instructions: 'Copy this prompt and paste it in ChatGPT or Claude AI'
      });
    } catch (error) {
      console.error('Get generated prompt error:', error);
      res.status(500).json({ error: 'Failed to get prompt' });
    }
  }

  /**
   * Vérifie l'intégrité d'un profil IA avant sauvegarde
   */
  async verifyProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { sessionId, profileText, userId } = req.body;
      const requestUserId = req.user!.id;

      // Vérifier que l'userId correspond
      if (userId !== requestUserId) {
        res.status(403).json({ error: 'User ID mismatch' });
        return;
      }

      const cleanText = profileText.trim();

      // 1. Vérifier la longueur minimale
      if (cleanText.length < 500) {
        res.json({
          valid: false,
          message: '❌ Le profil est trop court. Copie bien toute la réponse de l\'IA.'
        });
        return;
      }

      // 2. Vérification intelligente : est-ce un profil Affinia valide ?
      const hasAffiniaMarkers = /PARTIE\s*1|ANALYSE\s+PERSONNELLE|DONNÉES\s+DE\s+MATCHING/i.test(cleanText);

      if (!hasAffiniaMarkers) {
        res.json({
          valid: false,
          message: '❌ Ceci ne semble pas être un profil Affinia. Utilise le prompt généré.'
        });
        return;
      }

      console.log('✅ Profil Affinia détecté, sessionId:', sessionId);

      // 3. Vérifier la présence des sections essentielles
      const hasAnalysis = /PARTIE\s*1|ANALYSE\s+PERSONNELLE|profil\s+miroir/i.test(cleanText);
      const hasJson = /```\s*json|"reliability_score"|"strength_signals"/i.test(cleanText);

      if (!hasAnalysis) {
        res.json({
          valid: false,
          message: '❌ Il manque l\'analyse personnelle. Assure-toi de copier depuis le début.'
        });
        return;
      }

      if (!hasJson) {
        res.json({
          valid: false,
          message: '❌ Il manque les données JSON. Copie bien jusqu\'à la fin de la réponse.'
        });
        return;
      }

      // 4. Extraire et nettoyer le JSON
      const jsonMatch = cleanText.match(/```\s*json\s*([\s\S]*?)\s*```/i);
      if (!jsonMatch) {
        res.json({
          valid: false,
          message: '❌ Impossible de trouver les données JSON. Vérifie ton copier-coller.'
        });
        return;
      }

      try {
        // 🔧 CORRECTION : Utiliser la fonction utilitaire
        const cleanedJson = cleanDuplicatedJsonFields(jsonMatch[1].trim());
        const jsonData = JSON.parse(cleanedJson);

        // Vérifier les champs obligatoires
        const requiredFields = [
          'reliability_score',
          'strength_signals',
          'weakness_signals',
          'cognitive_signals',
          'affective_indicators'
        ];

        const missingFields = requiredFields.filter(field => !(field in jsonData));

        if (missingFields.length > 0) {
          res.json({
            valid: false,
            message: `❌ Données JSON incomplètes (manque: ${missingFields.join(', ')}). Réessaye.`,
            missingFields
          });
          return;
        }

        // 5. Validation réussie
        res.json({
          valid: true,
          message: '✅ Profil complet et valide ! Tu peux le sauvegarder.',
          sessionId,
          cleanedProfileText: cleanText,
          cleanedJson // Optionnel : retourner le JSON nettoyé pour debug
        });

      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        console.error('JSON content that failed:', jsonMatch[1].substring(0, 200) + '...');

        res.json({
          valid: false,
          message: '❌ Le format JSON est invalide. Copie exactement la réponse de l\'IA.',
          debugInfo: process.env.NODE_ENV === 'development' ? {
            error: jsonError.message,
            jsonPreview: jsonMatch[1].substring(0, 200) + '...'
          } : undefined
        });
      }

    } catch (error) {
      console.error('Verify profile error:', error);
      res.status(500).json({
        error: 'Failed to verify profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export const questionnaireController = new QuestionnaireController();