// backend/src/modules/profile/profile.service.ts - VERSION DEBUG
import { supabaseAdmin } from '../../config/database';

// ✅ VERSION DEBUG - Avec logs détaillés
async getProfile(userId: string, userToken: string): Promise<Profile | null> {
  try {
    console.log('🔍 DEBUG getProfile:', {
      userId: userId,
      tokenPrefix: userToken.substring(0, 20) + '...',
      tokenLength: userToken.length
    });

    // 1. D'ABORD : Vérifier que le token est valide
    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
    
    if (tokenError || !user) {
      console.error('❌ Token invalide:', tokenError);
      return null;
    }
    
    console.log('✅ Token valide pour:', user.email);
    
    // 2. VÉRIFIER : L'userId correspond au token
    if (user.id !== userId) {
      console.error('❌ UserID mismatch:', { tokenUserId: user.id, requestedUserId: userId });
      return null;
    }
    
    console.log('✅ UserID match confirmé');

    // 3. TEMPORAIRE : Utiliser supabaseAdmin avec WHERE explicite (bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Profile query error:', error);
      return null;
    }

    console.log('✅ Profile trouvé via admin:', data.email);
    return data;

  } catch (error) {
    console.error('💥 Profile service error:', error);
    throw error;
  }
}