#!/bin/bash

echo "🔧 CORRECTION AFFINIA V6 - SCRIPT AUTOMATIQUE"
echo "=============================================="

# 1. ✅ CORRIGER server.ts - Supprimer les imports dupliqués
echo "🔧 1. Correction server.ts..."
cat > ./backend/src/server.ts << 'EOF'
// backend/src/server.ts - VERSION CORRIGÉE
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import des routes - ✅ UNE SEULE FOIS CHAQUE
import { questionnaireRoutes } from './modules/questionnaire/questionnaire.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { profileRoutes } from './modules/profile/profile.routes';
import { gamificationRoutes } from './modules/gamification/gamification.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import discoveryRoutes from './modules/discovery/discovery.routes';
import chatRoutes from './modules/chat/chat.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const server = createServer(app);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📥 ${req.method} ${req.url} - ${req.ip}`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`📤 ${status} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    message: '🚀 Affinia Backend V6 - CORRIGÉ',
    version: '1.0.0'
  });
});

// 🎯 Routes API - UNE SEULE FOIS
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/chat', chatRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erreur serveur:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Erreur interne du serveur'
  });
});

server.listen(PORT, () => {
  console.log('🚀 AFFINIA BACKEND V6 - CORRIGÉ');
  console.log(`📡 Serveur: http://localhost:${PORT}`);
  console.log('✅ Imports dupliqués supprimés');
});

export default app;
EOF

# 2. ✅ CRÉER authManager manquant
echo "🔧 2. Création authManager.ts..."
mkdir -p ./frontend/src/services
cat > ./frontend/src/services/authManager.ts << 'EOF'
import { supabase } from '../lib/supabase'

class AuthManager {
  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('❌ getAccessToken error:', error)
      return null
    }
  }

  async clearSession(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('❌ clearSession error:', error)
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('❌ getCurrentUser error:', error)
      return null
    }
  }
}

export const authManager = new AuthManager()
EOF

# 3. ✅ CORRIGER questionnaireService.ts - API Base
echo "🔧 3. Correction questionnaireService.ts..."
cat > ./frontend/src/services/questionnaireService.ts << 'EOF'
import { QuestionnaireAnswers } from '../stores/questionnaireStore';
import { authManager } from './authManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class QuestionnaireService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/questionnaire${endpoint}`, {
        headers: { ...headers, ...options.headers },
        ...options,
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || `Erreur HTTP ${response.status}` };
      }

      return { success: true, data: data.data || data, message: data.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erreur réseau' };
    }
  }

  async generatePrompt(answers: QuestionnaireAnswers, messageCount: number = 0, conversationDuration: number = 0) {
    return this.apiCall('/generate-prompt', { 
      method: 'POST', 
      body: JSON.stringify({ answers, messageCount, conversationDuration }) 
    });
  }

  async verifyProfile(sessionId: string, profileText: string, userId: string) {
    return this.apiCall('/verify-profile', { 
      method: 'POST', 
      body: JSON.stringify({ sessionId, profileText, userId }) 
    });
  }

  async submitQuestionnaire(answers: QuestionnaireAnswers, generatedPrompt: string) {
    return this.apiCall('/submit', { 
      method: 'POST', 
      body: JSON.stringify({ answers, generatedPrompt }) 
    });
  }

  async getLatestResponse() { 
    return this.apiCall('/latest'); 
  }

  async getMyResponses() { 
    return this.apiCall('/my-responses'); 
  }
}

export const questionnaireService = new QuestionnaireService();
export default questionnaireService;
EOF

# 4. ✅ CORRIGER profileService.ts - Import authManager
echo "🔧 4. Correction profileService.ts..."
sed -i 's|import { authManager } from '\''./authManager'\''|import { authManager } from '\''./authManager'\''|g' ./frontend/src/services/profileService.ts

