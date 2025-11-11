# 🚀 Guide de Déploiement Frontend sur Vercel

Ce guide vous accompagne étape par étape pour déployer le frontend COOK-US sur Vercel.

## 📋 Prérequis

- ✅ Un compte GitHub/GitLab/Bitbucket avec votre code
- ✅ Un compte Vercel (gratuit) : [vercel.com](https://vercel.com)
- ✅ Votre backend déployé sur Render (ou autre plateforme)
- ✅ Votre fichier `.env.local` local avec toutes les variables d'environnement

---

## 🎯 Étape 1 : Préparer votre Repository

### 1.1 Vérifier que votre code est sur GitHub

Assurez-vous que votre code frontend est bien poussé sur GitHub :

```bash
cd Front-End
git status
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 1.2 Vérifier le .gitignore

Votre `.env.local` doit être dans `.gitignore` (déjà fait ✅). **NE JAMAIS** commiter votre fichier `.env.local` !

---

## 🎯 Étape 2 : Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"**
3. Connectez-vous avec votre compte GitHub/GitLab/Bitbucket
4. Autorisez Vercel à accéder à vos repositories

---

## 🎯 Étape 3 : Créer un nouveau Projet

1. Dans le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Sélectionnez votre repository **COOK-US-**
3. Cliquez sur **"Import"**

---

## 🎯 Étape 4 : Configurer le Projet

### Configuration de base :

- **Framework Preset** : `Next.js` (détecté automatiquement)
- **Root Directory** : `Front-End` ⚠️ **IMPORTANT** : Spécifiez `Front-End` car votre code est dans un sous-dossier
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)

### ⚠️ Configuration importante :

**Root Directory** : `Front-End`

Vercel doit savoir que votre code Next.js est dans le dossier `Front-End/`, pas à la racine.

---

## 🎯 Étape 5 : Configurer les Variables d'Environnement

Dans la section **"Environment Variables"**, ajoutez **TOUTES** les variables de votre fichier `.env.local` :

### 📋 Variables essentielles :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key

# Backend API (URL de votre backend Render)
NEXT_PUBLIC_API_URL=https://votre-backend.onrender.com

# Stripe (si utilisé)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_... (pour production)

# Mapbox (si utilisé)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=votre_token_mapbox

# Autres variables publiques (préfixées par NEXT_PUBLIC_)
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

### ⚠️ Notes importantes :

1. **Variables publiques** : Seules les variables préfixées par `NEXT_PUBLIC_` sont accessibles côté client
2. **Variables privées** : Les autres variables ne sont accessibles que côté serveur (API routes)
3. **Backend URL** : Remplacez `https://votre-backend.onrender.com` par l'URL réelle de votre backend déployé

### 💡 Comment ajouter les variables :

1. Dans Vercel, allez dans **Settings** → **Environment Variables**
2. Cliquez sur **"Add New"**
3. Ajoutez chaque variable une par une
4. Sélectionnez les environnements : **Production**, **Preview**, **Development**

---

## 🎯 Étape 6 : Déployer

1. Cliquez sur **"Deploy"**
2. Vercel va :
   - Cloner votre repository
   - Installer les dépendances (`npm install`)
   - Builder le projet (`npm run build`)
   - Déployer l'application
3. Attendez 2-5 minutes pour le premier déploiement
4. Surveillez les logs pour voir si tout se passe bien

---

## 🎯 Étape 7 : Vérifier le Déploiement

### 7.1 Vérifier les logs

Dans l'onglet **"Deployments"** de Vercel, cliquez sur votre déploiement pour voir les logs. Vous devriez voir :

```
✓ Build completed successfully
✓ Deployed to production
```

### 7.2 Tester l'application

Vercel vous donne une URL comme : `https://cook-us-frontend.vercel.app`

Testez l'application :
- ✅ La page d'accueil se charge
- ✅ L'authentification fonctionne
- ✅ Les appels API vers le backend fonctionnent
- ✅ Les fonctionnalités principales sont opérationnelles

### 7.3 Vérifier les erreurs

Si vous avez des erreurs :
- Vérifiez les logs de déploiement
- Vérifiez que toutes les variables d'environnement sont bien configurées
- Vérifiez que l'URL du backend est correcte et accessible

---

## 🔧 Configuration Avancée

### Domaine personnalisé

1. Allez dans **Settings** → **Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

### Variables d'environnement par environnement

Vous pouvez avoir des variables différentes pour :
- **Production** : Variables de production
- **Preview** : Variables de staging/test
- **Development** : Variables de développement local

### Build optimizations

Vercel optimise automatiquement :
- ✅ Images Next.js
- ✅ Code splitting
- ✅ Static generation
- ✅ Edge functions (si utilisées)

---

## 🐛 Problèmes Courants

### ❌ "Module not found"

→ Vérifiez que **Root Directory** = `Front-End`
→ Vérifiez que toutes les dépendances sont dans `package.json`

### ❌ "Environment variable not found"

→ Vérifiez que toutes les variables sont ajoutées dans Vercel
→ Vérifiez que les variables publiques ont le préfixe `NEXT_PUBLIC_`

### ❌ "API calls failing"

→ Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers votre backend déployé
→ Vérifiez que le backend est accessible (pas en sommeil)
→ Vérifiez les CORS dans votre backend

### ❌ "Build failed"

→ Vérifiez les logs de build dans Vercel
→ Testez localement : `npm run build`
→ Vérifiez que TypeScript compile sans erreur

---

## ✅ Checklist

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Vercel avec Root Directory = `Front-End`
- [ ] Toutes les variables d'environnement ajoutées
- [ ] `NEXT_PUBLIC_API_URL` pointe vers le backend déployé
- [ ] Build réussi
- [ ] Application accessible et fonctionnelle
- [ ] Authentification fonctionne
- [ ] Appels API fonctionnent

---

## 🎉 C'est fait !

Votre frontend est maintenant en ligne !

**URL de votre application** : `https://votre-app.vercel.app`

### Prochaines étapes :

1. **Configurer le domaine personnalisé** (optionnel)
2. **Mettre à jour le backend** : Ajoutez l'URL Vercel dans `FRONTEND_URL` pour les CORS
3. **Tester toutes les fonctionnalités** en production
4. **Configurer les analytics** (optionnel) dans Vercel

---

## 📝 Notes Importantes

### Variables d'environnement

- Les variables avec `NEXT_PUBLIC_` sont exposées au client (dans le navigateur)
- Les autres variables ne sont accessibles que côté serveur
- Ne mettez JAMAIS de secrets dans les variables `NEXT_PUBLIC_`

### Backend CORS

Assurez-vous que votre backend accepte les requêtes depuis votre domaine Vercel :

```env
FRONTEND_URL=https://votre-app.vercel.app
```

### Déploiements automatiques

Vercel déploie automatiquement :
- ✅ Chaque push sur `main` → Production
- ✅ Chaque pull request → Preview deployment
- ✅ Chaque commit → Preview deployment

---

## 🔗 Liens Utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

