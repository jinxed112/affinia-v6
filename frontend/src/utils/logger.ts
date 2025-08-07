interface LogLevel {
  ERROR: 0
  WARN: 1
  INFO: 2
  DEBUG: 3
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

class Logger {
  private level: number

  constructor() {
    // Niveau selon l'environnement
    this.level = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Masquer les tokens JWT
      if (data.startsWith('eyJ') && data.length > 100) {
        return data.substring(0, 10) + '...[MASKED]'
      }
      return data
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data }
      const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'key']

      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[MASKED]'
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key])
        }
      }

      return sanitized
    }

    return data
  }

  private log(level: number, message: string, data?: any) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString()
      const sanitizedData = data ? this.sanitizeData(data) : undefined
      
      const logEntry = {
        timestamp,
        level: Object.keys(LOG_LEVELS)[level],
        message,
        ...(sanitizedData && { data: sanitizedData })
      }

      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error('🔴', logEntry)
          break
        case LOG_LEVELS.WARN:
          console.warn('🟡', logEntry)
          break
        case LOG_LEVELS.INFO:
          console.info('🔵', logEntry)
          break
        case LOG_LEVELS.DEBUG:
          console.debug('⚪', logEntry)
          break
      }
    }
  }

  error(message: string, data?: any) {
    this.log(LOG_LEVELS.ERROR, message, data)
  }

  warn(message: string, data?: any) {
    this.log(LOG_LEVELS.WARN, message, data)
  }

  info(message: string, data?: any) {
    this.log(LOG_LEVELS.INFO, message, data)
  }

  debug(message: string, data?: any) {
    this.log(LOG_LEVELS.DEBUG, message, data)
  }
}

export const logger = new Logger()
