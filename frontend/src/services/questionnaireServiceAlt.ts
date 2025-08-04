// src/services/questionnaireServiceAlt.ts
import { QuestionnaireAnswers } from '../stores/questionnaireStore'

const SUPABASE_URL = 'https://qbcbeitvmtqwoifbkghy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiY2JlaXR2bXRxd29pZmJrZ2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDA3NDgsImV4cCI6MjA2NzgxNjc0OH0.CeYLdvHg2sC9GuJjxnfN79q2WzEq1Nocw8xk5jIMgz8'

const getAuthToken = () => {
  const stored = localStorage.getItem('sb-qbcbeitvmtqwoifbkghy-auth-token')
  if (!stored) return null
  return JSON.parse(stored).access_token
}

export const questionnaireServiceAlt = {
  async saveResponses(
    userId: string,
    answers: QuestionnaireAnswers
  ) {
    console.log('📍 questionnaireServiceAlt.saveResponses appelé')
    
    try {
      const token = getAuthToken()
      if (!token) throw new Error('Pas de token d\'authentification')
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire_responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          answers,
          prompt_version: 'V8',
          completed_at: new Date().toISOString()
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Erreur API:', data)
        return { data: null, error: data }
      }
      
      console.log('✅ Sauvegarde réussie:', data)
      return { data: data[0], error: null }
      
    } catch (error) {
      console.error('💥 Exception:', error)
      return { data: null, error }
    }
  },

  // 🆕 NOUVELLE MÉTHODE POUR STEP3FINALIZATION
  async saveProfile(
    responseId: string,
    generatedProfile: string,
    userId?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    console.log('📍 saveProfile appelé avec responseId:', responseId)
    
    try {
      // Validation basique
      if (!generatedProfile.trim() || generatedProfile.trim().length < 10) {
        return { success: false, error: 'Profil invalide ou trop court' }
      }

      const token = getAuthToken()
      if (!token) {
        return { success: false, error: 'Session expirée, reconnectez-vous' }
      }

      // Parser le JSON de manière robuste (réutilisation de la logique existante)
      let profileJson = null
      try {
        const jsonMatch = generatedProfile.match(/```json\s*([\s\S]*?)\s*```/i)
        
        if (jsonMatch && jsonMatch[1]) {
          console.log('🔍 JSON trouvé, tentative de parsing...')
          let cleanJson = jsonMatch[1].trim()
          
          // CORRECTION : Réparer le bug "unconscious_patterns"
          cleanJson = cleanJson.replace(
            /"unconscious_patterns"\s*:\s*\{([^}]+)\}/g,
            (match, content) => {
              const items = content.match(/"[^"]+"/g) || []
              return `"unconscious_patterns": [${items.join(', ')}]`
            }
          )
          
          profileJson = JSON.parse(cleanJson)
          console.log('✅ JSON parsé avec succès')
        }
      } catch (e) {
        console.log('⚠️ Erreur parsing JSON:', e.message)
        console.log('Le profil sera sauvegardé sans extraction JSON')
      }

      // Construire l'URL avec ou sans userId
      const url = userId 
        ? `${SUPABASE_URL}/rest/v1/questionnaire_responses?id=eq.${responseId}&user_id=eq.${userId}`
        : `${SUPABASE_URL}/rest/v1/questionnaire_responses?id=eq.${responseId}`
      
      // Mise à jour via API Supabase
      const response = await fetch(
        url,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            generated_profile: generatedProfile.trim(),
            profile_json: profileJson,
            profile_updated_at: new Date().toISOString()
          })
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Erreur sauvegarde profil:', data)
        return { 
          success: false, 
          error: data.message || 'Erreur lors de la sauvegarde' 
        }
      }
      
      console.log('✅ Profil sauvegardé avec succès:', {
        id: data[0]?.id,
        has_json: !!profileJson,
        profile_length: generatedProfile.length
      })
      
      return { success: true, data: data[0] }
      
    } catch (error) {
      console.error('💥 Exception saveProfile:', error)
      return { 
        success: false, 
        error: 'Erreur réseau ou serveur' 
      }
    }
  },

  async getLatestResponse(userId: string) {
    try {
      const token = getAuthToken()
      if (!token) throw new Error('Pas de token d\'authentification')
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/questionnaire_responses?user_id=eq.${userId}&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        return { data: null, error: data }
      }
      
      return { data: data[0] || null, error: null }
      
    } catch (error) {
      return { data: null, error }
    }
  },

  async getAllResponses(userId: string) {
    try {
      const token = getAuthToken()
      if (!token) throw new Error('Pas de token d\'authentification')
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/questionnaire_responses?user_id=eq.${userId}&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        return { data: null, error: data }
      }
      
      return { data, error: null }
      
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateGeneratedProfile(
    responseId: string,
    userId: string,
    generatedProfile: string
  ) {
    console.log('📍 updateGeneratedProfile appelé')
    
    try {
      const token = getAuthToken()
      if (!token) throw new Error('Pas de token d\'authentification')
      
      // Parser le JSON de manière plus robuste
      let profileJson = null
      try {
        // Méthode 1 : Chercher entre ```json et ```
        const jsonMatch = generatedProfile.match(/```json\s*([\s\S]*?)\s*```/i)
        
        if (jsonMatch && jsonMatch[1]) {
          console.log('🔍 JSON trouvé, tentative de parsing...')
          let cleanJson = jsonMatch[1].trim()
          
          // CORRECTION : Réparer le bug "unconscious_patterns"
          // Remplacer l'objet mal formé par un tableau
          cleanJson = cleanJson.replace(
            /"unconscious_patterns"\s*:\s*\{([^}]+)\}/g,
            (match, content) => {
              // Extraire les strings et les mettre dans un tableau
              const items = content.match(/"[^"]+"/g) || []
              return `"unconscious_patterns": [${items.join(', ')}]`
            }
          )
          
          console.log('🔧 JSON corrigé pour unconscious_patterns')
          
          profileJson = JSON.parse(cleanJson)
          console.log('✅ JSON parsé avec succès')
        } else {
          // Méthode 2 : Chercher un objet JSON directement
          const directJsonMatch = generatedProfile.match(/\{[\s\S]*"reliability_score"[\s\S]*\}/i)
          if (directJsonMatch) {
            console.log('🔍 JSON direct trouvé, tentative de parsing...')
            let cleanJson = directJsonMatch[0]
            
            // Même correction ici
            cleanJson = cleanJson.replace(
              /"unconscious_patterns"\s*:\s*\{([^}]+)\}/g,
              (match, content) => {
                const items = content.match(/"[^"]+"/g) || []
                return `"unconscious_patterns": [${items.join(', ')}]`
              }
            )
            
            profileJson = JSON.parse(cleanJson)
            console.log('✅ JSON parsé avec succès (méthode 2)')
          }
        }
        
        // Debug : afficher ce qu'on a trouvé
        if (profileJson) {
          console.log('📊 JSON extrait:', {
            reliability_score: profileJson.reliability_score,
            authenticity_score: profileJson.authenticity_score,
            attachment_style: profileJson.affective_indicators?.attachment_style,
            unconscious_patterns_count: profileJson.unconscious_patterns?.length || 0
          })
        }
        
      } catch (e) {
        console.log('⚠️ Erreur parsing JSON:', e.message)
        console.log('Le profil sera sauvegardé sans extraction JSON')
      }
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/questionnaire_responses?id=eq.${responseId}&user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            generated_profile: generatedProfile,
            profile_json: profileJson,
            profile_updated_at: new Date().toISOString()
          })
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Erreur lors de la mise à jour du profil:', data)
        return { data: null, error: data }
      }
      
      console.log('✅ Profil miroir sauvegardé:', {
        id: data[0]?.id,
        has_json: !!profileJson,
        profile_length: generatedProfile.length
      })
      
      return { data: data[0], error: null }
      
    } catch (error) {
      console.error('💥 Exception:', error)
      return { data: null, error }
    }
  },

  async hasCompletedQuestionnaire(userId: string): Promise<boolean> {
    try {
      const result = await this.getLatestResponse(userId)
      return !!result.data
    } catch (error) {
      console.error('Erreur:', error)
      return false
    }
  },

  async hasGeneratedProfile(userId: string): Promise<boolean> {
    try {
      const result = await this.getLatestResponse(userId)
      return !!(result.data && result.data.generated_profile)
    } catch (error) {
      console.error('Erreur:', error)
      return false
    }
  },

  async getGeneratedProfile(userId: string) {
    try {
      const result = await this.getLatestResponse(userId)
      if (!result.data || !result.data.generated_profile) {
        return { profile: null, json: null, error: 'Pas de profil trouvé' }
      }
      
      return {
        profile: result.data.generated_profile,
        json: result.data.profile_json,
        error: null
      }
    } catch (error) {
      return { profile: null, json: null, error }
    }
  },

  async getProfileStats(userId: string) {
    try {
      const result = await this.getGeneratedProfile(userId)
      if (!result.json) {
        return { stats: null, error: 'Pas de données JSON dans le profil' }
      }
      
      return {
        stats: {
          reliability: result.json.reliability_score,
          authenticity: result.json.authenticity_score,
          attachment: result.json.affective_indicators?.attachment_style,
          strengths: result.json.strength_signals?.length || 0,
          weaknesses: result.json.weakness_signals?.length || 0,
          risks: result.json.relationnal_risks?.length || 0
        },
        error: null
      }
    } catch (error) {
      return { stats: null, error }
    }
  }
}