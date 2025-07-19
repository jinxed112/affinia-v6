import { body, param } from 'express-validator';

export const validateProfileId = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format')
];

export const validateUpdateProfile = [
  body('full_name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  
  body('location')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  
  body('age')
    .optional()
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be between 18 and 120'),
  
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];