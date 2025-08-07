const express = require('express');
const { getProfile, updateProfile, uploadPhoto } = require('../controllers/profile.controller');
const { secureFileUpload } = require('../middleware/secureUpload');

// Middleware auth existant (à adapter selon ton système)
const authenticateToken = (req, res, next) => {
  // Récupérer depuis ton système auth existant
  // Exemple basique :
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }
  
  // Valider le token selon ton système
  // req.user = { id: 'user-id' };
  
  next();
};

const router = express.Router();

// Middleware auth sur toutes les routes
router.use(authenticateToken);

// Routes profil
router.get('/:userId', getProfile);
router.put('/me', updateProfile);

// Upload photo sécurisé
router.post('/photos', secureFileUpload, uploadPhoto);

module.exports = router;
