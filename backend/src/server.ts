import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/environment';
import { setupWebSocket } from './modules/chat/chat.websocket';
import { chatService } from './modules/chat/chat.service';
import { chatWebSocketServer } from './modules/chat/chat.websocket';

// Import des routes avec gestion flexible
let authRoutes: any;
let profileRoutes: any;
let questionnaireRoutes: any;
let discoveryRoutes: any;
let chatRoutes: any;
let adminRoutes: any;
let gamificationRoutes: any;

// Fonction helper pour charger les routes de façon flexible
const loadRoutes = (modulePath: string, routeName: string) => {
  try {
    const module = require(modulePath);
    // Essayer différents exports possibles
    return module[routeName] || module.default || module.router || module;
  } catch (e) {
    console.log(`❌ ${routeName} erreur:`, e.message);
    return null;
  }
};

authRoutes = loadRoutes('./modules/auth/auth.routes', 'authRoutes');
profileRoutes = loadRoutes('./modules/profile/profile.routes', 'profileRoutes');
questionnaireRoutes = loadRoutes('./modules/questionnaire/questionnaire.routes', 'questionnaireRoutes');
discoveryRoutes = loadRoutes('./modules/discovery/discovery.routes', 'discoveryRoutes');
chatRoutes = loadRoutes('./modules/chat/chat.routes', 'chatRoutes');
adminRoutes = loadRoutes('./modules/admin/admin.routes', 'adminRoutes');
gamificationRoutes = loadRoutes('./modules/gamification/gamification.routes', 'gamificationRoutes');

console.log('🔍 Routes chargées:', {
  auth: !!authRoutes,
  profile: !!profileRoutes,
  questionnaire: !!questionnaireRoutes,
  discovery: !!discoveryRoutes,
  chat: !!chatRoutes,
  admin: !!adminRoutes,
  gamification: !!gamificationRoutes
});

const app = express();

// ============ CONFIGURATION EXPRESS ============

// Middleware de sécurité
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============ ROUTES API ============

// Charger seulement les routes qui existent
if (authRoutes) app.use('/api/auth', authRoutes);
if (profileRoutes) app.use('/api/profile', profileRoutes);
if (questionnaireRoutes) app.use('/api/questionnaire', questionnaireRoutes);
if (discoveryRoutes) app.use('/api/discovery', discoveryRoutes);
if (chatRoutes) app.use('/api/chat', chatRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (gamificationRoutes) app.use('/api/gamification', gamificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const stats = chatWebSocketServer.getServerStats();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    config: {
      cors_origin: env.CORS_ORIGIN,
      port: env.PORT,
      node_env: env.NODE_ENV
    },
    websocket: {
      status: 'active',
      ...stats
    }
  });
});

// Route pour les stats WebSocket (debug)
app.get('/api/websocket/stats', (req, res) => {
  const stats = chatWebSocketServer.getServerStats();
  const onlineUsers = chatWebSocketServer.getOnlineUsers();
  
  res.json({
    stats,
    onlineUsers: onlineUsers.map(user => ({
      userId: user.userId,
      userName: user.userName,
      lastSeen: user.lastSeen,
      isTyping: user.isTyping,
      currentConversation: user.currentConversation
    }))
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Gestion globale des erreurs
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erreur serveur:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ============ CRÉATION SERVEUR HTTP + WEBSOCKET ============

const PORT = parseInt(env.PORT) || 3001;

const server = createServer(app);

// Initialiser WebSocket
const io = setupWebSocket(server);

// Connecter le chat service au WebSocket
chatService.setWebSocketService(chatWebSocketServer);

// ============ DÉMARRAGE SERVEUR ============

server.listen(PORT, () => {
  console.log('🚀 Serveur démarré !');
  console.log('📡 REST API:', `http://localhost:${PORT}`);
  console.log('🌐 WebSocket:', `ws://localhost:${PORT}`);
  console.log('🔧 Mode:', env.NODE_ENV);
  console.log('🎯 Frontend:', env.CORS_ORIGIN);
  
  console.log('\n📋 Routes disponibles:');
  console.log('   GET  /api/health');
  console.log('   GET  /api/websocket/stats');
  console.log('   POST /api/auth/*');
  console.log('   GET  /api/chat/*');
  console.log('   WS   /socket.io/*');
  console.log('\n✅ Affinia V6 Chat Server TEMPS RÉEL prêt ! 🚀\n');
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('📴 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Arrêt du serveur (CTRL+C)...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

export default app;
