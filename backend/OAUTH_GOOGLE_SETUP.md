# Configuration OAuth Google - Guide Complet

## ✅ Configuration Complétée

### 1. Google Cloud Console
- ✅ Client ID créé : `504020587203-e2d5llsdita93aai8ccneafvv60jdat5.apps.googleusercontent.com`
- ✅ Client Secret : `DaniellaHarel2023`
- ✅ URI de redirection configurée : `https://<ton-projet>.supabase.co/auth/v1/callback`

### 2. Supabase Dashboard
1. Aller dans **Authentication** → **Sign In / Providers**
2. Activer **Google**
3. Coller :
   - **Client ID** : `504020587203-e2d5llsdita93aai8ccneafvv60jdat5.apps.googleusercontent.com`
   - **Client Secret** : `DaniellaHarel2023`
4. Sauvegarder

### 3. Variables d'Environnement Backend

Ajouter dans `.env` du backend (ou sur Render) :

```env
GOOGLE_CLIENT_ID=504020587203-e2d5llsdita93aai8ccneafvv60jdat5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=DaniellaHarel2023
FRONTEND_URL=http://localhost:3000  # En dev
# FRONTEND_URL=https://ton-site.vercel.app  # En prod
```

### 4. Variables d'Environnement Frontend (Optionnel)

Ajouter dans `Front-End/.env.local` :

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=504020587203-e2d5llsdita93aai8ccneafvv60jdat5.apps.googleusercontent.com
```

## 🧪 Test du Flux OAuth Google

### Étape 1 : Vérifier la Configuration

1. **Backend démarré** sur `http://localhost:5000` (ou ton URL Render)
2. **Frontend démarré** sur `http://localhost:3000`
3. **Supabase** : Vérifier que Google est activé dans Authentication → Providers

### Étape 2 : Tester la Connexion

1. Aller sur `http://localhost:3000/auth/login`
2. Cliquer sur **"Continuer avec Google"**
3. Tu devrais être redirigé vers Google pour autoriser l'application
4. Après autorisation, Google redirige vers `/auth/callback`
5. Le backend crée automatiquement l'utilisateur s'il n'existe pas
6. Redirection vers le dashboard approprié (`/dashboard/client` ou `/dashboard/cook`)

### Étape 3 : Vérifier la Création de l'Utilisateur

1. Aller dans Supabase → **Authentication** → **Users**
2. Vérifier qu'un nouvel utilisateur a été créé avec :
   - Email Google
   - Provider : `google`
   - Email vérifié : ✅

3. Aller dans Supabase → **Table Editor** → `users`
4. Vérifier qu'un enregistrement existe avec :
   - `id` correspondant à l'utilisateur Supabase Auth
   - `role` : `CLIENT` ou `COOK` (selon le choix)
   - `status` : `ACTIVE`
   - `email_verified` : timestamp présent

5. Vérifier le profil créé :
   - Si `role = CLIENT` → Table `client_profiles` doit avoir un enregistrement
   - Si `role = COOK` → Table `cook_profiles` doit avoir un enregistrement avec valeurs par défaut

## 🔍 Dépannage

### Erreur : "OAuth Failed" ou "Échec lors de la redirection Google OAuth"

**Causes possibles :**
1. Google OAuth non activé dans Supabase
2. Client ID / Secret incorrects dans Supabase
3. URI de redirection non autorisée dans Google Cloud Console
4. `FRONTEND_URL` mal configuré dans le backend

**Solutions :**
- Vérifier les credentials dans Supabase
- Vérifier l'URI de redirection dans Google Cloud Console
- Vérifier `FRONTEND_URL` dans `.env` backend

### Erreur : "User not found in database" après OAuth

**Cause :** Le backend n'a pas réussi à créer l'utilisateur dans la table `users`

**Solution :** Vérifier les logs backend pour voir l'erreur exacte. Le code devrait créer automatiquement l'utilisateur lors du `refreshToken`.

### Erreur : "Invalid refresh token"

**Cause :** Le token OAuth a expiré ou est invalide

**Solution :** Réessayer la connexion OAuth depuis le début

### L'utilisateur n'est pas redirigé vers le bon dashboard

**Cause :** Le rôle n'est pas correctement transmis ou stocké

**Solution :** Vérifier que le paramètre `role` est bien passé lors de l'appel à `loginWithGoogle()` et que le backend le récupère correctement.

## 📝 Notes Importantes

1. **Première connexion OAuth** : L'utilisateur est créé automatiquement avec un profil minimal
2. **Connexions suivantes** : L'utilisateur existant est mis à jour (nom, avatar, etc.)
3. **Rôle** : Le rôle est déterminé par le paramètre `role` passé lors de l'appel OAuth (depuis le store `selectedRole` ou par défaut `CLIENT`)
4. **Cook Profile** : Si l'utilisateur se connecte en tant que `COOK`, un profil cuisinier est créé avec des valeurs par défaut qu'il devra compléter ensuite

## ✅ Checklist de Vérification

- [ ] Google OAuth activé dans Supabase
- [ ] Client ID et Secret collés dans Supabase
- [ ] URI de redirection configurée dans Google Cloud Console
- [ ] Variables d'environnement backend configurées
- [ ] `FRONTEND_URL` correctement défini
- [ ] Test de connexion réussi
- [ ] Utilisateur créé dans Supabase Auth
- [ ] Utilisateur créé dans la table `users`
- [ ] Profil (client ou cook) créé
- [ ] Redirection vers le bon dashboard

## 🚀 Prochaines Étapes

Une fois Google OAuth fonctionnel :
1. Tester avec plusieurs comptes Google
2. Tester les deux rôles (CLIENT et COOK)
3. Vérifier que les profils sont bien créés
4. Passer à la configuration Apple OAuth

