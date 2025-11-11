# 🚀 Guide de Déploiement sur Render

Ce guide vous accompagne étape par étape pour déployer le backend COOK-US sur Render.

## 📋 Prérequis

- ✅ Un compte GitHub/GitLab/Bitbucket avec votre code
- ✅ Un compte Render (gratuit) : [render.com](https://render.com)
- ✅ Votre fichier `.env` local avec toutes les variables d'environnement

---

## 🎯 Étape 1 : Préparer votre Repository

### 1.1 Vérifier que votre code est sur GitHub

Assurez-vous que votre code est bien poussé sur GitHub :
```bash
git status
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Vérifier le .gitignore

Votre `.env` doit être dans `.gitignore` (déjà fait ✅). **NE JAMAIS** commiter votre fichier `.env` !

---

## 🎯 Étape 2 : Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started for Free"**
3. Connectez-vous avec votre compte GitHub/GitLab/Bitbucket
4. Autorisez Render à accéder à vos repositories

---

## 🎯 Étape 3 : Créer un nouveau Web Service

1. Dans le dashboard Render, cliquez sur **"New +"**
2. Sélectionnez **"Web Service"**
3. Connectez votre repository GitHub
4. Sélectionnez le repository **COOK-US-**
5. Cliquez sur **"Connect"**

---

## 🎯 Étape 4 : Configurer le Service

### Configuration de base :

- **Name** : `cook-us-backend` (ou le nom de votre choix)
- **Region** : Choisissez la région la plus proche (ex: `Frankfurt` pour l'Europe)
- **Branch** : `main` (ou votre branche principale)
- **Root Directory** : `backend` ⚠️ **IMPORTANT** : Spécifiez `backend` car votre code est dans un sous-dossier
- **Runtime** : `Node`
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm start`

### ⚠️ Configuration importante :

**Root Directory** : `backend`

Render doit savoir que votre code est dans le dossier `backend/`, pas à la racine.

---

## 🎯 Étape 5 : Configurer les Variables d'Environnement

Dans la section **"Environment"**, ajoutez toutes les variables de votre fichier `.env` :

### Variables obligatoires :

```env
# Server
# Note: Render gère automatiquement le port en production
# Vous pouvez laisser PORT vide ou mettre 10000 (Render l'utilisera automatiquement)
# Localement, votre backend tourne sur le port 5000
PORT=10000
NODE_ENV=production

# Supabase
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# JWT
JWT_SECRET=votre_secret_jwt_ultra_securise
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour tester)
STRIPE_PUBLISHABLE_KEY=pk_live_... (ou pk_test_... pour tester)
STRIPE_WEBHOOK_SECRET=whsec_...

# Mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ1...

# Resend (Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@cook-us.com
RESEND_FROM_NAME=Cook US

# Twilio (SMS) - Optionnel
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...

# Firebase (Push Notifications) - Optionnel
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# INSEE API - Optionnel
INSEE_API_KEY=...
INSEE_API_SECRET=...

# Frontend URL (IMPORTANT pour CORS et les liens dans les notifications)
# Mettez l'URL de votre frontend déployé (ex: Vercel)
# Localement: http://localhost:3000
FRONTEND_URL=https://votre-frontend.vercel.app
```

### 📝 Comment ajouter les variables :

1. Dans la section **"Environment"** de Render
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez chaque variable une par une depuis votre fichier `.env` local
4. **Copiez-collez** les valeurs de votre `.env` local

⚠️ **Note sur le PORT** : 
- **Localement** : Votre backend tourne sur le port `5000` et votre frontend sur `3000`
- **Sur Render** : Render assigne automatiquement le port. Vous pouvez :
  - Laisser `PORT=10000` (valeur recommandée)
  - Ou laisser Render le gérer automatiquement (il utilisera la variable `PORT` de votre `.env` ou assignera un port dynamique)
  
Votre code utilise déjà `process.env.PORT ?? '5000'`, donc il s'adaptera automatiquement.

---

## 🎯 Étape 6 : Plan de Service

- **Free Plan** : Gratuit, mais le service s'endort après 15 minutes d'inactivité
- **Starter Plan** : $7/mois, toujours actif

Pour commencer, choisissez **"Free"**. Vous pourrez upgrader plus tard.

---

## 🎯 Étape 7 : Déployer

1. Cliquez sur **"Create Web Service"**
2. Render va :
   - Cloner votre repository
   - Installer les dépendances (`npm install`)
   - Builder le projet (`npm run build`)
   - Démarrer le serveur (`npm start`)
3. Attendez 5-10 minutes pour le premier déploiement
4. Surveillez les logs pour voir si tout se passe bien

---

## 🎯 Étape 8 : Vérifier le Déploiement

### 8.1 Vérifier les logs

Dans l'onglet **"Logs"** de Render, vous devriez voir :
```
🚀 Server is running on port 10000
📦 Environment: production
🌐 Health check: http://localhost:10000/health
```

**Note** : Le port affiché dans les logs peut varier. Render assigne automatiquement le port, et votre code utilise `process.env.PORT` qui sera correctement configuré par Render.

### 8.2 Tester l'API

Render vous donne une URL comme : `https://cook-us-backend.onrender.com`

Testez l'endpoint de santé :
```
https://votre-service.onrender.com/health
```

Vous devriez recevoir une réponse JSON.

### 8.3 Tester un endpoint

Essayez un endpoint de votre API, par exemple :
```
https://votre-service.onrender.com/api/docs
```
(pour Swagger si configuré)

---

## 🔧 Configuration des Webhooks Stripe

Une fois votre backend déployé, configurez les webhooks Stripe :

1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. **Add endpoint**
4. URL : `https://votre-service.onrender.com/api/webhooks/stripe`
5. Sélectionnez les événements à écouter
6. Copiez le **Signing secret** et ajoutez-le dans Render comme `STRIPE_WEBHOOK_SECRET`

---

## 🐛 Résolution de Problèmes

### Erreur : "Cannot find module"

**Solution** : Vérifiez que le **Root Directory** est bien `backend`

### Erreur : "Port already in use"

**Solution** : Render utilise automatiquement le port via `PORT` env var. Assurez-vous que votre code utilise `process.env.PORT`

### Service qui ne démarre pas

1. Vérifiez les logs dans Render
2. Vérifiez que toutes les variables d'environnement sont bien configurées
3. Vérifiez que `npm run build` fonctionne localement

### Service qui s'endort (Free Plan)

Sur le plan gratuit, Render endort votre service après 15 minutes d'inactivité. Le premier appel après l'endormissement peut prendre 30-60 secondes.

**Solutions** :
- Utiliser un service de "ping" gratuit (UptimeRobot, etc.) pour maintenir le service actif
- Upgrader vers le plan Starter ($7/mois)

---

## 📝 Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Compte Render créé
- [ ] Web Service créé avec Root Directory = `backend`
- [ ] Build Command : `npm install && npm run build`
- [ ] Start Command : `npm start`
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Service déployé avec succès
- [ ] Health check fonctionne
- [ ] Webhooks Stripe configurés
- [ ] URL du backend notée pour le frontend

---

## 🎉 C'est fait !

Votre backend est maintenant déployé sur Render ! 

L'URL de votre API sera quelque chose comme :
```
https://cook-us-backend.onrender.com
```

Utilisez cette URL dans votre frontend pour les appels API.

---

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [Render Pricing](https://render.com/pricing)
- [Node.js on Render](https://render.com/docs/node)

