# Configuration de l'API INSEE pour la validation SIRET

## 📋 Vue d'ensemble

L'API INSEE permet de valider les numéros SIRET/SIREN des entreprises françaises. Le service est implémenté dans `backend/src/domain/insee/insee.service.ts`.

## 🔑 Obtenir les clés API

### Étape 1 : Créer un compte développeur

1. Aller sur [https://api.insee.fr/catalogue/](https://api.insee.fr/catalogue/)
2. Créer un compte développeur (gratuit)
3. Se connecter à votre compte

### Étape 2 : Créer une application

1. Aller dans **"Mes applications"** ou **"Applications"**
2. Cliquer sur **"Créer une application"**
3. Remplir le formulaire :
   - **Nom de l'application** : Cook US (ou votre nom)
   - **Description** : Validation SIRET pour la plateforme Cook US
   - **Type d'application** : 
     - **Application Web** (si vous avez un Client Secret)
     - **Application Mobile/Desktop** (si vous n'avez qu'une API Key)
4. Sélectionner les **scopes** nécessaires :
   - `api_sirene` (obligatoire pour accéder à la base SIRENE)
   - `openid` (optionnel, pour OAuth)

### Étape 3 : Récupérer les identifiants

Après la création de l'application, vous obtiendrez :

- **Client ID** (ou Consumer Key) : C'est votre `INSEE_API_KEY`
- **Client Secret** (ou Consumer Secret) : C'est votre `INSEE_API_SECRET` (optionnel selon le type d'application)

## ⚙️ Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
# Obligatoire : Client ID (Consumer Key)
INSEE_API_KEY=VotreClientID

# Optionnel : Client Secret (Consumer Secret)
# Si vous avez une application Web avec OAuth, ajoutez cette variable
# Si vous avez seulement une API Key, laissez cette variable vide ou ne l'ajoutez pas
INSEE_API_SECRET=VotreClientSecret

# Optionnel : Scope (par défaut, le scope Sirene est suffisant)
INSEE_API_SCOPE=api_sirene

# Optionnel : URLs de l'API (valeurs par défaut)
INSEE_API_TOKEN_URL=https://api.insee.fr/token
INSEE_API_BASE_URL=https://api.insee.fr/entreprises/sirene/V3
```

### Modes d'authentification

L'API INSEE supporte deux modes :

#### Mode 1 : API Key simple (sans OAuth)
- **Quand utiliser** : Si vous avez seulement une API Key (pas de Client Secret)
- **Configuration** : 
  ```env
  INSEE_API_KEY=VotreAPIKey
  # Ne pas définir INSEE_API_SECRET ou laisser vide
  ```
- **Fonctionnement** : L'API Key est utilisée directement dans le header `Authorization`

#### Mode 2 : OAuth 2.0 (avec Client Secret)
- **Quand utiliser** : Si vous avez une application Web avec Client ID et Client Secret
- **Configuration** :
  ```env
  INSEE_API_KEY=VotreClientID
  INSEE_API_SECRET=VotreClientSecret
  INSEE_API_SCOPE=api_sirene
  ```
- **Fonctionnement** : Le service obtient un token OAuth via `/token`, puis l'utilise dans les requêtes

## 🧪 Tester la configuration

### Vérifier que les variables sont configurées

Le service vérifie automatiquement que `INSEE_API_KEY` est défini. Si ce n'est pas le cas, une erreur sera levée.

### Tester avec un SIRET valide

Vous pouvez tester avec un SIRET réel d'une entreprise française, par exemple :
- **SIRET de test** : Utilisez un SIRET d'une entreprise réelle (ex: 55203253400608 pour Google France)

### Logs de debugging

En mode développement (`NODE_ENV=development`), le service affiche des logs détaillés :
- `[INSEE] Validating SIRET: ...` : Le SIRET en cours de validation
- `[INSEE] Token obtained: Yes/No` : Si le token a été obtenu
- `[INSEE] Using OAuth: Yes/No` : Le mode d'authentification utilisé
- `[INSEE] 404 Error - SIRET not found: ...` : Si le SIRET n'est pas trouvé

## ❌ Erreurs courantes

### "Numéro SIRET introuvable dans la base INSEE"

Cette erreur peut avoir plusieurs causes. **En mode développement, des logs détaillés sont affichés pour diagnostiquer le problème.**

#### 🔍 Diagnostic étape par étape

1. **Vérifier les logs du serveur backend**
   - En mode développement (`NODE_ENV=development`), les logs affichent :
     - Le SIRET validé
     - Si le token a été obtenu
     - L'URL de l'API appelée
     - Le format d'authentification utilisé
     - Le statut de la réponse HTTP
     - Le corps de la réponse en cas d'erreur

2. **Causes possibles et solutions**

   **A. Problème d'authentification (401 Unauthorized)**
   - **Symptôme** : Erreur 401 dans les logs
   - **Causes** :
     - `INSEE_API_KEY` incorrect ou manquant
     - `INSEE_API_SECRET` incorrect (si mode OAuth)
     - Clés API expirées ou révoquées
     - Format d'Authorization header incorrect
   - **Solutions** :
     - Vérifiez que `INSEE_API_KEY` est défini dans `.env`
     - Vérifiez vos clés sur [https://api.insee.fr/catalogue/](https://api.insee.fr/catalogue/)
     - Si vous utilisez OAuth, vérifiez `INSEE_API_SECRET`
     - Le service utilise maintenant `Bearer {token}` pour tous les modes

   **B. Le SIRET n'existe pas réellement (404 Not Found)**
   - **Symptôme** : Erreur 404 avec message "Numéro SIRET introuvable"
   - **Causes** :
     - Le SIRET n'existe pas dans la base INSEE
     - Le SIRET est récent (délai de 24-48h avant disponibilité)
     - L'établissement a été fermé
     - L'établissement a une opposition à la diffusion
   - **Solutions** :
     - Vérifiez le SIRET sur [https://www.sirene.fr/](https://www.sirene.fr/)
     - Attendez 24-48h si le SIRET vient d'être créé
     - Utilisez un SIRET d'entreprise active et connue pour tester

   **C. Problème de permissions (403 Forbidden)**
   - **Symptôme** : Erreur 403 dans les logs
   - **Causes** :
     - Votre application n'a pas les permissions nécessaires
     - Le scope `api_sirene` n'est pas activé
   - **Solutions** :
     - Vérifiez les permissions de votre application sur le portail INSEE
     - Assurez-vous que le scope `api_sirene` est sélectionné

   **D. Limite de taux atteinte (429 Too Many Requests)**
   - **Symptôme** : Erreur 429 dans les logs
   - **Causes** :
     - Trop de requêtes en peu de temps
     - Limite du plan gratuit atteinte
   - **Solutions** :
     - Attendez quelques minutes avant de réessayer
     - Vérifiez les limites de votre plan sur le portail INSEE

   **E. Format d'URL incorrect**
   - **Symptôme** : Erreur 404 ou 400 avec URL incorrecte dans les logs
   - **Causes** :
     - `INSEE_API_BASE_URL` mal configuré
   - **Solutions** :
     - Vérifiez que `INSEE_API_BASE_URL=https://api.insee.fr/entreprises/sirene/V3`
     - Ne modifiez cette URL que si nécessaire

