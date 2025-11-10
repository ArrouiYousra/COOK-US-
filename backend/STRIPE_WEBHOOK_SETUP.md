# 🔗 Configuration Webhook Stripe - Guide Rapide

## ✅ Vérification : Tout est déjà configuré !

Votre backend est **déjà prêt** pour recevoir les webhooks Stripe :

1. ✅ Route webhook : `/api/payments/webhook`
2. ✅ Middleware `express.raw()` configuré pour le webhook
3. ✅ Vérification de signature implémentée
4. ✅ Gestion des événements : `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.

## 🚀 Obtenir le Webhook Secret (2 méthodes)

### Méthode 1 : Stripe CLI (Recommandé pour le développement local)

#### Étape 1 : Installer Stripe CLI

**Windows** :
```powershell
# Via Scoop (si installé)
scoop install stripe

# Ou télécharger depuis :
# https://github.com/stripe/stripe-cli/releases/latest
```

**Mac** :
```bash
brew install stripe/stripe-cli/stripe
```

**Linux** :
```bash
# Télécharger depuis :
# https://github.com/stripe/stripe-cli/releases/latest
```

#### Étape 2 : Se connecter à Stripe

```bash
stripe login
```

Cela ouvrira votre navigateur pour vous authentifier.

#### Étape 3 : Créer un tunnel vers votre serveur local

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

**Important** : Remplacez `5000` par le port de votre backend (vérifiez dans `backend/.env`).

#### Étape 4 : Copier le Webhook Secret

Quand vous lancez `stripe listen`, vous verrez quelque chose comme :

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

**Copiez ce `whsec_...`** et ajoutez-le dans `backend/.env` :

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

#### Étape 5 : Tester les webhooks

Dans un autre terminal, simulez un événement :

```bash
stripe trigger payment_intent.succeeded
```

Vous devriez voir les logs dans votre terminal backend.

---

### Méthode 2 : Dashboard Stripe (Pour la production)

#### Étape 1 : Aller dans le Dashboard Stripe

1. Connectez-vous sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Developers** > **Webhooks**

#### Étape 2 : Créer un endpoint webhook

1. Cliquez sur **Add endpoint**
2. Entrez l'URL de votre webhook :
   - **Production** : `https://votredomaine.com/api/payments/webhook`
   - **Test** : `https://votredomaine-test.com/api/payments/webhook`
3. Sélectionnez les événements à écouter :
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `charge.refunded`
4. Cliquez sur **Add endpoint**

#### Étape 3 : Copier le Signing Secret

1. Cliquez sur l'endpoint créé
2. Dans la section **Signing secret**, cliquez sur **Reveal**
3. **Copiez le secret** (commence par `whsec_...`)

#### Étape 4 : Ajouter dans `.env`

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

---

## 📋 Événements gérés par votre backend

Votre backend gère automatiquement ces événements :

| Événement | Action |
|-----------|--------|
| `payment_intent.succeeded` | ✅ Met à jour le statut de la réservation<br>✅ Crée une transaction<br>✅ Envoie des notifications |
| `payment_intent.payment_failed` | ⚠️ Met à jour le statut en "failed"<br>⚠️ Envoie une notification au client |
| `payment_intent.canceled` | ❌ Met à jour le statut en "canceled" |
| `charge.refunded` | 💰 Met à jour le montant remboursé<br>💰 Crée une transaction de remboursement<br>💰 Envoie une notification |

---

## 🧪 Tester les webhooks en local

### Avec Stripe CLI

```bash
# Simuler un paiement réussi
stripe trigger payment_intent.succeeded

# Simuler un paiement échoué
stripe trigger payment_intent.payment_failed

# Simuler un remboursement
stripe trigger charge.refunded
```

### Vérifier les logs

Dans votre terminal backend, vous devriez voir :

```
Payment succeeded for booking: booking-123
```

---

## ⚠️ Points importants

1. **Middleware `express.raw()`** :
   - ✅ Déjà configuré dans `backend/src/app.ts` ligne 47
   - ✅ Doit être **AVANT** `express.json()`
   - ✅ Nécessaire pour la vérification de signature

2. **Vérification de signature** :
   - ✅ Déjà implémentée dans `StripeService.verifyWebhookSignature()`
   - ✅ Utilise `STRIPE_WEBHOOK_SECRET` depuis `.env`

3. **Route webhook** :
   - ✅ Pas d'authentification requise (utilise la signature Stripe)
   - ✅ Route : `/api/payments/webhook`
   - ✅ Méthode : `POST`

---

## 🚀 Prochaines étapes

1. ✅ Obtenir le webhook secret (Stripe CLI ou Dashboard)
2. ✅ Ajouter `STRIPE_WEBHOOK_SECRET` dans `backend/.env`
3. ✅ Redémarrer le serveur backend
4. ✅ Tester avec `stripe trigger payment_intent.succeeded`

---

## 📚 Documentation

- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Security](https://stripe.com/docs/webhooks/signatures)

