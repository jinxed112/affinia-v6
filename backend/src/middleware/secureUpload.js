const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');

// Configuration sécurisée
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Storage temporaire
const storage = multer.memoryStorage();

// Validation fichiers
const fileFilter = (req, file, cb) => {
  console.log('🔍 Validation fichier:', file.originalname, file.mimetype);
  
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Type non autorisé. Autorisés: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
  
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return cb(new Error('Extension invalide'));
  }
  
  cb(null, true);
};

// Configuration multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

/**
 * Validation et optimisation image
 */
const validateAndOptimizeImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    console.log('🖼️  Optimisation image:', {
      original: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    // Validation avec Sharp
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Image corrompue');
    }

    if (metadata.width < 100 || metadata.height < 100) {
      throw new Error('Image trop petite (min 100x100)');
    }

    if (metadata.width > 4096 || metadata.height > 4096) {
      throw new Error('Image trop grande (max 4096x4096)');
    }

    // Optimisation automatique
    const optimizedBuffer = await image
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // Nom sécurisé
    const hash = crypto.createHash('sha256').update(optimizedBuffer).digest('hex').substring(0, 16);
    const secureFileName = `${Date.now()}_${hash}.jpg`;

    // Remplacer les données
    req.file.buffer = optimizedBuffer;
    req.file.size = optimizedBuffer.length;
    req.file.secureFileName = secureFileName;

    console.log('✅ Image optimisée:', {
      oldSize: metadata.width + 'x' + metadata.height,
      newSize: optimizedBuffer.length + ' bytes',
      fileName: secureFileName
    });

    next();

  } catch (error) {
    console.error('❌ Erreur optimisation image:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Export middleware complet
const secureFileUpload = [
  upload.single('file'),
  validateAndOptimizeImage
];

module.exports = {
  secureFileUpload,
  validateAndOptimizeImage
};
