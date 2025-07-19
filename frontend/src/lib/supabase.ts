import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbcbeitvmtqwoifbkghy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiY2JlaXR2bXRxd29pZmJrZ2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDA3NDgsImV4cCI6MjA2NzgxNjc0OH0.CeYLdvHg2sC9GuJjxnfN79q2WzEq1Nocw8xk5jIMgz8'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes!')
}

// Créer le client Supabase avec les options OAuth
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Plus sécurisé pour les apps SPA
    storage: window.localStorage,
    storageKey: `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`,
    debug: import.meta.env.DEV, // Active les logs en développement
  },
})

// Helper pour vérifier la configuration
export const checkSupabaseConfig = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('🔧 Configuration Supabase:')
    console.log('- URL:', supabaseUrl)
    console.log('- Anon Key:', supabaseAnonKey.substring(0, 20) + '...')
    console.log('- Session:', session ? 'Active' : 'Inactive')
    console.log('- Storage Key:', `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`)
    
    if (error) {
      console.error('❌ Erreur de configuration:', error)
    }
    
    return { session, error }
  } catch (error) {
    console.error('💥 Erreur lors de la vérification:', error)
    return { session: null, error }
  }
}

// Exporter les types utiles
export type { User, Session } from '@supabase/supabase-js'