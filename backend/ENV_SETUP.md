# Configuration des Variables d'Environnement

## ✅ Variables Configurées

### Supabase
- `SUPABASE_URL` : ✅ Configuré
- `SUPABASE_ANON_KEY` : ✅ Configuré
- `SUPABASE_SERVICE_ROLE_KEY` : ✅ Configuré
- `GOOGLE_CLIENT_ID` : ✅ Configuré (voir `OAUTH_GOOGLE_SETUP.md`)
- `GOOGLE_CLIENT_SECRET` : ✅ Configuré (voir `OAUTH_GOOGLE_SETUP.md`)
- `APPLE_CLIENT_ID` : ❌ À configurer
- `APPLE_TEAM_ID` : ❌ À configurer
- `APPLE_KEY_ID` : ❌ À configurer
- `APPLE_PRIVATE_KEY` : ❌ À configurer

### Serveur
- `PORT` : 3000
- `NODE_ENV` : development

### JWT
- `JWT_SECRET` : ⚠️ À changer en production
- `JWT_EXPIRES_IN` : 7d

## ⚠️ Variables à Configurer

### Stripe (Paiements)
Pour obtenir vos clés Stripe :

1. Créer un compte sur [https://stripe.com](https://stripe.com)
2. Aller dans **Developers** > **API keys**
3. Copier les clés :
   - `STRIPE_SECRET_KEY` : Commence par `sk_test_...` (test) ou `sk_live_...` (production)
   - `STRIPE_PUBLISHABLE_KEY` : Commence par `pk_test_...` (test) ou `pk_live_...` (production)
4. Pour les webhooks :
   - Aller dans **Developers** > **Webhooks**
   - Créer un endpoint webhook
   - Copier le **Signing secret** : `STRIPE_WEBHOOK_SECRET` (commence par `whsec_...`)

**Exemple :**
```
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...
STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Mapbox (Géolocalisation)
Pour obtenir votre token Mapbox :

1. Créer un compte sur [https://www.mapbox.com](https://www.mapbox.com)
2. Aller dans **Account** > **Access tokens**
3. Créer un nouveau token ou utiliser le token par défaut
4. Copier le token : `MAPBOX_ACCESS_TOKEN` (commence par `pk.eyJ1Ijoi...`)

**Exemple :**
```
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscDZ6Z3B6YjAwM2cya3B0dW5qZ3B6YjAifQ.abcdefghijklmnopqrstuvwxyz
```

### API INSEE (Validation SIRET)
1. Créer un compte développeur sur [https://api.insee.fr/catalogue/](https://api.insee.fr/catalogue/)
2. Créer une application et récupérer :
   - `INSEE_API_KEY` (client_id)
   - `INSEE_API_SECRET` (client_secret)
3. (Optionnel) Définir le scope souhaité (`INSEE_API_SCOPE`). Par défaut le scope Sirene est suffisant.
4. Les URLs par défaut peuvent être laissées telles quelles :
   - `INSEE_API_TOKEN_URL=https://api.insee.fr/token`
   - `INSEE_API_BASE_URL=https://api.insee.fr/entreprises/sirene/V3`

**Exemple :**
```
INSEE_API_KEY=VotreClientID
INSEE_API_SECRET=VotreClientSecretUltraSecret
INSEE_API_SCOPE=openid
```

### Stockage Supabase (Documents RIB)
1. Créer un bucket privé dans Supabase Storage (ex: `cook-documents`)
2. Configurer les variables :
   - `SUPABASE_STORAGE_RIB_BUCKET=cook-documents`
   - `RIB_MAX_FILE_SIZE_MB=10` (optionnel, 10 MB par défaut)
3. Vérifier que le service role dispose des droits d'upload dans ce bucket.

### Resend (Emails Transactionnels)
Pour obtenir votre clé API Resend :

1. Créer un compte sur [https://resend.com](https://resend.com)
2. Aller dans **API Keys**
3. Créer une nouvelle clé API
4. Copier la clé : `RESEND_API_KEY` (commence par `re_...`)
5. (Optionnel) Configurer un domaine personnalisé dans Resend
6. (Optionnel) Configurer l'email d'expéditeur :
   - `RESEND_FROM_EMAIL` : Email d'expéditeur (ex: `noreply@votredomaine.com`)
   - `RESEND_FROM_NAME` : Nom d'expéditeur (ex: `Cook US`)

**Exemple :**
```
RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz
RESEND_FROM_EMAIL=noreply@cook-us.com
RESEND_FROM_NAME=Cook US
```

**Note** : En développement, vous pouvez utiliser l'email de test fourni par Resend sans configurer de domaine.

### Twilio (SMS)
Pour obtenir vos clés Twilio :

1. Créer un compte sur [https://www.twilio.com](https://www.twilio.com)
2. Aller dans **Console** > **Account** > **API Keys & Tokens**
3. Copier :
   - `TWILIO_ACCOUNT_SID` : Commence par `AC...`
   - `TWILIO_AUTH_TOKEN` : Cliquer sur "View" pour le voir
4. Obtenir un numéro de téléphone :
   - Aller dans **Phone Numbers** > **Buy a number**
   - Copier le numéro : `TWILIO_PHONE_NUMBER` (format: `+33612345678`)

**Exemple :**
```
TWILIO_ACCOUNT_SID=AC1234567890abcdef...
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+33612345678
```

**Note** : En mode test, vous ne pouvez envoyer qu'aux numéros vérifiés. Voir `backend/TWILIO_SETUP.md` pour plus de détails.

### Firebase Cloud Messaging (Push Notifications)
Pour obtenir vos clés Firebase :

1. Créer un projet sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Aller dans **Project Settings** (⚙️) > **Service accounts**
3. Cliquer sur **Generate new private key**
4. Télécharger le fichier JSON
5. Extraire les informations :
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (avec guillemets et `\n`)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

**Exemple :**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Note** : Voir `backend/FIREBASE_SETUP.md` pour la configuration complète côté frontend.

## 📝 Fichier .env

Le fichier `.env` est créé dans le dossier `backend/` avec les valeurs Supabase déjà configurées.

**Important :**
- Le fichier `.env` est dans `.gitignore` et ne sera **jamais** commité
- Ne partagez **jamais** vos clés secrètes
- Utilisez des clés de **test** pour le développement
- Changez `JWT_SECRET` pour un secret fort en production

## 🔒 Sécurité

1. **JWT_SECRET** : Utilisez un secret fort (minimum 32 caractères aléatoires)
   ```bash
   # Générer un secret aléatoire
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Clés API** : 
   - Ne jamais commiter dans Git
   - Utiliser des variables d'environnement
   - Utiliser des clés différentes pour dev/staging/production

## 🚀 Prochaines Étapes

1. ✅ Supabase configuré
2. ⏳ Obtenir les clés Stripe
3. ⏳ Obtenir le token Mapbox
4. ⏳ Générer un JWT_SECRET fort
5. ⏳ Exécuter le script SQL dans Supabase