3. **Vérifier la configuration**

   Vérifiez que votre `.env` contient au minimum :
   ```env
   INSEE_API_KEY=VotreClientID
   # Optionnel si mode OAuth :
   INSEE_API_SECRET=VotreClientSecret
   ```

4. **Tester avec un SIRET connu**

   Testez avec un SIRET d'entreprise active et connue :
   - **Google France** : `55203253400608`
   - **Amazon France** : `41426381900028`
   - **Microsoft France** : `70203310700015`

   Si ces SIRET échouent aussi, c'est probablement un problème de configuration ou d'authentification.

5. **Vérifier la réponse complète de l'API**

   Les logs en développement affichent :
   - Le statut HTTP
   - Les headers de réponse
   - Le corps de la réponse (si erreur)
   - Les causes possibles suggérées

### "INSEE API credentials are not configured"

**Solution** : Ajoutez `INSEE_API_KEY` dans votre fichier `.env`

### "Échec de l'authentification auprès de l'API INSEE"

**Causes possibles** :
- Client ID incorrect
- Client Secret incorrect (si mode OAuth)
- Scope incorrect
- Application non activée sur le portail INSEE

**Solution** : Vérifiez vos identifiants sur [https://api.insee.fr/catalogue/](https://api.insee.fr/catalogue/)

## 📚 Documentation officielle

- **Portail développeur INSEE** : [https://api.insee.fr/catalogue/](https://api.insee.fr/catalogue/)
- **Documentation API Sirene V3** : [https://api.insee.fr/catalogue/sirene/v3](https://api.insee.fr/catalogue/sirene/v3)
- **Guide d'authentification** : [https://api.insee.fr/catalogue/donnees-qp](https://api.insee.fr/catalogue/donnees-qp)

## 🔍 Vérification du statut

Pour vérifier si votre configuration fonctionne :

1. Vérifiez les logs du serveur backend lors d'une tentative d'inscription avec un SIRET
2. Les logs afficheront :
   - Si le token a été obtenu
   - L'URL de l'API appelée
   - Le statut de la réponse
   - Les détails de l'erreur si elle se produit

## ⚠️ Mode dégradé

Si l'API INSEE est indisponible (erreur 500, 503, timeout), le système fonctionne en **mode dégradé** :
- L'inscription continue
- Le SIRET est enregistré mais `siret_verified = false`
- L'utilisateur peut compléter son profil plus tard

Seules les erreurs de validation (400) bloquent l'inscription.