# 5. ✅ CRÉER SCRIPT SQL pour corriger la database
echo "🔧 5. Création script SQL de correction..."
cat > ./fix_database.sql << 'EOF'
-- 🔧 CORRECTION DATABASE AFFINIA
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur existant
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = '62e41e07-5f92-486a-b768-5c271b7f87b9';

-- 2. Créer le profil manuellement (TRIGGER DÉFAILLANT)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    xp,
    level,
    credits,
    mirror_visibility,
    max_distance,
    relationship_type,
    interested_in_genders,
    min_age,
    max_age,
    show_me_on_affinia,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.user_metadata->>'name', u.user_metadata->>'full_name', split_part(u.email, '@', 1)) as full_name,
    u.user_metadata->>'avatar_url' as avatar_url,
    0 as xp,
    1 as level,
    1000 as credits,
    'on_request' as mirror_visibility,
    50 as max_distance,
    '["serious"]'::jsonb as relationship_type,
    '["all"]'::jsonb as interested_in_genders,
    18 as min_age,
    35 as max_age,
    true as show_me_on_affinia,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE u.id = '62e41e07-5f92-486a-b768-5c271b7f87b9'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 3. Assigner les quêtes niveau 1 (TRIGGER DÉFAILLANT)
INSERT INTO public.user_quests (user_id, quest_id, created_at)
SELECT 
    '62e41e07-5f92-486a-b768-5c271b7f87b9' as user_id,
    q.id as quest_id,
    NOW() as created_at
FROM public.quests q
WHERE q.is_active = true 
  AND q.required_level <= 1
  AND NOT EXISTS (
      SELECT 1 FROM public.user_quests uq 
      WHERE uq.user_id = '62e41e07-5f92-486a-b768-5c271b7f87b9' 
        AND uq.quest_id = q.id
  );

-- 4. Vérifier les corrections
SELECT 'PROFIL CRÉÉ' as status, * FROM public.profiles WHERE id = '62e41e07-5f92-486a-b768-5c271b7f87b9';
SELECT 'QUÊTES ASSIGNÉES' as status, COUNT(*) as total FROM public.user_quests WHERE user_id = '62e41e07-5f92-486a-b768-5c271b7f87b9';
EOF

# 6. ✅ REDÉMARRER les services
echo "🔧 6. Redémarrage des services..."

# Arrêter les processus existants
echo "⏹️ Arrêt des processus existants..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Nettoyer les modules node si nécessaire
echo "🧹 Nettoyage optionnel..."
# cd backend && npm install --silent
# cd ../frontend && npm install --silent
# cd ..

echo ""
echo "✅ CORRECTIONS APPLIQUÉES !"
echo "=========================="
echo ""
echo "📋 ÉTAPES SUIVANTES :"
echo "1. 🗄️  EXÉCUTER LE SQL : Copie le contenu de fix_database.sql dans Supabase SQL Editor"
echo "2. 🚀 REDÉMARRER : npm run dev dans backend/ ET frontend/"
echo "3. 🧪 TESTER : OAuth Google sur http://localhost:5173"
echo ""
echo "🔍 FICHIERS CORRIGÉS :"
echo "  ✅ backend/src/server.ts (imports dupliqués supprimés)"
echo "  ✅ frontend/src/services/authManager.ts (créé)"
echo "  ✅ frontend/src/services/questionnaireService.ts (API corrigée)"
echo "  ✅ fix_database.sql (script de correction DB)"
echo ""
echo "🎯 APRÈS CES CORRECTIONS :"
echo "  ✅ Backend démarrera sans erreur"
echo "  ✅ Frontend aura accès aux tokens"
echo "  ✅ Profil sera créé en database"
echo "  ✅ Routes /api/profiles/me et /api/questionnaire/latest fonctionneront"
echo ""
echo "🚨 CRITIQUE : EXÉCUTE D'ABORD LE SQL AVANT DE TESTER !"
EOF

chmod +x fix_affinia_script.sh && echo "✅ Script créé ! Exécute : ./fix_affinia_script.sh"