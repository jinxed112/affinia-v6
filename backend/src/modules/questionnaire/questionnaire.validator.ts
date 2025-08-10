import { body, param } from 'express-validator';

// 🎯 VALIDATION CORRIGÉE - Pour la génération de prompt avec données frontend
export const validateGeneratePrompt = [
  body('answers')
    .isObject()
    .withMessage('Answers must be an object'),

  // Step 0 validation - Interface frontend
  body('answers.firstName')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1-50 characters'),

  body('answers.age')
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be between 18 and 120'),

  body('answers.gender')
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Gender is required'),

  body('answers.orientation')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Orientation is required'),

  // Step 1 validation - Interface frontend (prompt style)
  body('answers.energySource')
    .isString()
    .isIn(['solo_time', 'social_energy', 'balanced_mix'])
    .withMessage('Invalid energy source'),

  body('answers.communicationStyle')
    .isString()
    .isIn(['direct_honest', 'diplomatic_careful', 'emotional_expressive', 'reserved_thoughtful'])
    .withMessage('Invalid communication style'),

  // Step 2 validation - Interface frontend (prompt style)
  body('answers.lovePriority')
    .isString()
    .isIn(['emotional_connection', 'mutual_respect', 'shared_growth', 'fun_complicity'])
    .withMessage('Invalid love priority'),

  body('answers.conflictApproach')
    .isString()
    .isIn(['address_immediately', 'cool_down_first', 'avoid_when_possible', 'seek_compromise'])
    .withMessage('Invalid conflict approach'),

  // Step 3 optionnel - Expression libre
  body('answers.relationship_learning')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Relationship learning must be less than 1000 characters'),

  body('answers.ideal_partner')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Ideal partner must be less than 1000 characters'),

  body('answers.free_expression')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Free expression must be less than 2000 characters'),

  // Paramètres optionnels de génération
  body('messageCount')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Message count must be a positive integer'),

  body('conversationDuration')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Conversation duration must be a positive integer (days)')
];

export const validateProfileVerification = [
  body('sessionId')
    .isString()
    .notEmpty()
    .withMessage('Session ID is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Session ID must be between 5 and 100 characters'),

  body('profileText')
    .isString()
    .notEmpty()
    .withMessage('Profile text is required')
    .isLength({ min: 100, max: 50000 })
    .withMessage('Profile text must be between 100 and 50000 characters'),

  body('userId')
    .isUUID()
    .withMessage('Valid user ID is required')
];

export const validateQuestionnaireId = [
  param('responseId')
    .isUUID()
    .withMessage('Invalid response ID format')
];

// VALIDATION ORIGINALE - Pour les autres endpoints du questionnaire
export const validateQuestionnaireSubmission = [
  body('answers')
    .isObject()
    .withMessage('Answers must be an object'),

  // Step 0 validation
  body('answers.firstName')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1-50 characters'),

  body('answers.age')
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be between 18 and 120'),

  body('answers.location')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location is required'),

  // Step 1 validation - Interface questionnaire originale
  body('answers.energy')
    .isIn(['introverted', 'extroverted', 'ambivert'])
    .withMessage('Invalid energy type'),

  body('answers.communication')
    .isIn(['words', 'actions', 'touch', 'time', 'gifts'])
    .withMessage('Invalid communication style'),

  body('answers.conflict')
    .isIn(['discuss', 'space', 'humor', 'mediator'])
    .withMessage('Invalid conflict style'),

  body('answers.values')
    .isArray()
    .withMessage('Values must be an array')
    .custom((values) => values.length > 0 && values.length <= 10)
    .withMessage('Select between 1 and 10 values'),

  // Step 2 validation
  body('answers.interests')
    .isArray()
    .withMessage('Interests must be an array')
    .custom((interests) => interests.length > 0 && interests.length <= 10)
    .withMessage('Select between 1 and 10 interests'),

  body('answers.dealBreakers')
    .isArray()
    .withMessage('Deal breakers must be an array'),

  body('answers.lifestyle')
    .isIn(['spontaneous', 'planned', 'balanced'])
    .withMessage('Invalid lifestyle choice'),

  body('answers.relationshipGoal')
    .isIn(['casual', 'serious', 'friendship', 'open'])
    .withMessage('Invalid relationship goal'),

  // Generated prompt validation
  body('generatedPrompt')
    .isString()
    .isLength({ min: 100, max: 10000 })
    .withMessage('Generated prompt must be between 100 and 10000 characters')
];

// ✅ VALIDATION MOBILE-FRIENDLY - Accepte JSON avec OU sans backticks
export const validateAIResponse = [
  body('chatGPTResponse')
    .isString()
    .withMessage('ChatGPT response is required')
    .isLength({ min: 100, max: 50000 })
    .withMessage('Response must be between 100 and 50000 characters')
    .custom((value) => {
      // 🚀 NOUVELLE LOGIQUE : Accepter les deux formats
      
      // Format 1: JSON avec backticks markdown (desktop généralement)
      const hasMarkdownJson = value.includes('```json') && value.includes('```');
      
      // Format 2: JSON "nu" avec accolades (mobile généralement)
      const hasRawJson = value.includes('{') && value.includes('}') && 
                        (value.includes('"reliability_score"') || 
                         value.includes('"strength_signals"') ||
                         value.includes('"cognitive_signals"'));
      
      // Accepter si AU MOINS un des deux formats est présent
      return hasMarkdownJson || hasRawJson;
    })
    .withMessage('Response must contain JSON data (with or without markdown code blocks)')
];