#!/bin/bash

# Script de déploiement automatique sur Vercel
# Usage: ./deploy-vercel.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du frontend COOK-US sur Vercel"
echo "=============================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé.${NC}"
    echo "Assurez-vous d'être dans le répertoire Front-End"
    exit 1
fi

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI non trouvé. Installation...${NC}"
    npm install -g vercel
fi

# Vérifier que le code est commité
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Des changements non commités détectés.${NC}"
    read -p "Voulez-vous continuer quand même? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Déploiement annulé.${NC}"
        exit 1
    fi
fi

# Vérifier les variables d'environnement
echo -e "${YELLOW}📋 Vérification des variables d'environnement...${NC}"

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_API_URL"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "$var" .env.local 2>/dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Variables d'environnement manquantes:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo -e "${YELLOW}⚠️  Assurez-vous d'ajouter ces variables dans Vercel après le déploiement.${NC}"
fi

# Build local pour vérifier les erreurs
echo -e "${YELLOW}🔨 Build local en cours...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build local réussi!${NC}"
else
    echo -e "${RED}❌ Erreur lors du build local. Corrigez les erreurs avant de déployer.${NC}"
    exit 1
fi

# Déploiement sur Vercel
echo -e "${YELLOW}🚀 Déploiement sur Vercel...${NC}"
echo ""

# Options de déploiement
read -p "Déployer en production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DEPLOY_FLAG="--prod"
    echo -e "${GREEN}📦 Déploiement en production${NC}"
else
    DEPLOY_FLAG=""
    echo -e "${YELLOW}📦 Déploiement en preview${NC}"
fi

# Exécuter le déploiement
if vercel $DEPLOY_FLAG; then
    echo ""
    echo -e "${GREEN}✅ Déploiement réussi!${NC}"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "  1. Vérifiez votre application sur Vercel"
    echo "  2. Vérifiez que toutes les variables d'environnement sont configurées"
    echo "  3. Testez les fonctionnalités principales"
    echo "  4. Configurez un domaine personnalisé si nécessaire"
else
    echo -e "${RED}❌ Erreur lors du déploiement.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Terminé!${NC}"

