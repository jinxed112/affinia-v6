// backend/src/config/database.ts
import { createClient } from '@supabase/supabase-js';
import { env } from './environment';

// ✅ ADMIN CLIENT - Pour validation auth UNIQUEMENT
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ✅ NOUVEAU - Client utilisateur respectant RLS
export const createUserSupabase = (userToken: string) => {
  const client = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Définir le token JWT utilisateur pour RLS
  client.auth.setSession({
    access_token: userToken,
    refresh_token: '',
    user: null as any,
    expires_at: 0,
    expires_in: 0,
    token_type: 'bearer'
  } as any);
  
  return client;
};

// ✅ Type helper
export type UserSupabaseClient = ReturnType<typeof createUserSupabase>;

// Helper pour vérifier la connexion (garde supabaseAdmin pour ça)
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}