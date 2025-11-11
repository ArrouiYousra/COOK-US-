# Fix : Cookies Cross-Origin en Production

## Problème

Les erreurs `401 Unauthorized` avec le message "Jeton d'authentification manquant" apparaissent uniquement en production, pas en local.

### Cause

En **local** :
- Frontend et backend sont sur le même domaine (`localhost`)
- Les cookies avec `sameSite: "lax"` fonctionnent correctement

En **production** :
- Frontend sur Vercel (`cook-us.vercel.app`)
- Backend sur Render (`cook-us-back-end.onrender.com`)
- **Domaines différents = cross-origin**
- Les cookies avec `sameSite: "lax"` **ne sont PAS envoyés** en cross-origin
- Il faut utiliser `sameSite: "none"` avec `secure: true`

## Solution Appliquée

### 1. Détection Cross-Origin Simplifiée

```typescript
// Avant : logique complexe et peu fiable
const isCrossOrigin = isProduction && (
  (frontendUrl.includes("vercel.app") || frontendUrl.includes("vercel.com")) ||
  (frontendUrl.includes("onrender.com") && process.env.BACKEND_URL?.includes("onrender.com") && 
   !frontendUrl.includes(process.env.BACKEND_URL || ""))
);

// Après : logique simple et fiable
const isCrossOrigin = isProduction && !frontendUrl.includes("localhost") && !frontendUrl.includes("127.0.0.1");
```

### 2. Configuration des Cookies

```typescript
const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction, // Obligatoire pour sameSite: "none"
  sameSite: (isCrossOrigin ? "none" : "lax") as "none" | "lax",
  path: "/",
};
```

### 3. Suppression des Anciens Cookies

Avant de créer de nouveaux cookies, les anciens sont supprimés pour éviter les conflits :

```typescript
res.clearCookie("access_token", { path: "/" });
res.clearCookie("refresh_token", { path: "/" });
```

## Actions Requises

### 1. Redéployer le Backend

Le backend doit être redéployé sur Render avec le nouveau code :

```bash
git add .
git commit -m "Fix: Cookies cross-origin pour production"
git push
```

Render redéploiera automatiquement.

### 2. Se Reconnecter

**IMPORTANT** : Les cookies existants dans le navigateur ont encore l'ancienne configuration (`sameSite: "lax"`). 

**L'utilisateur doit se déconnecter et se reconnecter** pour obtenir de nouveaux cookies avec la configuration correcte (`sameSite: "none"`).

### 3. Vérifier les Logs

Après le redéploiement, vérifiez les logs Render pour confirmer :

```
[Auth] Cross-origin detection: {
  isCrossOrigin: true,
  isProduction: true,
  frontendUrl: "https://cook-us.vercel.app",
  reason: "Production avec frontend externe"
}

[Auth] Setting cookies with options: {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  isCrossOrigin: true
}
```

## Vérification

1. **Redéployer le backend** sur Render
2. **Ouvrir la console du navigateur** (F12)
3. **Se déconnecter** puis **se reconnecter**
4. **Vérifier les cookies** dans l'onglet Application > Cookies :
   - `access_token` doit avoir `SameSite=None; Secure`
   - `refresh_token` doit avoir `SameSite=None; Secure`
5. **Tester les requêtes API** - elles ne devraient plus retourner 401

## Notes Techniques

- `sameSite: "none"` **nécessite** `secure: true` (HTTPS)
- Les cookies avec `sameSite: "lax"` ne sont **jamais** envoyés en cross-origin
- Le frontend a déjà `withCredentials: true` dans Axios (correct)
- Le backend a déjà `credentials: true` dans CORS (correct)

## Dépannage

Si les erreurs persistent après le redéploiement et la reconnexion :

1. **Vérifier les logs Render** pour confirmer que `isCrossOrigin: true`
2. **Vérifier les cookies** dans le navigateur (Application > Cookies)
3. **Vider le cache** et les cookies du navigateur
4. **Vérifier que `FRONTEND_URL`** est bien configuré sur Render avec l'URL Vercel

