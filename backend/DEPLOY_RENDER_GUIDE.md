# 🚀 Guide Rapide : Déployer sur Render

## ⚡ Démarrage Rapide (5 minutes)

### 1️⃣ Préparer votre code
```bash
# Assurez-vous que tout est commité
cd backend
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2️⃣ Créer le service sur Render

1. **Allez sur** [render.com](https://render.com) et connectez-vous avec GitHub
2. Cliquez sur **"New +"** → **"Web Service"**
3. **Connectez votre repo** COOK-US-
4. **Configurez** :

```
Name: cook-us-backend
Region: Frankfurt (ou votre choix)
Branch: main
Root Directory: backend  ⚠️ TRÈS IMPORTANT !
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 3️⃣ Ajouter les Variables d'Environnement

Dans la section **"Environment"**, ajoutez **TOUTES** les variables de votre fichier `.env` local :

📋 **Liste des variables à copier depuis votre .env :**

```env
# Server
# Note: Localement backend=5000, frontend=3000
# Sur Render, le port est géré automatiquement
PORT=10000
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
MAPBOX_ACCESS_TOKEN=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
RESEND_FROM_NAME=...
TWILIO_ACCOUNT_SID=... (si utilisé)
TWILIO_AUTH_TOKEN=... (si utilisé)
TWILIO_PHONE_NUMBER=... (si utilisé)
FIREBASE_PROJECT_ID=... (si utilisé)
FIREBASE_PRIVATE_KEY=... (si utilisé)
FIREBASE_CLIENT_EMAIL=... (si utilisé)
INSEE_API_KEY=... (si utilisé)
INSEE_API_SECRET=... (si utilisé)
# Frontend URL (IMPORTANT pour CORS)
# Mettez l'URL de votre frontend déployé (ex: Vercel)
# Localement: http://localhost:3000
FRONTEND_URL=https://votre-frontend.vercel.app
```

💡 **Astuce** : Ouvrez votre fichier `.env` local et copiez-collez chaque ligne dans Render.

### 4️⃣ Déployer

1. Cliquez sur **"Create Web Service"**
2. Attendez 5-10 minutes
3. Vérifiez les logs pour voir si tout fonctionne

### 5️⃣ Tester

Votre API sera disponible sur : `https://votre-service.onrender.com`

Testez : `https://votre-service.onrender.com/health`

---

## ⚠️ Points Importants

### Root Directory = `backend`
Render doit savoir que votre code est dans le dossier `backend/`, pas à la racine du repo.

### Port
- **Localement** : Backend = `5000`, Frontend = `3000`
- **Sur Render** : Render assigne automatiquement le port (généralement `10000`). Votre code utilise `process.env.PORT ?? '5000'`, donc il s'adaptera automatiquement.

### Plan Gratuit
- ✅ Gratuit
- ⚠️ Le service s'endort après 15 min d'inactivité
- ⚠️ Le premier appel après l'endormissement prend 30-60 secondes

**Solution** : Utilisez [UptimeRobot](https://uptimerobot.com) (gratuit) pour ping votre service toutes les 5 minutes.

---

## 🐛 Problèmes Courants

### ❌ "Cannot find module"
→ Vérifiez que **Root Directory** = `backend`

### ❌ Service ne démarre pas
→ Vérifiez les logs dans Render
→ Vérifiez que toutes les variables d'environnement sont bien ajoutées

### ❌ Erreur de build
→ Testez localement : `npm run build`
→ Vérifiez que TypeScript compile sans erreur

---

## ✅ Checklist

- [ ] Code poussé sur GitHub
- [ ] Service créé sur Render avec Root Directory = `backend`
- [ ] Build Command : `npm install && npm run build`
- [ ] Start Command : `npm start`
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Service déployé avec succès
- [ ] `/health` répond correctement
- [ ] URL du backend notée pour le frontend

---

## 🎉 C'est fait !

Votre backend est maintenant en ligne ! 

**URL de votre API** : `https://votre-service.onrender.com`

Utilisez cette URL dans votre frontend pour les appels API.

---

## 📝 Prochaines Étapes

1. **Configurer les webhooks Stripe** avec votre nouvelle URL
2. **Mettre à jour le frontend** avec l'URL du backend
3. **Tester** tous les endpoints importants

