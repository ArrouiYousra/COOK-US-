# ✅ Checklist de Déploiement Backend (Render)

Ce fichier liste les erreurs de code courantes à **éviter** pour que le déploiement sur Render se passe sans problème.

## 🚫 Erreurs TypeScript à Éviter

### ❌ Types Node.js non chargés

**Erreur** :
```
error TS2584: Cannot find name 'console'
error TS2591: Cannot find name 'process'
error TS2591: Cannot find name 'Buffer'
```

**Solution** :
- ✅ Vérifier que `@types/node` est dans `devDependencies`
- ✅ Vérifier que `tsconfig.json` a `"typeRoots": ["./node_modules/@types"]`
- ✅ Créer `src/types/global.d.ts` avec `/// <reference types="node" />`

### ❌ Types Express non chargés

**Erreur** :
```
error TS2307: Cannot find module 'express'
error TS2339: Property 'body' does not exist on type 'AuthRequest'
error TS2339: Property 'params' does not exist on type 'AuthRequest'
```

**Solution** :
- ✅ Vérifier que `@types/express` est dans `devDependencies`
- ✅ S'assurer que `AuthRequest` étend bien `Request` d'Express
- ✅ Ne pas utiliser `"types": []` dans `tsconfig.json` (ou utiliser `"types": ["node"]`)

### ❌ Types `any` implicites

**Erreur** :
```
error TS7006: Parameter 'p' implicitly has an 'any' type
```

**Solution** :
- ✅ Toujours typer explicitement les paramètres de callback
- ✅ Exemple : `.map((p: { id: string }) => p.id)` au lieu de `.map((p) => p.id)`

### ❌ Types `null` vs `undefined`

**Erreur** :
```
error TS2322: Type 'string | null' is not assignable to type 'string | undefined'
```

**Solution** :
- ✅ Utiliser `undefined` au lieu de `null` pour les propriétés optionnelles
- ✅ Exemple : `last4: card?.last4 || undefined` au lieu de `|| null`

### ❌ Options Supabase invalides

**Erreur** :
```
error TS2769: 'nullsLast' does not exist in type
```

**Solution** :
- ✅ Utiliser `nullsFirst: false` au lieu de `nullsLast: true`
- ✅ Vérifier la documentation Supabase pour les options valides

## 🚫 Erreurs de Configuration à Éviter

### ❌ Package-lock.json désynchronisé

**Erreur** :
```
npm error Missing: tsc-alias@1.8.16 from lock file
```

**Solution** :
- ✅ Toujours exécuter `npm install` après avoir ajouté une dépendance
- ✅ Commiter le `package-lock.json` mis à jour
- ✅ Ne jamais modifier manuellement `package-lock.json`

### ❌ Alias TypeScript non résolus

**Erreur** :
```
Error: Cannot find module '@config/swagger'
```

**Solution** :
- ✅ Ajouter `tsc-alias` dans `devDependencies`
- ✅ Modifier le script `build` : `"build": "tsc && tsc-alias"`
- ✅ Vérifier que `tsc-alias` est dans `package-lock.json`

### ❌ DevDependencies non installées sur Render

**Erreur** :
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js'
```

**Solution** :
- ✅ Utiliser `NPM_CONFIG_PRODUCTION=false npm ci` dans `render.yaml`
- ✅ S'assurer que tous les packages nécessaires au build sont dans `devDependencies`

### ❌ Configuration TypeScript incorrecte

**Erreur** :
```
error TS2688: Cannot find type definition file for 'bcryptjs'
```

**Solution** :
- ✅ Ne pas utiliser `"types": []` qui bloque tous les types
- ✅ Utiliser `"types": ["node"]` ou laisser vide pour charger automatiquement
- ✅ Ajouter les références dans `src/types/global.d.ts`

## 🚫 Erreurs de Code à Éviter

### ❌ Vérifications de null/undefined manquantes

**Erreur** :
```
error TS2345: Argument of type 'string | undefined' is not assignable
```

**Solution** :
- ✅ Toujours vérifier avant utilisation : `if (!tokenParts[1]) throw new Error(...)`
- ✅ Utiliser des guards de type : `if (value) { /* value est défini ici */ }`

### ❌ Variables non utilisées

**Erreur** :
```
error TS6133: 'setupIntentId' is declared but its value is never read
```

**Solution** :
- ✅ Supprimer les variables non utilisées
- ✅ Ou préfixer avec `_` : `const _unused = value;`

### ❌ Imports non utilisés

**Erreur** :
```
error TS6133: 'DocumentService' is declared but its value is never read
```

**Solution** :
- ✅ Supprimer les imports non utilisés
- ✅ Utiliser un linter pour détecter automatiquement

## ✅ Checklist Avant Déploiement

### Configuration TypeScript
- [ ] `tsconfig.json` a `"typeRoots": ["./node_modules/@types"]`
- [ ] `src/types/global.d.ts` existe avec les références nécessaires
- [ ] Pas de `"types": []` qui bloque tous les types
- [ ] `@types/node` et `@types/express` sont dans `devDependencies`

### Package.json
- [ ] `package-lock.json` est à jour (exécuter `npm install`)
- [ ] `tsc-alias` est dans `devDependencies` si vous utilisez des alias
- [ ] Script `build` : `"tsc && tsc-alias"` (si alias utilisés)
- [ ] Tous les packages nécessaires sont listés

### Code
- [ ] Aucune erreur TypeScript : `npm run type-check`
- [ ] Aucun type `any` implicite
- [ ] Toutes les variables sont utilisées ou supprimées
- [ ] Tous les imports sont utilisés

### Render Configuration
- [ ] `render.yaml` utilise `NPM_CONFIG_PRODUCTION=false npm ci`
- [ ] Toutes les variables d'environnement sont configurées
- [ ] `FRONTEND_URL` est configurée avec l'URL Vercel

## 🔍 Commandes de Vérification

```bash
# Vérifier les types
npm run type-check

# Vérifier le lint
npm run lint

# Build local
npm run build

# Vérifier que le build fonctionne
npm start
```

## 📝 Notes Importantes

- **Toujours tester localement** avant de déployer
- **Commiter le `package-lock.json`** après chaque `npm install`
- **Vérifier les logs Render** pour identifier les problèmes
- **Les devDependencies sont nécessaires** pour le build TypeScript

