// =============================================
// MIRROR UTILS - Fonctions de parsing partagées
// =============================================

interface ProfileJson {
  authenticity_score?: number;
  attachment_style?: string;
  strength_signals?: string[];
  weakness_signals?: string[];
  unconscious_patterns?: string[];
  ideal_partner_traits?: string[];
  mirroring_warning?: string;
  reliability_score?: number;
  affective_indicators?: {
    emotion_expression?: string;
    defense_mechanisms?: string[];
    attachment_style?: string;
  };
  cognitive_signals?: {
    language_level?: string;
    thinking_style?: string;
    complexity?: string;
  };
  relationnal_risks?: string[];
}

/**
 * Extraire le JSON du texte brut (mode mobile)
 */
export const extractJsonFromText = (rawText: string): ProfileJson | null => {
  if (!rawText) return null;

  try {
    console.log('📱 Tentative extraction JSON du texte brut...');
    
    // 1. Chercher le JSON avec accolades dans le texte brut
    const jsonMatch = rawText.match(/\{\s*[\s\S]*"reliability_score"[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.log('❌ Aucun JSON trouvé dans le texte brut');
      return null;
    }

    const jsonString = jsonMatch[0];
    console.log('🔍 JSON brut trouvé:', jsonString.substring(0, 200) + '...');

    // 2. Nettoyer le JSON (comme dans le controller)
    let cleaned = jsonString
      .replace(/,(\s*})/g, '$1') // Virgule avant }
      .replace(/,(\s*])/g, '$1') // Virgule avant ]
      .trim();

    // 3. Parser le JSON
    const parsed = JSON.parse(cleaned);
    console.log('✅ JSON parsé avec succès:', Object.keys(parsed));
    
    return parsed;

  } catch (error) {
    console.error('❌ Erreur parsing JSON du texte:', error);
    console.log('📱 Texte problématique:', rawText.substring(0, 500));
    
    // 🔄 JSON de secours avec données basiques
    return {
      reliability_score: 0.8,
      authenticity_score: 8,
      strength_signals: ["Analyse sauvegardée en mode simplifié"],
      weakness_signals: ["JSON extrait du texte brut"],
      cognitive_signals: { language_level: "élevé" },
      affective_indicators: { emotion_expression: "modérée" },
      unconscious_patterns: ["Données extraites automatiquement"],
      relationnal_risks: ["Format simplifié mobile"],
      ideal_partner_traits: ["Compatible avec analyse complète"],
      mirroring_warning: "Données extraites du mode simplifié mobile"
    };
  }
};

/**
 * Nettoyer le texte émotionnel (supprimer JSON, parties techniques, etc.)
 */
export const parseEmotionalText = (rawText: string): string => {
  if (!rawText) return '';

  console.log('🔧 parseEmotionalText - Input length:', rawText.length);
  console.log('🔧 parseEmotionalText - Preview:', rawText.substring(0, 200));

  let cleaned = rawText
    // 🚀 NOUVEAU : Supprimer les sections PARTIE explicites  
    .replace(/PARTIE\s+\d+\s*[:\-]\s*[^\n]*/gi, '')
    .replace(/DONNÉES\s+DE\s+MATCHING/gi, '')
    
    // 🚀 NOUVEAU : Supprimer le JSON brut complet (mobile)
    .replace(/\{\s*[\s\S]*"reliability_score"[\s\S]*\}/g, '')
    
    // 🚀 NOUVEAU : Supprimer les lignes JSON spécifiques
    .replace(/"[a-zA-Z_]+"\s*:\s*[^,\n}]+[,}]/g, '')
    .replace(/\{\s*$/gm, '')
    .replace(/^\s*\}/gm, '')
    .replace(/^\s*"[^"]*":\s*[\[\{]/gm, '')
    
    // Anciens nettoyages (conservés)
    .replace(/\*\*PARTIE\s+\d+[^*]*\*\*/g, '')
    .replace(/🔐\s*\*[a-f0-9]+\*/g, '')
    .replace(/🔒\s*[a-z0-9]+/g, '')
    .replace(/\([a-f0-9]{12,}\)/g, '')
    .replace(/[a-f0-9]{12,}/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    
    // 🚀 NOUVEAU : Nettoyer les lignes vides multiples
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 🚀 NOUVEAU : Filtrage ligne par ligne pour éliminer le JSON
  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    
    // Supprimer les lignes qui ressemblent à du JSON
    if (trimmed.match(/^["\{\}\[\],]/) || 
        trimmed.includes('reliability_score') ||
        trimmed.includes('strength_signals') ||
        trimmed.includes('weakness_signals') ||
        trimmed.includes('cognitive_signals') ||
        trimmed.includes('affective_indicators') ||
        trimmed.includes('unconscious_patterns') ||
        trimmed.includes('relationnal_risks') ||
        trimmed.includes('ideal_partner_traits') ||
        trimmed.includes('mirroring_warning') ||
        trimmed.includes('trait_observations') ||
        trimmed.match(/^"[^"]*":\s*/) ||
        trimmed === '{' || trimmed === '}' ||
        trimmed.startsWith('null,') ||
        trimmed.startsWith('],') ||
        trimmed.startsWith('},')) {
      return false;
    }
    
    // Garder les lignes avec du contenu significatif
    return trimmed.length > 10;
  });

  const result = lines.join('\n').trim();
  
  console.log('✅ parseEmotionalText - Output length:', result.length);
  console.log('✅ parseEmotionalText - Preview:', result.substring(0, 200));
  
  return result;
};

