#!/bin/bash

# 🔧 SCRIPT DE CORRECTION DES IMPORTS AUTH MIDDLEWARE
# Corrige automatiquement tous les imports pour utiliser les nouveaux middleware

set -e  # Exit on any error

echo "🔧 CORRECTION DES IMPORTS AUTH MIDDLEWARE"
echo "========================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_fix() {
    echo -e "${YELLOW}🔧 $1${NC}"
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -d "src" ]; then
    echo "❌ Erreur: Exécutez ce script depuis le dossier backend/"
    exit 1
fi

print_step "Analyse des fichiers à corriger"

# Lister tous les fichiers concernés (exclure le dossier auth)
AFFECTED_FILES=$(grep -r "auth\.middleware" src --include="*.ts" | \
    grep -v "auth.middleware.old" | \
    grep -v "auth.middleware.enhanced" | \
    grep -v "src/modules/auth/" | \
    cut -d: -f1 | sort -u)

echo "Fichiers détectés à corriger :"
for file in $AFFECTED_FILES; do
    echo "  - $file"
done

print_step "Correction des imports dans les modules externes"

# 1. Corriger les imports authMiddleware
print_fix "Correction des imports authMiddleware"
find src -name "*.ts" \
    -not -path "src/modules/auth/*" \
    -exec sed -i "s|from '../auth/auth\.middleware';|from '../auth/auth.middleware.old';|g" {} \;

# 2. Corriger les imports AuthRequest  
print_fix "Correction des imports AuthRequest"
find src -name "*.ts" \
    -not -path "src/modules/auth/*" \
    -exec sed -i "s|import { AuthRequest } from '../auth/auth\.middleware';|import { AuthRequest } from '../auth/auth.middleware.old';|g" {} \;

# 3. Corriger les imports depuis middleware/
print_fix "Correction des imports depuis middleware/"
find src/middleware -name "*.ts" \
    -exec sed -i "s|from '../modules/auth/auth\.middleware';|from '../modules/auth/auth.middleware.old';|g" {} \;

# 4. Corriger les imports mixtes
print_fix "Correction des imports mixtes authMiddleware + AuthRequest"
find src -name "*.ts" \
    -not -path "src/modules/auth/*" \
    -exec sed -i "s|import { authMiddleware } from '../auth/auth\.middleware';|import { authMiddleware } from '../auth/auth.middleware.old';|g" {} \;

find src -name "*.ts" \
    -not -path "src/modules/auth/*" \
    -exec sed -i "s|import { AuthRequest } from '../auth/auth\.middleware';|import { AuthRequest } from '../auth/auth.middleware.old';|g" {} \;

# 5. Cas spéciaux avec imports multiples sur une ligne
print_fix "Correction des imports multiples"
find src -name "*.ts" \
    -not -path "src/modules/auth/*" \
    -exec sed -i "s|import { authMiddleware, AuthRequest } from '../auth/auth\.middleware';|import { authMiddleware, AuthRequest } from '../auth/auth.middleware.old';|g" {} \;

find src -name "*.ts" \
    -not -path "src/modules/auth/*" \
    -exec sed -i "s|import { AuthRequest, authMiddleware } from '../auth/auth\.middleware';|import { AuthRequest, authMiddleware } from '../auth/auth.middleware.old';|g" {} \;

print_step "Correction du fichier index.ts du module auth"

# 6. Corriger le fichier index.ts pour exporter depuis auth.middleware.old
print_fix "Mise à jour de src/modules/auth/index.ts"
cat > src/modules/auth/index.ts << 'EOF'
// Export des middleware d'authentification
export { authMiddleware, optionalAuthMiddleware, requireRole } from './auth.middleware.old'
export { enhancedAuthMiddleware } from './auth.middleware.enhanced'
export type { AuthRequest } from './auth.middleware.old'

// Export des services
export { authService } from './auth.service'
export { enhancedAuthService } from './auth.service.enhanced'

// Export des types
export * from './auth.types'

// Export des schémas de validation
export * from './auth.schemas'
EOF

print_step "Correction du fichier routes.ts du module auth"

# 7. Corriger auth.routes.ts pour utiliser le bon middleware
print_fix "Mise à jour de src/modules/auth/auth.routes.ts"
sed -i "s|import { requireAuth } from './auth\.middleware';|import { requireAuth } from './auth.middleware.old';|g" src/modules/auth/auth.routes.ts

print_step "Correction des imports dans auth.controller.ts"

# 8. Corriger auth.controller.ts
print_fix "Mise à jour de src/modules/auth/auth.controller.ts"
sed -i "s|import { AuthRequest } from './auth\.middleware';|import { AuthRequest } from './auth.middleware.old';|g" src/modules/auth/auth.controller.ts

print_step "Vérification des corrections"

# Vérifier qu'il n'y a plus d'imports problématiques
REMAINING=$(grep -r "from.*auth\.middleware';" src --include="*.ts" | \
    grep -v "auth.middleware.old" | \
    grep -v "auth.middleware.enhanced" | \
    wc -l)

if [ $REMAINING -eq 0 ]; then
    print_success "Tous les imports ont été corrigés !"
else
    print_warning "$REMAINING imports problématiques restants :"
    grep -r "from.*auth\.middleware';" src --include="*.ts" | \
        grep -v "auth.middleware.old" | \
        grep -v "auth.middleware.enhanced"
fi

print_step "Vérification de la syntaxe TypeScript"

# Test rapide de compilation
if command -v tsc >/dev/null 2>&1; then
    print_fix "Vérification TypeScript avec tsc --noEmit"
    if tsc --noEmit; then
        print_success "Aucune erreur TypeScript détectée"
    else
        print_warning "Erreurs TypeScript détectées - vérifiez manuellement"
    fi
else
    print_warning "tsc non disponible - ignoré"
fi

print_step "Résumé des corrections"

echo ""
echo "📋 FICHIERS MODIFIÉS :"
echo "====================="

# Lister les fichiers modifiés
for file in $AFFECTED_FILES; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    fi
done

echo ""
echo "📋 FICHIERS SPÉCIAUX MODIFIÉS :"
echo "==============================="
echo "✅ src/modules/auth/index.ts"
echo "✅ src/modules/auth/auth.routes.ts" 
echo "✅ src/modules/auth/auth.controller.ts"

print_step "Test de démarrage du serveur"

echo ""
echo "🚀 PRÊT POUR LE TEST !"
echo "====================="
echo ""
echo "Maintenant lancez :"
echo "  npm run dev"
echo ""
echo "Si des erreurs persistent, vérifiez manuellement :"
echo "  grep -r 'auth\\.middleware' src --include='*.ts' | grep -v '\\.old' | grep -v '\\.enhanced'"

print_success "CORRECTION TERMINÉE !"

echo ""
echo "🎯 ÉTAPES SUIVANTES :"
echo "1. npm run dev (test backend)"
echo "2. cd ../frontend && npm run dev (test frontend)" 
echo "3. Tester l'authentification"
echo ""
print_success "MODULE AUTH PRÊT ! 🚀"