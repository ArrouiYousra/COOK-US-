# 💳 Intégration Stripe - Frontend

## ✅ Installation terminée

L'intégration Stripe côté frontend est maintenant complète et prête à être utilisée.

## 📋 Ce qui a été fait

1. ✅ Packages installés :
   - `@stripe/stripe-js` - SDK Stripe pour JavaScript
   - `@stripe/react-stripe-js` - Composants React pour Stripe

2. ✅ Service créé : `Front-End/lib/stripe/client.ts`
   - Initialisation de Stripe avec la clé publique
   - Singleton pour éviter les multiples initialisations

3. ✅ Composants créés :
   - `Front-End/components/payments/StripeProvider.tsx` - Provider Stripe avec Elements
   - `Front-End/components/payments/StripeCheckout.tsx` - Composant de checkout avec Payment Element

4. ✅ API Client mis à jour : `Front-End/lib/api/client.ts`
   - `createPaymentIntent(bookingId)` - Créer un Payment Intent
   - `getPaymentIntent(paymentIntentId)` - Récupérer un Payment Intent

5. ✅ Intégration dans `PaymentSection.tsx`
   - Remplacement des TODOs par la vraie intégration Stripe
   - Gestion du flux de paiement complet

## 🔑 Configuration requise

### Ajouter la clé publique Stripe dans `.env.local`

Ajouter dans `Front-End/.env.local` :

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...
```

**Important** :
- Utilisez la clé **publishable** (commence par `pk_test_...` ou `pk_live_...`)
- Cette clé est **sécurisée** à exposer côté client
- Ne jamais utiliser la clé secrète (`sk_...`) côté frontend

## 🚀 Utilisation

### Dans un composant

```tsx
import { StripeProvider } from "@/components/payments/StripeProvider";
import { apiClient } from "@/lib/api/client";

// Créer un Payment Intent
const response = await apiClient.createPaymentIntent(bookingId);

// Afficher le checkout
<StripeProvider
  clientSecret={response.paymentIntent.client_secret}
  amount={response.paymentIntent.amount}
  currency="eur"
  onSuccess={(paymentIntentId) => {
    console.log("Paiement réussi:", paymentIntentId);
    // Recharger la page ou mettre à jour l'état
  }}
  onError={(error) => {
    console.error("Erreur:", error);
  }}
  onCancel={() => {
    // Retour au formulaire
  }}
/>
```

## 📦 Flux de paiement

1. **Client clique sur "Payer"**
   - `PaymentSection` appelle `apiClient.createPaymentIntent(bookingId)`
   - Le backend crée un Payment Intent Stripe

2. **Affichage du checkout**
   - `StripeProvider` affiche le formulaire de paiement sécurisé
   - L'utilisateur entre ses informations de carte

3. **Confirmation du paiement**
   - Stripe traite le paiement (avec 3D Secure si nécessaire)
   - `onSuccess` est appelé avec le `paymentIntentId`

4. **Mise à jour automatique**
   - Le webhook Stripe met à jour le statut dans la base de données
   - La page se recharge pour afficher le nouveau statut

## 🧪 Tester avec les cartes de test Stripe

### Carte de test (succès)
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future (ex: `12/34`)
- CVC : n'importe quel 3 chiffres (ex: `123`)
- Code postal : n'importe quel code postal (ex: `75001`)

### Carte de test (échec)
- Numéro : `4000 0000 0000 0002`
- Date : n'importe quelle date future
- CVC : n'importe quel 3 chiffres
- Code postal : n'importe quel code postal

### 3D Secure (authentification)
- Numéro : `4000 0025 0000 3155`
- Date : n'importe quelle date future
- CVC : n'importe quel 3 chiffres
- Code postal : n'importe quel code postal
- Confirmer l'authentification dans le popup

## ⚠️ Important

1. **Sécurité** :
   - La clé secrète (`sk_...`) reste **uniquement** côté backend
   - La clé publique (`pk_...`) est sécurisée à exposer côté client
   - Les données de carte ne transitent jamais par votre serveur

2. **Webhooks** :
   - Les webhooks Stripe mettent à jour automatiquement le statut
   - Vérifiez que les webhooks sont configurés dans le dashboard Stripe

3. **Mode Test vs Production** :
   - Utilisez `pk_test_...` pour le développement
   - Utilisez `pk_live_...` pour la production
   - Les clés test et live sont différentes

## 📚 Documentation

- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [Payment Element](https://stripe.com/docs/payments/payment-element)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)

## 🔗 Fichiers créés/modifiés

- ✅ `Front-End/lib/stripe/client.ts` - Service Stripe
- ✅ `Front-End/components/payments/StripeProvider.tsx` - Provider
- ✅ `Front-End/components/payments/StripeCheckout.tsx` - Checkout
- ✅ `Front-End/lib/api/client.ts` - Méthodes API
- ✅ `Front-End/components/dashboard/bookings/PaymentSection.tsx` - Intégration

## 🚀 Prochaines étapes

1. ✅ Ajouter `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dans `.env.local`
2. ⏳ Tester avec les cartes de test Stripe
3. ⏳ Vérifier que les webhooks fonctionnent
4. ⏳ Configurer les clés live pour la production

