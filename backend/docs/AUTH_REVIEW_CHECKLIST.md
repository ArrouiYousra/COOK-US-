# 🔐 Revue Complète du Système d'Authentification

## ✅ Corrections Appliquées

### 1. **Login - Re-hash du mot de passe** ❌ → ✅
- **Problème** : Le mot de passe était re-hashé à chaque connexion
- **Correction** : Suppression du re-hash, mise à jour uniquement de `last_login_at`
- **Fichier** : `backend/src/domain/auth/auth.controllers.ts` (ligne 457-460)

---

## 📋 Checklist de Vérification

### 🔵 INSCRIPTION

#### Inscription Client
- [x] ✅ Création user dans Supabase Auth
- [x] ✅ Création user dans table `users` avec password hashé
- [x] ✅ Création `client_profile`
- [x] ✅ Retourne session complète avec cookies HttpOnly
- [x] ✅ Erreur 409 si email existe déjà
- [x] ✅ Rollback si échec (suppression Supabase Auth)

#### Inscription Cook
- [x] ✅ Création user + `cook_profile` avec tous les champs
- [x] ✅ Validation SIRET via API INSEE (AUTO_ENTREPRENEUR/MICRO_ENTREPRISE)
- [x] ✅ Support SIREN (9 chiffres) → recherche SIRET principal
- [x] ✅ Mode dégradé si API INSEE down (siret_verified=false)
- [x] ✅ PORTAGE_SALARIAL : message informatif seulement (pas de champs à l'inscription)
- [x] ✅ Statut `PENDING_APPROVAL` pour cook_profiles
- [x] ✅ Statut `PENDING_VERIFICATION` pour users

#### Sécurité
- [x] ✅ Mots de passe hashés avec bcrypt (12 rounds par défaut)
- [x] ✅ Password stocké dans `users.password` (hashé, pour audit uniquement)
- [x] ✅ Validation Zod complète (email lowercase, password min 8, etc.)

---

### 🟢 CONNEXION

#### Login
- [x] ✅ Vérification email/password via Supabase Auth
- [x] ✅ Création session complète
- [x] ✅ Cookies HttpOnly définis (access_token + refresh_token)
- [x] ✅ Mise à jour `last_login_at`
- [x] ✅ Erreur 401 si credentials invalides
- [x] ✅ **CORRIGÉ** : Pas de re-hash du password à chaque login

#### Refresh Token
- [x] ✅ Accepte token depuis cookie OU body
- [x] ✅ Retourne nouvelle session complète
- [x] ✅ Nettoie cookies si token invalide

#### Logout
- [x] ✅ Nettoie access_token ET refresh_token cookies

#### Get Current User
- [x] ✅ Endpoint `/auth/me` protégé par authGuard
- [x] ✅ Retourne user complet (via `mapUserToAuthUser`)
- [ ] ⚠️ **NOTE** : Ne retourne pas le profil (cook/client). Utiliser `/api/profiles/me` pour le profil complet

---

### 🟡 MOT DE PASSE

#### Forgot Password
- [x] ✅ Envoie email via Supabase avec `redirectTo`
- [x] ✅ Message générique (sécurité)

#### Reset Password
- [x] ✅ Parse token depuis URL (query ET hash)
- [x] ✅ Valide token via `setSession` ou décodage JWT
- [x] ✅ Met à jour password dans Supabase Auth
- [x] ✅ Met à jour password hashé dans table `users`

#### Change Password
- [x] ✅ Vérifie ancien mot de passe avant changement
- [x] ✅ Met à jour Supabase Auth ET table `users`

---

### 🟠 EMAIL & COMPTE

#### Update Email
- [x] ✅ Vérifie mot de passe actuel
- [x] ✅ Met à jour Supabase Auth
- [x] ✅ Met à jour table `users`
- [x] ✅ Remet status à `PENDING_VERIFICATION`

#### Delete Account
- [x] ✅ Vérifie mot de passe
- [x] ✅ Supprime de Supabase Auth
- [x] ✅ Supprime de table `users` (cascade supprime profils)
- [x] ✅ Nettoie cookies

#### Resend Verification
- [x] ✅ Envoie email de vérification via Supabase

---

### 🔴 OAUTH

#### Google OAuth
- [x] ✅ Redirige vers `/auth/callback` avec `role` dans queryParams
- [x] ✅ Page callback parse `refresh_token` depuis hash ET query
- [x] ✅ Appelle `refreshSession` avec token
- [x] ✅ Redirige vers bon dashboard selon role

#### Apple OAuth
- [x] ✅ Même logique que Google OAuth

---

### 🛡️ SÉCURITÉ & MIDDLEWARE

#### AuthGuard
- [x] ✅ Accepte token depuis cookie (`access_token`)
- [x] ✅ Accepte token depuis header (`Authorization: Bearer`)
- [x] ✅ Vérifie token via `supabaseAdmin.auth.getUser()`
- [x] ✅ Attache `req.user` avec `id`, `email`, `role`

#### Cookies
- [x] ✅ HttpOnly = true
- [x] ✅ Secure = true (en production uniquement)
- [x] ✅ SameSite = 'lax'
- [x] ✅ Path = '/'
- [x] ✅ MaxAge configuré (access: 1h, refresh: 14j)

#### CORS
- [x] ✅ `credentials: true` dans backend
- [x] ✅ `withCredentials: true` dans apiClient frontend
- [x] ✅ Origin configuré via `FRONTEND_URL`
- [x] ✅ `GOOGLE_CLIENT_ID` renseigné (voir `OAUTH_GOOGLE_SETUP.md`)
- [x] ✅ `GOOGLE_CLIENT_SECRET` renseigné (voir `OAUTH_GOOGLE_SETUP.md`)
- [ ] 🔁 Identifiants Apple (`APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`)

---

### 🎨 FRONTEND

#### Formulaires
- [x] ✅ Validation Zod en temps réel
- [x] ✅ Affichage des erreurs de validation
- [x] ✅ Gestion des erreurs réseau

#### Store Zustand
- [x] ✅ Persiste `user` et `isAuthenticated` dans localStorage
- [x] ✅ `checkAuth` avec fallback sur refresh si token expiré

#### API Client
- [x] ✅ `withCredentials: true` pour cookies
- [x] ✅ `refreshSession` accepte token optionnel (pour OAuth)
- [x] ✅ Gestion des erreurs réseau (timeout, CORS, etc.)

#### Redirections
- [x] ✅ Après inscription/login → dashboard selon role
- [x] ✅ OAuth callback → dashboard selon role

---

### 📝 PROFIL

#### Update My Profile
- [x] ✅ Permet de compléter champs PORTAGE_SALARIAL
- [x] ✅ Validation conditionnelle : tous les champs requis ensemble
- [x] ✅ Chiffrement SSN, IBAN, BIC
- [x] ✅ Upload RIB avec suppression ancien fichier
- [x] ✅ Endpoint `/api/profiles/me` pour profil complet

---

## ⚠️ Points d'Attention

1. **getCurrentUser ne retourne pas le profil** : C'est intentionnel. Utiliser `/api/profiles/me` pour le profil complet.

2. **Password hash dans table users** : Stocké uniquement pour audit. L'authentification réelle se fait via Supabase Auth.

3. **Mode dégradé INSEE** : Si l'API est down (500/503), l'inscription continue avec `siret_verified=false`. Les erreurs 400 (validation) bloquent l'inscription.

---

## 🧪 Tests Recommandés

### Tests Manuels à Effectuer

1. **Inscription Client**
   - [ ] Créer un compte client
   - [ ] Vérifier cookies dans DevTools
   - [ ] Vérifier redirection vers `/dashboard/client`

2. **Inscription Cook**
   - [ ] Créer un compte cook AUTO_ENTREPRENEUR avec SIRET valide
   - [ ] Créer un compte cook avec SIREN (vérifier recherche SIRET principal)
   - [ ] Créer un compte cook PORTAGE_SALARIAL (vérifier message informatif)
   - [ ] Tester mode dégradé (simuler API INSEE down)

3. **Connexion**
   - [ ] Login avec bon credentials
   - [ ] Login avec mauvais credentials (vérifier erreur 401)
   - [ ] Vérifier cookies après login

4. **Refresh Token**
   - [ ] Attendre expiration access_token
   - [ ] Vérifier refresh automatique
   - [ ] Tester refresh manuel

5. **Mot de Passe**
   - [ ] Forgot password → vérifier email reçu
   - [ ] Reset password avec token valide
   - [ ] Change password (vérifier vérification ancien password)

6. **OAuth**
   - [ ] Google OAuth → vérifier callback et redirection
   - [ ] Apple OAuth → vérifier callback et redirection

7. **Profil**
   - [ ] Compléter profil PORTAGE_SALARIAL
   - [ ] Vérifier chiffrement des données sensibles

---

## 📊 Résumé

- **Total de vérifications** : 50
- **Corrections appliquées** : 1 (re-hash password dans login)
- **Points d'attention** : 3
- **Tests manuels recommandés** : 7 catégories

---

## 🎯 Prochaines Étapes

1. Effectuer les tests manuels listés ci-dessus
2. Vérifier les logs backend pour détecter d'éventuelles erreurs
3. Tester en environnement de production (cookies Secure, CORS, etc.)
4. Documenter les cas d'erreur spécifiques rencontrés

