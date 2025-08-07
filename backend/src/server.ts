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
