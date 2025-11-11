# Configuration OAuth Apple - Guide Complet

## ⚙️ Prérequis Apple Developer

1. **Compte Apple Developer** payant (99 $/an) avec accès à la console `developer.apple.com`.
2. Domaine vérifié (le même que celui utilisé par ton front si tu souhaites un domaine personnalisé).
3. Accès à un Mac n’est pas obligatoire, mais pratique pour manipuler les clés si besoin.

---

## Étape 1 · Créer un « Service ID » (Client OAuth)

1. Va sur <https://developer.apple.com/account/resources/identifiers/list/serviceId>.
2. Clique sur **+** → Sélectionne **Services IDs** → Continue.
3. **Description** : `Cook US - OAuth`
4. **Identifier** (client ID) : par convention `com.cookus.auth`.  
   > Retient bien cette valeur : c’est `APPLE_CLIENT_ID`.
5. Sauvegarde le Service ID, puis **clique dessus** pour le configurer.
6. Coche **Sign in with Apple** → **Configure**.
7. Dans **Web Domain** et **Return URLs**, ajoute :
   - Domain : `ton-domaine.com` (ou celui de ton front, ex. `cook-us.vercel.app`)
   - Return URL : `https://<ton-projet>.supabase.co/auth/v1/callback`
8. Sauvegarde.

💡 Le Service ID doit être approuvé par Apple (status actif) avant de fonctionner.

---

## Étape 2 · Générer une clé privée Apple

1. Va sur <https://developer.apple.com/account/resources/authkeys/list>.
2. Clique sur **+** → **Sign in with Apple**.
3. **Key Name** : `Cook US OAuth`
4. Sélectionne le Service ID créé à l’étape 1.
5. Valide, puis télécharge le fichier `.p8`.  
   > Conserve-le précieusement : tu ne pourras plus le re-télécharger.

Note bien :
- `APPLE_TEAM_ID` : visible en haut à droite de la console (Team ID).
- `APPLE_KEY_ID` : identifiant de la clé (ex. `ABCD123456`).
- `APPLE_CLIENT_ID` : le Service ID (ex. `com.cookus.auth`).

---

## Étape 3 · Configurer Supabase

1. Va dans ton projet Supabase → **Authentication** → **Sign In / Providers**.
2. Dans la section **Apple** :
   - **Client ID** : `APPLE_CLIENT_ID` (ex. `com.cookus.auth`)
   - **Team ID** : `APPLE_TEAM_ID`
   - **Key ID** : `APPLE_KEY_ID`
   - **Private Key** : contenu du fichier `.p8`
     - Copie-colle le fichier en conservant `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`
3. Sauvegarde.

Supabase génèrera les tokens JWT pour Apple via ces informations.

---

## Étape 4 · Variables d’Environnement Backend

Ajoute dans `backend/.env` (ou Render) :

```env
APPLE_CLIENT_ID=com.cookus.auth                # Service ID
APPLE_TEAM_ID=ABCDE12345                       # Team ID (10 caractères)
APPLE_KEY_ID=XYZ1234567                        # Key ID de la clé .p8
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----" 
```

👉 Pour `APPLE_PRIVATE_KEY`, assure-toi que les retours à la ligne sont encodés en `\n`
si tu passes par une single line. Exemple :

```
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGT...\n-----END PRIVATE KEY-----"
```

(Sans guillemets si ton outil d’env accepte les multi-lignes.)

---

## Étape 5 · Variables Frontend (Optionnel)

Si tu souhaites exposer le client ID côté front (ex. pour Apple Sign In JS) :

```env
NEXT_PUBLIC_APPLE_CLIENT_ID=com.cookus.auth
```

---

## Étape 6 · Test du Flux OAuth Apple

1. **Backend** : démarré (localhost ou Render).
2. **Frontend** : `http://localhost:3000/auth/login`.
3. Clique sur **« Continuer avec Apple »**.
4. Apple affiche l’écran de consentement :
   - Utilise un compte Apple configuré avec 2FA.
   - Si Apple affiche « Cette application n’est pas autorisée », vérifie Service ID et domaine.
5. Après validation, Apple redirige vers Supabase, puis `/auth/callback`.
6. Le backend crée/complète l’utilisateur et redirige vers le dashboard.

---

## Vérifications Supabase / BDD

1. Supabase → **Authentication** → **Users** : nouvel utilisateur avec provider `apple`.
2. Table `users` : enregistrement présent (role, status, email_verified).
3. Table `client_profiles` ou `cook_profiles` : profil créé selon le rôle.

---

## Dépannage

### ❌ Erreur « invalid_client »
- `APPLE_CLIENT_ID` ne correspond pas exactement au Service ID.
- Team ID ou Key ID incorrects.
- Clé `.p8` mal collée (caractères manquants ou retours à la ligne).

### ❌ Erreur « redirect_uri mismatch »
- La Return URL n’est pas exactement `https://<projet>.supabase.co/auth/v1/callback`.
- Le domaine n’est pas déclaré dans le Service ID.

### ❌ Erreur « App not allowed »
- Écran de consentement pas encore entièrement configuré.
- Domaine web non approuvé ou Service ID désactivé.

### ❌ Utilisateur non créé
- Regarder les logs backend : la logique `ensureUserExistsForOAuth` doit créer ou mettre à jour l’utilisateur.
- Vérifier que Supabase renvoie bien un user (provider Apple) avec un email.  
  > Apple peut masquer l’email (relay). Assure-toi d’autoriser la divulgation.

---

## Checklist à compléter

- [ ] Service ID créé (Apple)
- [ ] Return URL = `https://<projet>.supabase.co/auth/v1/callback`
- [ ] Clé `.p8` générée, Key ID notée
- [ ] Variables Apple renseignées dans Supabase
- [ ] Variables Apple dans `.env` backend
- [ ] Bouton « Continuer avec Apple » fonctionne
- [ ] Utilisateur Apple créé dans Supabase Auth & table `users`
- [ ] Profil client/cook créé automatiquement
- [ ] Redirection vers le bon dashboard

---

## Prochaines étapes

1. Tester avec plusieurs comptes Apple (attention aux emails relayés).
2. Tester les deux rôles (CLIENT / COOK).
3. Installer la validation des profils cuisiniers post-OAuth (remplir les infos manquantes).
4. Mettre à jour `AUTH_REVIEW_CHECKLIST.md` une fois la configuration validée.


