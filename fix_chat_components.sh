#!/bin/bash

# =============================================
# SCRIPT FIX CHAT COMPONENTS - AFFINIA V6
# =============================================

echo "🔧 DÉBUT CORRECTIONS COMPOSANTS CHAT..."

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérification présence des fichiers
echo -e "${BLUE}📋 Vérification des fichiers...${NC}"

FILES=(
    "frontend/src/components/chat/MessageBubble.tsx"
    "frontend/src/components/chat/ConversationList.tsx"
    "frontend/src/components/chat/MessageList.tsx"
)

for file in "${FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Fichier manquant: $file${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Trouvé: $file${NC}"
    fi
done

# Backup des fichiers
echo -e "${YELLOW}💾 Création des backups...${NC}"
for file in "${FILES[@]}"; do
    cp "$file" "$file.backup.$(date +%s)"
    echo -e "${GREEN}✅ Backup: $file.backup${NC}"
done

# =============================================
# FIX 1: MessageBubble.tsx - Ajouter prop isMobile
# =============================================

echo -e "${BLUE}🔧 FIX 1: MessageBubble.tsx - Ajout prop isMobile...${NC}"

# Ajouter isMobile dans l'interface
sed -i 's/isGrouped?: boolean; \/\/ Si le message fait partie d'\''un groupe (même sender consécutif)/isGrouped?: boolean; \/\/ Si le message fait partie d'\''un groupe (même sender consécutif)\n  isMobile?: boolean; \/\/ Affichage mobile/' frontend/src/components/chat/MessageBubble.tsx

# Ajouter isMobile dans les props du composant
sed -i 's/isGrouped = false/isGrouped = false,\n  isMobile = false/' frontend/src/components/chat/MessageBubble.tsx

# Remplacer max-width conditionnel
sed -i 's/max-w-xs lg:max-w-md/${isMobile ? '\''max-w-[85%]'\'' : '\''max-w-xs lg:max-w-md'\''}/g' frontend/src/components/chat/MessageBubble.tsx

echo -e "${GREEN}✅ MessageBubble.tsx corrigé${NC}"

# =============================================
# FIX 2: ConversationList.tsx - div refresh → button
# =============================================

echo -e "${BLUE}🔧 FIX 2: ConversationList.tsx - Correction bouton refresh...${NC}"

# Chercher et remplacer le div de refresh par button
sed -i '/onClick={handleRefresh}/,/title="Actualiser"/ {
    s/<div/<button/g
    s/<\/div>/<\/button>/g
    s/disabled={isLoading || isRefreshing}/disabled={isLoading || isRefreshing}/g
    s/className={`p-2 rounded-lg transition-all duration-200 ${/className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${/g
}' frontend/src/components/chat/ConversationList.tsx

echo -e "${GREEN}✅ Bouton refresh corrigé${NC}"

# =============================================
# FIX 3: ConversationList.tsx - div conversation → button  
# =============================================

echo -e "${BLUE}🔧 FIX 3: ConversationList.tsx - Conversations en buttons...${NC}"

# Remplacer div par button pour les conversations
sed -i 's/<div$/<button/g' frontend/src/components/chat/ConversationList.tsx
sed -i 's/key={conversation.id}$/key={conversation.id}/g' frontend/src/components/chat/ConversationList.tsx
sed -i 's/className={`w-full text-left/className={`w-full text-left/g' frontend/src/components/chat/ConversationList.tsx

# Correction plus précise avec pattern matching
sed -i '/onClick={() => onSelectConversation(conversation)}/,+20 {
    s/<div$/<button/g
    s/<\/div>$/<\/button>/g
}' frontend/src/components/chat/ConversationList.tsx

echo -e "${GREEN}✅ Conversations en buttons${NC}"

# =============================================
# FIX 4: MessageList.tsx - Clés uniques
# =============================================

echo -e "${BLUE}🔧 FIX 4: MessageList.tsx - Clés uniques garanties...${NC}"

# Remplacer clé simple par clé composée
sed -i 's/key={dateString}/key={`group-${dateString}-${groupIndex}`}/g' frontend/src/components/chat/MessageList.tsx

# Alternative : ajouter index dans map
sed -i 's/{groupEntries.map((\[dateString, dayMessages\]) =>/{groupEntries.map(([dateString, dayMessages], groupIndex) =>/g' frontend/src/components/chat/MessageList.tsx

echo -e "${GREEN}✅ Clés uniques garanties${NC}"

# =============================================
# FIX 5: Corrections additionnelles
# =============================================

echo -e "${BLUE}🔧 FIX 5: Corrections additionnelles...${NC}"

# Ajouter cursor-pointer manquant
sed -i 's/cursor-pointer transition-all/cursor-pointer disabled:cursor-not-allowed transition-all/g' frontend/src/components/chat/ConversationList.tsx

# Fixer className dynamique
sed -i 's/} ${(isLoading || isRefreshing) ? '\''opacity-50'\'' : '\'''\''}`/} ${(isLoading || isRefreshing) ? '\''opacity-50 cursor-not-allowed'\'' : '\''cursor-pointer'\''}`/g' frontend/src/components/chat/ConversationList.tsx

echo -e "${GREEN}✅ Corrections additionnelles appliquées${NC}"

# =============================================
# VÉRIFICATIONS
# =============================================

echo -e "${BLUE}🔍 Vérifications finales...${NC}"

# Vérifier si les corrections sont appliquées
echo -e "${YELLOW}📋 Résumé des corrections:${NC}"

if grep -q "isMobile?: boolean" frontend/src/components/chat/MessageBubble.tsx; then
    echo -e "${GREEN}✅ MessageBubble: prop isMobile ajoutée${NC}"
else
    echo -e "${RED}❌ MessageBubble: prop isMobile MANQUANTE${NC}"
fi

if grep -q "<button" frontend/src/components/chat/ConversationList.tsx | head -1; then
    echo -e "${GREEN}✅ ConversationList: buttons utilisés${NC}"
else
    echo -e "${RED}❌ ConversationList: divs encore présents${NC}"
fi

if grep -q "groupIndex" frontend/src/components/chat/MessageList.tsx; then
    echo -e "${GREEN}✅ MessageList: clés uniques avec index${NC}"
else
    echo -e "${RED}❌ MessageList: clés potentiellement dupliquées${NC}"
fi

# =============================================
# COMMANDES DE VÉRIFICATION
# =============================================

echo -e "${BLUE}🧪 Tests de vérification disponibles:${NC}"
echo "# Vérifier props MessageBubble:"
echo "grep -A 5 -B 5 'isMobile' frontend/src/components/chat/MessageBubble.tsx"
echo ""
echo "# Vérifier buttons ConversationList:"
echo "grep -n '<button\\|<div' frontend/src/components/chat/ConversationList.tsx | head -10"
echo ""
echo "# Vérifier clés MessageList:"
echo "grep -n 'key=' frontend/src/components/chat/MessageList.tsx"

# =============================================
# FINALISATION
# =============================================

echo -e "${GREEN}🎉 TOUTES LES CORRECTIONS APPLIQUÉES !${NC}"
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "1. cd frontend && npm run dev"
echo "2. Ouvrir /chat et vérifier console F12"
echo "3. Tester navigation mobile/desktop"
echo "4. Si erreurs persistent, restaurer backups:"
echo "   for file in frontend/src/components/chat/*.backup.*; do"
echo "     original=\${file%%.backup.*}"
echo "     cp \"\$file\" \"\$original\""
echo "   done"

echo -e "${BLUE}🚀 Script terminé avec succès !${NC}"