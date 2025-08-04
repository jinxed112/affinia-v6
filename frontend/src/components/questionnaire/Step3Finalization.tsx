// 🆕 VALIDATION SIMPLIFIÉE ET ROBUSTE
  const validateProfileIntegrity = (profileText: string, sessionId: string): boolean => {
    try {
      const cleanText = profileText.trim();
      
      // Vérifications de base
      if (cleanText.length < 800) {
        setProfileValidation({
          isValid: false,
          message: '❌ Le profil est trop court. Copie bien toute la réponse de l\'IA.'
        });
        return false;
      }

      // Chercher le code de validation : aff_[nombre]_[sessionId]
      const validationRegex = new RegExp(`aff_(\\d+)_${sessionId}`, 'i');
      const validationMatch = cleanText.match(validationRegex);
      
      if (!validationMatch) {
        setProfileValidation({
          isValid: false,
          message: '❌ Code de validation manquant. Assure-toi de copier toute la réponse.'
        });
        return false;
      }

      const expectedLength = parseInt(validationMatch[1]);
      const actualLength = cleanText.length;
      const lengthDiff = Math.abs(actualLength - expectedLength);
      
      // Tolérance de 5% pour les petites variations
      const tolerance = Math.max(50, expectedLength * 0.05);
      
      if (lengthDiff > tolerance) {
        setProfileValidation({
          isValid: false,
          message: `❌ Longueur incorrecte. Attendu: ${expectedLength}, reçu: ${actualLength}. Vérifie que tu as copié toute la réponse.`
        });
        return false;
      }

      // Vérifier que les sections essentielles sont présentes
      const hasAnalysis = /PARTIE\s*1|ANALYSE\s+PERSONNELLE/i.test(cleanText);
      const hasJson = /```\s*json|"reliability_score"|"strength_signals"/i.test(cleanText);
      
      if (!hasAnalysis) {
        setProfileValidation({
          isValid: false,
          message: '❌ Section d\'analyse manquante. Copie depuis le début de la réponse.'
        });
        return false;
      }

      if (!hasJson) {
        setProfileValidation({
          isValid: false,
          message: '❌ Données JSON manquantes. Copie jusqu\'à la fin de la réponse.'
        });
        return false;
      }

      // ✅ Tout est OK
      setProfileValidation({
        isValid: true,
        message: `✅ Profil valide ! Longueur: ${actualLength} caractères. Tu peux le sauvegarder.`
      });
      return true;
      
    } catch (error) {
      setProfileValidation({
        isValid: false,
        message: '❌ Erreur lors de la vérification. Réessaye.'
      });
      return false;
    }
  };

  // 🆕 FONCTION HANDLEVERIFYPROFILE SIMPLIFIÉE
  const handleVerifyProfile = async () => {
    if (!generatedProfile.trim()) {
      setProfileValidation({
        isValid: false,
        message: '❌ Aucun profil à vérifier.'
      });
      return;
    }

    // D'abord validation locale (rapide)
    const isLocallyValid = validateProfileIntegrity(generatedProfile, sessionId);
    
    // Si validation locale OK, essayer aussi l'API si disponible
    if (isLocallyValid) {
      try {
        await verifyProfileViaAPI(generatedProfile, sessionId);
      } catch (error) {
        console.log('⚠️ API validation failed, but local validation passed');
        // Ne pas écraser la validation locale réussie
      }
    }
  };