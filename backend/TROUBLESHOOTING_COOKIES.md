# 🔧 Dépannage : Erreurs 401 "Jeton d'authentification manquant"

## ⚠️ Problème

Les erreurs `401 Unauthorized` persistent même après le redéploiement du backend et du frontend.

## 🔍 Diagnostic

### Vérification 1 : Les cookies sont-ils créés avec la bonne configuration ?

**Dans les logs Render**, vous devriez voir :

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

**Si vous ne voyez PAS ces logs** → Le backend n'a pas été redéployé avec le nouveau code.

### Vérification 2 : Les cookies sont-ils envoyés par le navigateur ?

**Dans les logs Render**, lors d'une requête API, vous devriez voir :

```
[AuthGuard] Debug: {
  hasCookies: true,
  cookieKeys: ["access_token", "refresh_token"],
  hasAccessToken: true,
  hasCookieHeader: true,
  origin: "https://cook-us.vercel.app",
  url: "/api/bookings"
}
```

**Si `hasAccessToken: false`** → Les cookies ne sont PAS envoyés par le navigateur.

## ✅ Solution Étape par Étape

### Étape 1 : Vérifier que le backend est bien redéployé

1. Allez sur **Render Dashboard** → Votre service backend
2. Vérifiez les **logs récents** (onglet "Logs")
3. Cherchez les logs `[Auth] Cross-origin detection` et `[Auth] Setting cookies`
4. **Si ces logs n'existent pas** → Le code n'a pas été déployé

**Solution** :
```bash
cd backend
git add .
git commit -m "Fix: Cookies cross-origin"
git push
```

Attendez que Render redéploie (2-3 minutes).

### Étape 2 : Supprimer les anciens cookies du navigateur

**Les cookies existants ont encore l'ancienne configuration** (`sameSite: "lax"`).

**Option A : Via les DevTools (Recommandé)**

1. Ouvrez **DevTools** (F12)
2. Allez dans l'onglet **Application** (Chrome) ou **Stockage** (Firefox)
3. Dans le menu de gauche, cliquez sur **Cookies**
4. Sélectionnez `https://cook-us.vercel.app`
5. **Supprimez** tous les cookies (`access_token`, `refresh_token`)
6. **Fermez et rouvrez** le navigateur

**Option B : Via la console JavaScript**

Ouvrez la console (F12) et exécutez :

```javascript
// Supprimer tous les cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### Étape 3 : Se déconnecter et se reconnecter

1. **Déconnectez-vous** de l'application
2. **Fermez complètement** le navigateur (pas juste l'onglet)
3. **Rouvrez** le navigateur
4. **Reconnectez-vous**

### Étape 4 : Vérifier les nouveaux cookies

Après la reconnexion :

1. Ouvrez **DevTools** (F12)
2. Allez dans **Application** → **Cookies** → `https://cook-us.vercel.app`
3. Vérifiez que `access_token` a :
   - ✅ `SameSite=None`
   - ✅ `Secure` (coché)
   - ✅ `HttpOnly` (coché, mais pas visible dans DevTools)

**Si les cookies n'ont PAS `SameSite=None`** → Le backend n'a pas été redéployé correctement.

## 🐛 Dépannage Avancé

### Problème : Les logs montrent `isCrossOrigin: false`

**Cause** : La variable d'environnement `FRONTEND_URL` n'est pas configurée correctement.

**Solution** :
1. Allez sur **Render Dashboard** → Votre service backend
2. Allez dans **Environment**
3. Vérifiez que `FRONTEND_URL` est défini avec l'URL Vercel :
   ```
   FRONTEND_URL=https://cook-us.vercel.app
   ```
4. **Redéployez** le service

### Problème : Les cookies sont créés mais pas envoyés

**Cause** : Les cookies avec `sameSite: "none"` nécessitent `secure: true` ET HTTPS.

**Vérification** :
- ✅ Le backend est sur HTTPS (`https://cook-us-back-end.onrender.com`)
- ✅ Le frontend est sur HTTPS (`https://cook-us.vercel.app`)
- ✅ Les cookies ont `Secure` activé

**Si tout est correct mais que ça ne fonctionne pas** :
1. Vérifiez que vous n'êtes pas en mode "Incognito" (certains navigateurs bloquent les cookies third-party)
2. Vérifiez les paramètres de confidentialité du navigateur
3. Essayez avec un autre navigateur

### Problème : Les logs montrent `hasAccessToken: false`

**Cause** : Les cookies ne sont pas envoyés par le navigateur.

**Solutions** :
1. **Vérifiez `withCredentials: true`** dans le client Axios (déjà fait)
2. **Vérifiez CORS** : Le backend doit avoir `credentials: true` (déjà fait)
3. **Vérifiez les cookies** : Ils doivent avoir `SameSite=None; Secure`

## 📋 Checklist de Vérification

- [ ] Le backend a été redéployé avec le nouveau code
- [ ] Les logs Render montrent `isCrossOrigin: true`
- [ ] Les logs Render montrent `sameSite: "none"` lors de la création des cookies
- [ ] Les anciens cookies ont été supprimés du navigateur
- [ ] L'utilisateur s'est déconnecté et reconnecté
- [ ] Les nouveaux cookies ont `SameSite=None` et `Secure`
- [ ] `FRONTEND_URL` est configuré correctement sur Render
- [ ] Le backend et le frontend sont sur HTTPS

## 🚨 Si Rien Ne Fonctionne

1. **Vérifiez les logs Render** pour voir exactement ce qui se passe
2. **Testez avec Postman/Insomnia** en ajoutant manuellement les cookies
3. **Vérifiez la console du navigateur** pour les erreurs CORS
4. **Testez en local** pour confirmer que le code fonctionne

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes, fournissez :
- Les logs Render (dernières 50 lignes)
- Les cookies du navigateur (screenshot de DevTools)
- Les erreurs de la console du navigateur
- La configuration de `FRONTEND_URL` sur Render

