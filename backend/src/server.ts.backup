// backend/src/server.ts - VERSION COMPLÈTE AVEC CHAT
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http'; // ← NOUVEAU pour WebSocket

// Import des routes qui existent
import { questionnaireRoutes } from './modules/questionnaire/questionnaire.routes';
import { profileRoutes } from './modules/profile/profile.routes';

// ✨ NOUVELLES ROUTES - Gamification + Admin + Discovery + Chat
import { gamificationRoutes } from './modules/gamification/gamification.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import discoveryRoutes from './modules/discovery/discovery.routes';
import chatRoutes from './modules/chat/chat.routes'; // ← NOUVEAU

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Créer le serveur HTTP pour WebSocket (préparé pour plus tard)
const server = createServer(app); // ← NOUVEAU

// 🛡️ Middlewares de sécurité
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

// 📊 Middlewares généraux
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📝 Middleware de logging simple
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

// 🔍 Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// 🔐 Routes publiques
app.get('/api/status', (req, res) => {
  res.json({
    message: '🚀 Affinia Backend V6 - API opérationnelle avec Discovery + Chat',
    version: '1.0.0',
    documentation: '/api/docs',
    features: ['Questionnaire', 'Profiles', 'Gamification', 'Admin Panel', 'Discovery', 'Real-time Chat']
  });
});

// 🎯 Routes API
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/profiles', profileRoutes);

// ✨ NOUVELLES ROUTES - Gamification + Admin + Discovery + Chat
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/chat', chatRoutes); // ← NOUVEAU

// 📋 Documentation basique
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Affinia Backend API V6 - Discovery + Chat Edition',
    version: '1.0.0',
    endpoints: {
      questionnaire: {
        'POST /api/questionnaire/generate-prompt': 'Génération sécurisée de prompt',
        'POST /api/questionnaire/verify-profile': 'Validation intégrité profil',
        'POST /api/questionnaire/submit': 'Soumettre questionnaire',
        'POST /api/questionnaire/parse-ai': 'Parser réponse IA',
        'GET /api/questionnaire/my-responses': 'Mes réponses'
      },
      profile: {
        'GET /api/profiles/me': 'Mon profil',
        'PUT /api/profiles/me': 'Mettre à jour mon profil',
        'GET /api/profiles/:userId': 'Profil utilisateur',
        'GET /api/profiles/:userId/card': 'Carte Affinia',
        'GET /api/profiles/:userId/stats': 'Statistiques profil'
      },
      discovery: {
        'GET /api/discovery': 'Découvrir des profils',
        'GET /api/discovery/profile/:id': 'Profil spécifique',
        'POST /api/discovery/mirror-request': 'Demander accès miroir',
        'PUT /api/discovery/mirror-request/:id': 'Répondre demande miroir',
        'GET /api/discovery/mirror-requests/received': 'Demandes reçues',
        'GET /api/discovery/mirror-requests/sent': 'Demandes envoyées'
      },
      chat: {
        'GET /api/chat/conversations': 'Mes conversations',
        'POST /api/chat/conversations': 'Créer une conversation',
        'GET /api/chat/conversations/:id': 'Détails conversation',
        'GET /api/chat/conversations/:id/messages': 'Messages d\'une conversation',
        'POST /api/chat/conversations/:id/messages': 'Envoyer un message',
        'PUT /api/chat/messages/:id': 'Modifier un message',
        'DELETE /api/chat/messages/:id': 'Supprimer un message',
        'POST /api/chat/messages/:id/react': 'Réagir à un message',
        'POST /api/chat/conversations/:id/read': 'Marquer comme lu',
        'GET /api/chat/conversations/:id/unread-count': 'Compter non lus',
        'GET /api/chat/stats': 'Statistiques chat globales'
      },
      gamification: {
        'GET /api/gamification/quests': 'Mes quêtes',
        'POST /api/gamification/complete-quest': 'Compléter une quête',
        'GET /api/gamification/progress': 'Progression des quêtes',
        'GET /api/gamification/xp-history': 'Historique XP',
        'POST /api/gamification/validate/:action': 'Valider une action'
      },
      admin: {
        'GET /api/admin/dashboard': 'Dashboard admin complet',
        'GET /api/admin/stats': 'Statistiques générales',
        'GET /api/admin/quests': 'Gestion des quêtes',
        'POST /api/admin/quests': 'Créer une quête',
        'PUT /api/admin/quests/:id': 'Modifier une quête',
        'DELETE /api/admin/quests/:id': 'Supprimer une quête',
        'POST /api/admin/quests/:id/sync': 'Synchroniser avec utilisateurs'
      }
    },
    authentication: 'Bearer token required for protected routes',
    authorization: 'Admin routes require admin role'
  });
});

// 🚨 Gestion des erreurs (404)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 🚨 Gestion des erreurs générales (simple)
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erreur serveur:', error);

  res.status(error.status || 500).json({
    error: error.message || 'Erreur interne du serveur',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
});

// 🚀 Démarrage du serveur
server.listen(PORT, () => {
  console.log('🔥 ==========================================');
  console.log('🚀 AFFINIA BACKEND V6 - DISCOVERY + CHAT EDITION');
  console.log('🔥 ==========================================');
  console.log(`📡 Serveur: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`📋 Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🎯 API Questionnaire: http://localhost:${PORT}/api/questionnaire`);
  console.log(`👤 API Profiles: http://localhost:${PORT}/api/profiles`);
  console.log(`🔍 API Discovery: http://localhost:${PORT}/api/discovery`);
  console.log(`💬 API Chat: http://localhost:${PORT}/api/chat`);
  console.log(`🎮 API Gamification: http://localhost:${PORT}/api/gamification`);
  console.log(`🛡️ API Admin: http://localhost:${PORT}/api/admin`);
  console.log('🔥 ==========================================');
  console.log(`🌍 CORS: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`🔐 ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔥 ==========================================');
  console.log('✨ Fonctionnalités activées :');
  console.log('  🎯 Système de quêtes dynamique');
  console.log('  🏆 Progression XP et niveaux');
  console.log('  🛡️ Panel admin pour gestion quêtes');
  console.log('  🔔 Notifications gamification');
  console.log('  🔍 Découverte et miroir privé');
  console.log('  💬 Chat temps réel avec API REST');
  console.log('🔥 ==========================================');
});

export default app;