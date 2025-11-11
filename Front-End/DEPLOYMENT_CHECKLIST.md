# ✅ Checklist de Déploiement Frontend (Vercel)

Ce fichier liste les erreurs de code courantes à **éviter** pour que le déploiement sur Vercel se passe sans problème.

## 🚫 Erreurs de Configuration à Éviter

### ❌ Variable d'environnement API URL incorrecte

**Erreur** :
```
Failed to load resource: the server responded with a status of 404
Cannot find module '/auth/login'
```

**Solution** :
- ✅ `NEXT_PUBLIC_API_URL` doit se terminer par `/api`
- ✅ Exemple : `https://cook-us-back-end.onrender.com/api`
- ✅ Le client API ajoute automatiquement `/api` si absent, mais mieux vaut l'inclure

### ❌ Content Security Policy trop restrictive

**Erreur** :
```
Content Security Policy directive: "connect-src 'self' ..." The action has been blocked
Content Security Policy directive: "script-src 'self' ..." The action has been blocked
```

**Solution** :
- ✅ Ajouter le domaine backend dans `connect-src` de la CSP
- ✅ Ajouter `https://*.onrender.com` pour autoriser Render
- ✅ Ajouter `https://fonts.googleapis.com` et `https://fonts.gstatic.com` pour Google Fonts
- ✅ Ajouter `https://js.stripe.com` dans `script-src` pour Stripe
- ✅ Ajouter `https://api.stripe.com` dans `connect-src` pour les appels Stripe
- ✅ Ajouter `https://js.stripe.com` et `https://hooks.stripe.com` dans `frame-src` pour les iframes Stripe
- ✅ Vérifier que `next.config.ts` extrait correctement le hostname du backend

### ❌ Variables d'environnement manquantes

**Erreur** :
```
undefined is not an object (evaluating 'process.env.NEXT_PUBLIC_API_URL')
```

**Solution** :
- ✅ Toutes les variables `NEXT_PUBLIC_*` doivent être configurées sur Vercel
- ✅ Vérifier que les variables sont bien préfixées par `NEXT_PUBLIC_` pour être accessibles côté client
- ✅ Redéployer après avoir ajouté des variables

## 🚫 Erreurs Next.js à Éviter

### ❌ Erreurs 404 _rsc (React Server Components)

**Erreur** :
```
Failed to load resource: the server responded with a status of 404
/register-cook?_rsc=1r34m:1
```

**Note** : Ces erreurs sont **normales** et non bloquantes. Ce sont des requêtes de streaming RSC qui peuvent échouer si la route n'est pas encore chargée.

