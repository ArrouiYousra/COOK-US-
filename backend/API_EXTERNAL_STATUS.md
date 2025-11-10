# 📊 État des APIs Externes - COOK US

## ✅ **DÉJÀ INSTALLÉ ET CONFIGURÉ**

### 1. 🗺️ **Mapbox API** ✅
- **Package** : `@mapbox/mapbox-sdk` (^0.16.2)
- **Service** : `backend/src/core/services/mapbox.service.ts`
- **Fonctionnalités** :
  - ✅ Geocoding API (adresse ↔ coordonnées GPS)
  - ✅ Directions API (itinéraires, temps, distance)
  - ✅ Matrix API (calcul de distances)
- **Configuration** : `MAPBOX_ACCESS_TOKEN` dans `.env`
- **Status** : ✅ **OPÉRATIONNEL**

### 2. 💳 **Stripe API** ✅
- **Package** : `stripe` (^17.3.1)
- **Service** : `backend/src/core/services/stripe.service.ts`
- **Fonctionnalités** :
  - ✅ Payment Intents (paiements sécurisés)
  - ✅ Transfers (virements aux cuisiniers)
  - ✅ Refunds (remboursements)
  - ✅ Webhooks (suivi des paiements)
- **Configuration** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` dans `.env`
- **Status** : ✅ **OPÉRATIONNEL** (clés à ajouter)

### 3. ☁️ **Supabase** ✅
- **Package** : `@supabase/supabase-js` (^2.80.0)
- **Configuration** : `backend/src/config/supabaseClient.ts`
- **Fonctionnalités incluses** :
  - ✅ **Base de données PostgreSQL** (avec PostGIS)
  - ✅ **Supabase Realtime** (notifications temps réel) - `@supabase/realtime-js` (2.80.0)
  - ✅ **Supabase Storage** (stockage fichiers) - `@supabase/storage-js` (2.80.0)
  - ✅ **Supabase Auth** (authentification)
- **Configuration** : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
- **Status** : ✅ **OPÉRATIONNEL**

---

## ✅ **DÉJÀ INSTALLÉ (via Supabase Auth)**

### 4. 🔑 **OAuth (Google / Apple)** ✅
- **Status** : ✅ **DÉJÀ INSTALLÉ VIA SUPABASE AUTH**
- **Implémentation** : Utilise `supabase.auth.signInWithOAuth()` (pas besoin de packages supplémentaires)
- **Routes** : 
  - ✅ `/api/auth/oauth/google` - `backend/src/domain/auth/auth.controllers.ts` (ligne 976)
  - ✅ `/api/auth/oauth/apple` - `backend/src/domain/auth/auth.controllers.ts` (ligne 1013)
- **Frontend** : Boutons OAuth dans `Front-End/app/auth/login/page.tsx`
- **Configuration requise** : Configurer OAuth dans le dashboard Supabase
  - Google OAuth : https://supabase.com/docs/guides/auth/social-login/auth-google
  - Apple OAuth : https://supabase.com/docs/guides/auth/social-login/auth-apple
- **Status** : ✅ **OPÉRATIONNEL** (configuration Supabase requise)

---

## ❌ **MANQUANT - À INSTALLER**

### 5. ✉️ **Service Email Transactionnel** ⚠️
- **Status** : ⚠️ **PARTIELLEMENT COUVERT**
- **Actuellement** : Supabase Auth gère les emails de base (vérification, reset password)
- **Manque** : Emails transactionnels personnalisés (confirmations, notifications, etc.)
- **Options recommandées** :
  - **Resend** (facile avec React/Next.js) - `resend` package
  - **SendGrid** (robuste) - `@sendgrid/mail` package
  - **Mailgun** (alternative) - `mailgun-js` package
- **Packages nécessaires** :
  - `resend` (recommandé) OU
  - `@sendgrid/mail` OU
  - `mailgun-js`
- **Fichiers à créer** :
  - `backend/src/core/services/email.service.ts`
- **Configuration requise** :
  ```
  RESEND_API_KEY= (si Resend)
  SENDGRID_API_KEY= (si SendGrid)
  MAILGUN_API_KEY= (si Mailgun)
  ```
- **Priorité** : 🟡 **MOYENNE** (Supabase couvre le minimum)

### 6. 📱 **SMS & Notifications Push** ❌
- **Status** : ❌ **NON INSTALLÉ**
- **Options** :
  - **Twilio** (SMS) - `twilio` package
  - **Firebase Cloud Messaging** (Push) - `firebase-admin` package
- **Packages nécessaires** :
  - `twilio` (pour SMS)
  - `firebase-admin` (pour push notifications)
- **Fichiers à créer** :
  - `backend/src/core/services/sms.service.ts`
  - `backend/src/core/services/push.service.ts`
- **Configuration requise** :
  ```
  TWILIO_ACCOUNT_SID=
  TWILIO_AUTH_TOKEN=
  TWILIO_PHONE_NUMBER=
  FIREBASE_PROJECT_ID=
  FIREBASE_PRIVATE_KEY=
  FIREBASE_CLIENT_EMAIL=
  ```
- **Priorité** : 🟢 **BASSE** (peut être ajouté plus tard)

### 7. 🔔 **Notifications Temps Réel** ⚠️
- **Status** : ⚠️ **DÉJÀ DISPONIBLE VIA SUPABASE**
- **Package** : `@supabase/realtime-js` (inclus dans `@supabase/supabase-js`)
- **Fonctionnalités** :
  - ✅ Supabase Realtime peut gérer les notifications temps réel
  - ✅ Chat instantané possible via Supabase Realtime
- **Alternatives** (si besoin de plus de contrôle) :
  - **Pusher** - `pusher` package
  - **Ably** - `ably` package
  - **Socket.io** - `socket.io` package
- **Priorité** : 🟢 **BASSE** (Supabase Realtime suffit pour commencer)

### 8. 📦 **Stockage de Fichiers** ✅
- **Status** : ✅ **DÉJÀ DISPONIBLE VIA SUPABASE STORAGE**
- **Package** : `@supabase/storage-js` (inclus dans `@supabase/supabase-js`)
- **Fonctionnalités** :
  - ✅ Upload de fichiers (photos, documents)
  - ✅ Génération d'URLs signées
  - ✅ Gestion des buckets
- **Alternatives** (si besoin de plus de fonctionnalités) :
  - **Cloudinary** - `cloudinary` package (optimisation d'images)
  - **AWS S3** - `@aws-sdk/client-s3` package
- **Priorité** : 🟢 **BASSE** (Supabase Storage suffit pour commencer)

---

## 📋 **RÉSUMÉ DES ACTIONS**

### 🔴 **PRIORITÉ HAUTE** (À installer maintenant)
1. ✅ Mapbox - **DÉJÀ FAIT** (clé API à ajouter)
2. ✅ Stripe - **DÉJÀ FAIT** (clés API à ajouter)
3. ✅ Supabase - **DÉJÀ FAIT**
4. ✅ **OAuth (Google/Apple)** - **DÉJÀ FAIT** (configuration Supabase requise)

### 🟡 **PRIORITÉ MOYENNE** (Peut attendre un peu)
5. ⚠️ **Service Email Transactionnel** - **À CONSIDÉRER** (Supabase couvre le minimum)

### 🟢 **PRIORITÉ BASSE** (Peut attendre)
6. ❌ **SMS/Push Notifications** - **OPTIONNEL**
7. ✅ **Notifications Temps Réel** - **DÉJÀ DISPONIBLE** (Supabase Realtime)
8. ✅ **Stockage** - **DÉJÀ DISPONIBLE** (Supabase Storage)

---

## 🚀 **PROCHAINES ÉTAPES RECOMMANDÉES**

1. **Installer OAuth** (Google + Apple)
   ```bash
   npm install passport passport-google-oauth20 apple-signin-auth
   npm install --save-dev @types/passport @types/passport-google-oauth20
   ```

2. **Installer Resend** (pour emails transactionnels)
   ```bash
   npm install resend
   ```

3. **Configurer les clés API manquantes** dans `.env`

4. **Créer les services** :
   - `backend/src/core/services/oauth.service.ts`
   - `backend/src/core/services/email.service.ts`

---

## 📝 **NOTES IMPORTANTES**

- **Supabase** couvre déjà beaucoup de besoins (DB, Auth, Storage, Realtime)
- **Mapbox** et **Stripe** sont déjà configurés, il ne manque que les clés API
- **OAuth** est la priorité principale pour améliorer l'expérience utilisateur
- Les autres services peuvent être ajoutés progressivement selon les besoins

