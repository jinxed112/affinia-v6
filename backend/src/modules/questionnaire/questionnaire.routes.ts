import { Router } from 'express';
import { questionnaireController } from './questionnaire.controller';
import { authMiddleware } from '../auth/auth.middleware'; // ← CHANGÉ: requireAuth → authMiddleware
import { 
  validateQuestionnaireSubmission, 
  validateAIResponse,
  validateQuestionnaireId,
  validateProfileVerification,
  validateGeneratePrompt
} from './questionnaire.validator';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware); // ← CHANGÉ: requireAuth → authMiddleware

// Routes (reste identique)
router.get('/my-responses', questionnaireController.getMyResponses);
router.get('/latest', questionnaireController.getLatestResponse);
router.get('/:responseId', validateQuestionnaireId, questionnaireController.getResponse);
router.post('/submit', validateQuestionnaireSubmission, questionnaireController.submitQuestionnaire);
router.post('/generate-prompt', validateGeneratePrompt, questionnaireController.generatePrompt);
router.post('/parse-ai', validateAIResponse, questionnaireController.parseAIResponse);
router.post('/verify-profile', validateProfileVerification, questionnaireController.verifyProfile);
router.put('/:responseId/ai-profile', validateQuestionnaireId, validateAIResponse, questionnaireController.updateWithAIProfile);
router.get('/:responseId/prompt', validateQuestionnaireId, questionnaireController.getGeneratedPrompt);

export const questionnaireRoutes = router;