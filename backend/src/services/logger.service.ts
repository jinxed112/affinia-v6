// SERVICE OPTIONNEL - Implémentation complète disponible mais non utilisée actuellement
import winston from 'winston'

// Masquer les informations sensibles
const sanitizeLog = (info: any) => {
  const sensitiveFields = ['password', 'token', 'authorization', 'cookie']
  const sanitized = { ...info }
  
  const maskSensitive = (obj: any, path = ''): any => {
    if (typeof obj === 'string') {
      // Masquer les tokens JWT
      if (obj.startsWith('eyJ') && obj.length > 100) {
        return obj.substring(0, 10) + '...[MASKED]'
      }
      // Masquer les mots de passe
      if (path.toLowerCase().includes('password')) {
        return '[MASKED]'
      }
      return obj
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase()
        if (sensitiveFields.some(field => keyLower.includes(field))) {
          result[key] = '[MASKED]'
        } else {
          result[key] = maskSensitive(value, `${path}.${key}`)
        }
      }
      return result
    }
    
    return obj
  }
  
  return maskSensitive(sanitized)
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const sanitized = sanitizeLog(info)
      return `${sanitized.timestamp} [${sanitized.level.toUpperCase()}]: ${sanitized.message} ${
        sanitized.stack ? `\n${sanitized.stack}` : ''
      } ${Object.keys(sanitized).length > 3 ? JSON.stringify(sanitized, null, 2) : ''}`
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.colorize({ all: true })
    })
  ]
})

export { logger }