/**
 * Découpage intelligent pour mobile/desktop
 */
export const smartSplitParagraphs = (text: string): string[] => {
  if (!text) return [];

  // 1. Vérifier s'il y a déjà des doubles sauts de ligne (format desktop)
  if (text.includes('\n\n')) {
    console.log('📱 Format desktop détecté avec \\n\\n');
    return text.split('\n\n').filter(p => p.trim().length > 20);
  }

  console.log('📱 Format mobile détecté, découpage intelligent...');

  // 2. Découpage intelligent pour mobile (pas de \n\n)
  const sentences = text.split(/(?<=[.!?])\s+/);
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length === 0) continue;

    // Ajouter la phrase au paragraphe actuel
    currentParagraph += (currentParagraph ? ' ' : '') + trimmedSentence;

    // Critères de fin de paragraphe :
    // - Le paragraphe fait au moins 200 caractères ET
    // - La phrase se termine par un point fort (. ! ?) ET
    // - La prochaine phrase commence par une majuscule ou un mot clé
    const isLongEnough = currentParagraph.length >= 200;
    const endsWithStrongPunctuation = /[.!?]$/.test(trimmedSentence);
    const nextIndex = i + 1;
    const nextSentence = nextIndex < sentences.length ? sentences[nextIndex].trim() : '';
    const nextStartsWell = nextSentence.length > 0 && (
      /^[A-Z]/.test(nextSentence) || // Majuscule
      nextSentence.toLowerCase().startsWith('tu ') || // Adresse directe
      nextSentence.toLowerCase().startsWith('cette ') || // Nouvelle idée
      nextSentence.toLowerCase().startsWith('mais ') || // Transition
      nextSentence.toLowerCase().startsWith('il ') ||
      nextSentence.toLowerCase().startsWith('elle ') ||
      nextSentence.toLowerCase().startsWith('c\'est ') ||
      nextSentence.toLowerCase().startsWith('ton ') ||
      nextSentence.toLowerCase().startsWith('ta ')
    );

    // Fin de paragraphe si conditions remplies
    if (isLongEnough && endsWithStrongPunctuation && nextStartsWell) {
      paragraphs.push(currentParagraph);
      currentParagraph = '';
    }
    
    // Forcer la fin si le paragraphe devient trop long (> 800 caractères)
    else if (currentParagraph.length > 800 && endsWithStrongPunctuation) {
      paragraphs.push(currentParagraph);
      currentParagraph = '';
    }
  }

  // Ajouter le dernier paragraphe s'il reste du contenu
  if (currentParagraph.trim().length > 20) {
    paragraphs.push(currentParagraph);
  }

  console.log(`✅ Découpage mobile : ${paragraphs.length} paragraphes créés`);
  return paragraphs.filter(p => p.trim().length > 20);
};