import Joi from 'joi'

// Politique de mot de passe robuste
export const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'string.pattern.base': 'Le mot de passe doit contenir au moins: 1 minuscule, 1 majuscule, 1 chiffre, 1 caractère spécial'
  })

export const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    'string.email': 'Format d\'email invalide',
    'any.required': 'Email requis'
  })

export const tokenSchema = Joi.string()
  .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)
  .required()
  .messages({
    'string.pattern.base': 'Format de token invalide',
    'any.required': 'Token requis'
  })

export const signUpSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema
})

export const signInSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required()
})

export const verifyTokenSchema = Joi.object({
  token: tokenSchema
})
