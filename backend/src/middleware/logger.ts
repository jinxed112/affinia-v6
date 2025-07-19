// backend/src/middleware/logger.ts
import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  // Log de la requête entrante
  console.log(`📥 ${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`)
  
  // Intercepter la fin de la réponse
  const originalSend = res.send
  res.send = function(body) {
    const duration = Date.now() - start
    const statusEmoji = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️' : '✅'
    
    console.log(`📤 ${statusEmoji} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`)
    
    // Si erreur, logger des détails supplémentaires
    if (res.statusCode >= 400) {
      console.log(`   🔍 User-Agent: ${req.get('User-Agent')}`)
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(`   📋 Body: ${JSON.stringify(req.body, null, 2).substring(0, 200)}...`)
      }
    }
    
    return originalSend.call(this, body)
  }
  
  next()
}