**Solution** :
- ✅ Ignorer ces erreurs (elles n'affectent pas le fonctionnement)
- ✅ Vérifier que les routes existent bien dans `app/`

### ❌ Images Next.js non configurées

**Erreur** :
```
Error: Invalid src prop on next/image
```

**Solution** :
- ✅ Configurer `remotePatterns` dans `next.config.ts` pour tous les domaines d'images
- ✅ Ajouter Supabase Storage, Unsplash, Mapbox, etc.

### ❌ Build échoue à cause d'erreurs TypeScript

**Erreur** :
```
Build failed: Type error
```

**Solution** :
- ✅ Vérifier localement : `npm run build`
- ✅ Corriger toutes les erreurs TypeScript avant de pousser
- ✅ Vérifier que `tsconfig.json` est correctement configuré

## 🚫 Erreurs de Code à Éviter

### ❌ Appels API sans gestion d'erreur

**Erreur** :
```
Uncaught (in promise) Error: Network Error
```

**Solution** :
- ✅ Toujours utiliser `try/catch` pour les appels API
- ✅ Gérer les erreurs réseau gracieusement
- ✅ Afficher des messages d'erreur utilisateur-friendly

### ❌ Variables d'environnement utilisées côté serveur

**Erreur** :
```
process.env.SECRET_KEY is undefined
```

**Solution** :
- ✅ Les variables sans `NEXT_PUBLIC_` ne sont accessibles que côté serveur
- ✅ Utiliser `NEXT_PUBLIC_*` uniquement pour les variables publiques
- ✅ Ne jamais exposer des secrets dans `NEXT_PUBLIC_*`

### ❌ CORS mal configuré côté backend

**Erreur** :
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution** :
- ✅ Vérifier que `FRONTEND_URL` est configurée sur Render
- ✅ Vérifier que le backend autorise l'origine Vercel
- ✅ Vérifier que la CSP autorise les connexions vers le backend

## 🚫 Erreurs de Déploiement à Éviter

### ❌ Root Directory incorrect

**Erreur** :
```
Cannot find module
Build failed
```

**Solution** :
- ✅ Configurer **Root Directory** = `Front-End` sur Vercel
- ✅ Vérifier que `package.json` est dans le dossier `Front-End/`

### ❌ Build Command incorrect

**Erreur** :
```
Build failed: Command failed
```

**Solution** :
- ✅ Build Command : `npm run build` (par défaut, Vercel le détecte)
- ✅ Vérifier que le script `build` existe dans `package.json`

### ❌ Variables d'environnement non synchronisées

**Erreur** :
```
API calls failing
Environment variable not found
```

**Solution** :
- ✅ Vérifier que toutes les variables sont configurées sur Vercel
- ✅ Vérifier que les noms correspondent exactement (sensible à la casse)
- ✅ Redéployer après avoir ajouté/modifié des variables

## ✅ Checklist Avant Déploiement

### Configuration Vercel
- [ ] **Root Directory** = `Front-End`
- [ ] **Build Command** = `npm run build` (ou laisser Vercel détecter)
- [ ] Toutes les variables `NEXT_PUBLIC_*` sont configurées
- [ ] `NEXT_PUBLIC_API_URL` se termine par `/api`

### Variables d'Environnement
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurée
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurée
- [ ] `NEXT_PUBLIC_API_URL` = `https://votre-backend.onrender.com/api`
- [ ] `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` configurée (si utilisé)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurée (si utilisé)

### Configuration Next.js
- [ ] `next.config.ts` a les `remotePatterns` pour toutes les images
- [ ] CSP dans `next.config.ts` autorise le backend Render
- [ ] CSP autorise Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
- [ ] CSP autorise Mapbox et Supabase
- [ ] CSP autorise Stripe (`js.stripe.com`, `api.stripe.com`, `hooks.stripe.com`) si utilisé

### Code
- [ ] Build local réussi : `npm run build`
- [ ] Aucune erreur TypeScript
- [ ] Aucune erreur ESLint critique
- [ ] Tous les appels API ont une gestion d'erreur

### Backend (Render)
- [ ] Backend déployé et accessible
- [ ] `FRONTEND_URL` configurée sur Render avec l'URL Vercel
- [ ] CORS autorise les requêtes depuis Vercel
- [ ] Endpoint `/health` répond correctement

## 🔍 Commandes de Vérification

```bash
# Vérifier le build local
npm run build

# Vérifier le lint
npm run lint

# Démarrer en mode production local
npm run build && npm start

# Vérifier les variables d'environnement
# (dans le code, ajouter temporairement)
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

## 📝 Notes Importantes

- **Tester localement** avec `npm run build` avant de pousser
- **Variables `NEXT_PUBLIC_*`** sont exposées au client (ne pas mettre de secrets)
- **Redéployer** après chaque modification de variables d'environnement
- **Vérifier les logs Vercel** pour identifier les problèmes de build
- **Les erreurs 404 `_rsc`** sont normales et peuvent être ignorées

## 🐛 Erreurs Courantes et Solutions Rapides

### Erreur : "Cannot find module"
→ Vérifier **Root Directory** = `Front-End`

### Erreur : "CORS policy blocked"
→ Vérifier `FRONTEND_URL` sur Render et redéployer le backend

### Erreur : "404 on API calls"
→ Vérifier que `NEXT_PUBLIC_API_URL` se termine par `/api`

### Erreur : "Google Fonts blocked"
→ Ajouter `fonts.googleapis.com` et `fonts.gstatic.com` dans la CSP

### Erreur : "Stripe.js blocked"
→ Ajouter `https://js.stripe.com` dans `script-src` et `frame-src`
→ Ajouter `https://api.stripe.com` dans `connect-src`

### Erreur : "401 Unauthorized"
→ Normal si l'utilisateur n'est pas connecté
→ Vérifier que les cookies d'authentification sont bien envoyés (`withCredentials: true`)

### Erreur : "404 on /privacy, /help, /terms"
→ Ces routes n'existent peut-être pas encore
→ Les erreurs `_rsc` sont normales et peuvent être ignorées

### Erreur : "Build failed"
→ Vérifier localement avec `npm run build` et corriger les erreurs

