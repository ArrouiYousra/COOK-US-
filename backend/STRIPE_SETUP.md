# 💳 Configuration Stripe - Service de Paiement

## ✅ Installation terminée

Le service Stripe est déjà installé et prêt à être configuré.

## 📋 Ce qui est déjà fait

1. ✅ Package `stripe` installé (v17.3.1)
2. ✅ Service créé : `backend/src/core/services/stripe.service.ts`
3. ✅ Controllers : `backend/src/domain/payments/payment.controllers.ts`
4. ✅ Routes : `backend/src/domain/payments/payment.routes.ts`
5. ✅ Webhooks : `backend/src/domain/payments/payment.webhook.ts`
6. ✅ Types TypeScript définis

## 🔑 Configuration requise

### Étape 1 : Créer un compte Stripe

1. Aller sur [https://stripe.com](https://stripe.com)
2. Créer un compte (gratuit)
3. Activer le mode **Test** (pour le développement)

### Étape 2 : Obtenir les clés API

1. Dans le dashboard Stripe, aller dans **Developers** > **API keys**
2. Vous verrez deux clés :
   - **Publishable key** (commence par `pk_test_...`) → `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (commence par `sk_test_...`) → `STRIPE_SECRET_KEY`
3. Cliquer sur **Reveal test key** pour voir la clé secrète

### Étape 3 : Configurer les webhooks

1. Dans Stripe Dashboard, aller dans **Developers** > **Webhooks**
2. Cliquer sur **Add endpoint**
3. Entrer l'URL de votre webhook :
   - **En développement local** : Utiliser [Stripe CLI](https://stripe.com/docs/stripe-cli) pour tester
   - **En production** : `https://votredomaine.com/api/payments/webhook`
4. Sélectionner les événements à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Cliquer sur **Add endpoint**
6. Copier le **Signing secret** (commence par `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Étape 4 : Ajouter dans `.env`

Ajouter dans `backend/.env` :

```env
# Stripe (Paiements)
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...
STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Note importante** :
- Utilisez les clés **test** pour le développement
- Les clés **live** (commencent par `sk_live_` et `pk_live_`) sont pour la production
- Ne partagez **jamais** vos clés secrètes

## 🧪 Tester en local avec Stripe CLI

Pour tester les webhooks en local :

1. Installer [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Se connecter : `stripe login`
3. Forwarder les webhooks vers votre serveur local :
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
4. Copier le **Signing secret** affiché (commence par `whsec_...`)
5. L'ajouter dans `.env` comme `STRIPE_WEBHOOK_SECRET`

## 📧 Fonctionnalités disponibles

Le service Stripe fournit :

1. **Payment Intents** - Créer des paiements sécurisés
2. **Refunds** - Remboursements
3. **Webhooks** - Suivi des paiements en temps réel
4. **Transfers** - Virements aux cuisiniers (à implémenter)

## 🔗 Routes API disponibles

- `POST /api/payments/create-intent` - Créer un Payment Intent
- `POST /api/payments/webhook` - Recevoir les événements Stripe
- `GET /api/payments/intent/:id` - Récupérer un Payment Intent
- `POST /api/payments/refund` - Créer un remboursement

## ⚠️ Important

- **Mode Test** : Utilisez les cartes de test Stripe
  - Succès : `4242 4242 4242 4242`
  - Échec : `4000 0000 0000 0002`
  - Date d'expiration : n'importe quelle date future
  - CVC : n'importe quel 3 chiffres
- **Sécurité** : Ne jamais exposer `STRIPE_SECRET_KEY` côté frontend
- **Webhooks** : Toujours vérifier la signature des webhooks

## 🚀 Prochaines étapes

1. ✅ Obtenir les clés API Stripe
2. ✅ Ajouter les clés dans `backend/.env`
3. ⏳ Configurer les webhooks (local ou production)
4. ⏳ Tester avec les cartes de test
5. ⏳ Configurer les clés live pour la production

## 📚 Documentation

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

