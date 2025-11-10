# 📋 APIs Manquantes - COOK US

## ❌ **CE QUI N'EST PAS ENCORE DANS LE PROJET**

### 1. ✉️ **Service Email Transactionnel** ⚠️
- **Status** : ⚠️ **PARTIELLEMENT COUVERT**
- **Actuellement** : Supabase Auth gère les emails de base (vérification, reset password)
- **Manque** : Emails transactionnels personnalisés :
  - Confirmations de réservation
  - Notifications de changement de statut
  - Rappels de réservation
  - Emails marketing (optionnel)
- **Options recommandées** :
  - **Resend** (facile avec React/Next.js) - `resend` package
  - **SendGrid** (robuste) - `@sendgrid/mail` package
  - **Mailgun** (alternative) - `mailgun-js` package
- **Packages nécessaires** :
  ```bash
  npm install resend
  # OU
  npm install @sendgrid/mail
  # OU
  npm install mailgun-js
  ```
- **Fichiers à créer** :
  - `backend/src/core/services/email.service.ts`
- **Configuration requise** :
  ```
  RESEND_API_KEY= (si Resend)
  SENDGRID_API_KEY= (si SendGrid)
  MAILGUN_API_KEY= (si Mailgun)
  MAILGUN_DOMAIN= (si Mailgun)
  ```
- **Priorité** : 🟡 **MOYENNE** (Supabase couvre le minimum)

### 2. 📱 **SMS & Notifications Push** ❌
- **Status** : ❌ **NON INSTALLÉ**
- **Options** :
  - **Twilio** (SMS) - `twilio` package
  - **Firebase Cloud Messaging** (Push) - `firebase-admin` package
- **Packages nécessaires** :
  ```bash
  npm install twilio
  npm install firebase-admin
  ```
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

### 3. 🖼️ **Optimisation d'Images** (Optionnel)
- **Status** : ❌ **NON INSTALLÉ**
- **Actuellement** : Supabase Storage stocke les images mais sans optimisation
- **Options** :
  - **Cloudinary** - `cloudinary` package (optimisation automatique, transformations)
  - **ImageKit** - Alternative à Cloudinary
- **Packages nécessaires** :
  ```bash
  npm install cloudinary
  ```
- **Configuration requise** :
  ```
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  ```
- **Priorité** : 🟢 **BASSE** (peut être ajouté si besoin d'optimisation d'images)

---

## ✅ **CE QUI EST DÉJÀ DANS LE PROJET**

### ✅ **DÉJÀ INSTALLÉ ET CONFIGURÉ**

1. ✅ **Mapbox API** - Géolocalisation complète
   - Geocoding, Reverse Geocoding, Search, Distance, Directions
   - Package : `@mapbox/mapbox-sdk`
   - Service : `backend/src/core/services/mapbox.service.ts`

2. ✅ **Stripe API** - Paiements sécurisés
   - Payment Intents, Refunds, Webhooks, Transfers
   - Package : `stripe`
   - Service : `backend/src/core/services/stripe.service.ts`

3. ✅ **Supabase** - Infrastructure complète
   - Database PostgreSQL (avec PostGIS)
   - Supabase Realtime (notifications temps réel)
   - Supabase Storage (stockage fichiers)
   - Supabase Auth (authentification + OAuth)

4. ✅ **OAuth (Google/Apple)** - Via Supabase Auth
   - Routes : `/api/auth/oauth/google` et `/api/auth/oauth/apple`
   - Frontend : Boutons OAuth dans la page de login
   - Configuration : Dashboard Supabase

---

## 📊 **RÉSUMÉ**

### Ce qui manque vraiment :
1. ⚠️ **Service Email Transactionnel** (Resend/SendGrid/Mailgun)
2. ❌ **SMS** (Twilio) - Optionnel
3. ❌ **Push Notifications** (FCM) - Optionnel
4. ❌ **Optimisation d'Images** (Cloudinary) - Optionnel

### Ce qui est déjà là :
- ✅ Mapbox (géolocalisation)
- ✅ Stripe (paiements)
- ✅ Supabase (DB, Auth, Storage, Realtime)
- ✅ OAuth Google/Apple (via Supabase)

---

## 🚀 **RECOMMANDATION**

**Priorité 1** : Installer **Resend** pour les emails transactionnels
- Facile à intégrer
- Bon pour React/Next.js
- Gratuit jusqu'à 3000 emails/mois

**Priorité 2** : Ajouter **Twilio** si besoin de SMS
- Pour les confirmations importantes
- Rappels de réservation

**Priorité 3** : **Cloudinary** si besoin d'optimisation d'images
- Transformation automatique
- Formats optimisés (WebP, etc.)

