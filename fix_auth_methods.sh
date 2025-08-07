#!/bin/bash

# =================================================================
# 🔧 SCRIPT CORRECTION AUTH - MÉTHODES MANQUANTES
# =================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "$1"
}

log_success() {
    log "${GREEN}✅ $1${NC}"
}

log_info() {
    log "${BLUE}ℹ️  $1${NC}"
}

log_error() {
    log "${RED}❌ $1${NC}"
}

# =================================================================
# CORRECTION AUTH.SERVICE.TS
# =================================================================

fix_auth_service() {
    log_info "Correction de auth.service.ts..."
    
    local service_file="backend/src/modules/auth/auth.service.ts"
    
    if [[ ! -f "$service_file" ]]; then
        log_error "Fichier $service_file non trouvé"
        return 1
    fi
    
    # Créer backup
    cp "$service_file" "${service_file}.backup"
    
    # Vérifier si les méthodes existent déjà
    if grep -q "getUserById" "$service_file"; then
        log_info "Méthodes déjà présentes dans auth.service.ts"
        return 0
    fi
    
    # Ajouter les méthodes avant le dernier export
    cat >> "$service_file" << 'EOF'

  /**
   * Récupère un utilisateur par ID
   */
  async getUserById(userId: string) {
    try {
      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('getUserById error:', error);
      throw error;
    }
  }

  /**
   * Rafraîchit le token
   */
  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken
      });
      
      if (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Invalid refresh token');
      }
      
      return {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: data.user
      };
    } catch (error) {
      console.error('refreshToken error:', error);
      throw error;
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(userId: string) {
    try {
      // Log de l'action de déconnexion
      console.log(`User ${userId} logged out`);
      
      // Ici on pourrait invalider des tokens dans une cache/blacklist
      // Pour l'instant, on se contente du log
      
      return { success: true };
    } catch (error) {
      console.error('logout error:', error);
      throw error;
    }
  }

  /**
   * Récupère la session
   */
  async getSession(userId: string) {
    try {
      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (error || !user) {
        return null;
      }
      
      return {
        user,
        isActive: true,
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      console.error('getSession error:', error);
      throw error;
    }
  }
EOF

    log_success "Méthodes ajoutées dans auth.service.ts"
}

# =================================================================
# CORRECTION AUTH.CONTROLLER.TS
# =================================================================

fix_auth_controller() {
    log_info "Correction de auth.controller.ts..."
    
    local controller_file="backend/src/modules/auth/auth.controller.ts"
    
    if [[ ! -f "$controller_file" ]]; then
        log_error "Fichier $controller_file non trouvé"
        return 1
    fi
    
    # Créer backup
    cp "$controller_file" "${controller_file}.backup"
    
    # Vérifier si les méthodes existent déjà
    if grep -q "getCurrentUser" "$controller_file"; then
        log_info "Méthodes déjà présentes dans auth.controller.ts"
        return 0
    fi
    
    # Trouver la ligne avec "export const authController" et insérer avant
    local export_line=$(grep -n "export const authController" "$controller_file" | cut -d: -f1)
    
    if [[ -z "$export_line" ]]; then
        log_error "Export authController non trouvé dans $controller_file"
        return 1
    fi
    
    # Créer un fichier temporaire avec les nouvelles méthodes
    local temp_file=$(mktemp)
    
    # Copier tout jusqu'à la ligne d'export (exclue)
    head -n $((export_line - 1)) "$controller_file" > "$temp_file"
    
    # Ajouter les nouvelles méthodes
    cat >> "$temp_file" << 'EOF'

  /**
   * Récupère l'utilisateur actuel
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      const user = await authService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ user });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Rafraîchit le token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (userId) {
        await authService.logout(userId);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Récupère la session actuelle
   */
  async getSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'No active session' });
        return;
      }
      const session = await authService.getSession(userId);
      res.json({ session });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

EOF
    
    # Ajouter le reste du fichier (à partir de la ligne d'export)
    tail -n +$export_line "$controller_file" >> "$temp_file"
    
    # Remplacer le fichier original
    mv "$temp_file" "$controller_file"
    
    log_success "Méthodes ajoutées dans auth.controller.ts"
}

# =================================================================
# VALIDATION
# =================================================================

validate_corrections() {
    log_info "Validation des corrections..."
    
    local service_file="backend/src/modules/auth/auth.service.ts"
    local controller_file="backend/src/modules/auth/auth.controller.ts"
    
    # Vérifier auth.service.ts
    if grep -q "getUserById" "$service_file" && grep -q "refreshToken" "$service_file"; then
        log_success "Méthodes présentes dans auth.service.ts"
    else
        log_error "Méthodes manquantes dans auth.service.ts"
        return 1
    fi
    
    # Vérifier auth.controller.ts
    if grep -q "getCurrentUser" "$controller_file" && grep -q "refreshToken" "$controller_file"; then
        log_success "Méthodes présentes dans auth.controller.ts"
    else
        log_error "Méthodes manquantes dans auth.controller.ts"
        return 1
    fi
    
    log_success "Toutes les corrections validées !"
}

# =================================================================
# FONCTION PRINCIPALE
# =================================================================

main() {
    log "${BLUE}🔧 CORRECTION AUTH - MÉTHODES MANQUANTES${NC}"
    log "==========================================="
    
    # Vérifier qu'on est dans le bon répertoire
    if [[ ! -d "backend/src/modules/auth" ]]; then
        log_error "Répertoire backend/src/modules/auth non trouvé"
        log_error "Exécutez ce script depuis la racine du projet Affinia"
        exit 1
    fi
    
    # Appliquer les corrections
    fix_auth_service
    fix_auth_controller
    validate_corrections
    
    log ""
    log_success "🎉 CORRECTION AUTH TERMINÉE !"
    log ""
    log_info "Redémarrez maintenant le serveur :"
    log "${YELLOW}cd backend && npm run dev${NC}"
    log ""
    log_info "💾 Backups créés :"
    log "   - backend/src/modules/auth/auth.service.ts.backup"
    log "   - backend/src/modules/auth/auth.controller.ts.backup"
}

# Exécution
main "$@"