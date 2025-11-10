# 📧 Configuration Resend - Service Email Transactionnel

## ✅ Installation terminée

Le service email Resend est maintenant installé et prêt à être utilisé.

## 📋 Ce qui a été fait

1. ✅ Package `resend` installé
2. ✅ Service créé : `backend/src/core/services/email.service.ts`
3. ✅ Types TypeScript ajoutés
4. ✅ Documentation créée : `backend/docs/EMAIL_SERVICE_GUIDE.md`

## 🔑 Configuration requise

### Étape 1 : Créer un compte Resend

1. Aller sur [https://resend.com](https://resend.com)
2. Créer un compte (gratuit jusqu'à 3000 emails/mois)
3. Vérifier votre email

### Étape 2 : Obtenir la clé API

1. Dans le dashboard Resend, aller dans **API Keys**
2. Cliquer sur **Create API Key**
3. Donner un nom (ex: "Cook US Development")
4. Copier la clé (commence par `re_...`)

### Étape 3 : Ajouter dans `.env`

Ajouter dans `backend/.env` :

```env
# Resend (Emails Transactionnels)
RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz
RESEND_FROM_EMAIL=noreply@cook-us.com
RESEND_FROM_NAME=Cook US
```

**Note importante** :
- En développement, vous pouvez utiliser l'email de test fourni par Resend
- Pour la production, vous devrez configurer un domaine personnalisé dans Resend

## 📧 Emails disponibles

Le service fournit 5 types d'emails :

1. **Confirmation de réservation** - Envoyé après paiement réussi
2. **Rappel de réservation** - 24h ou 1h avant
3. **Nouvelle proposition** - Quand un cuisinier propose ses services
4. **Changement de statut** - Quand le statut d'une réservation change
5. **Email générique** - Pour usage personnalisé

## 🔗 Utilisation

```typescript
import { EmailService } from '@core/services/email.service';

// Exemple : Envoyer une confirmation
await EmailService.sendBookingConfirmationEmail(
  'client@example.com',
  {
    bookingId: 'booking-123',
    cookName: 'Jean Dupont',
    date: '2024-01-15',
    time: '19:00',
    numberOfGuests: 4,
    totalPrice: 140.00,
    address: '123 Rue de la Paix, Paris',
  }
);
```

## 📚 Documentation complète

Voir `backend/docs/EMAIL_SERVICE_GUIDE.md` pour :
- Tous les exemples d'utilisation
- Guide d'intégration dans les controllers
- Personnalisation des templates
- Gestion des erreurs

## ⚠️ Important

- Les emails ne doivent **jamais** bloquer le processus principal
- Toujours utiliser try/catch autour des appels email
- Vérifier les préférences utilisateur (`email_notifications`) avant d'envoyer

## 🚀 Prochaines étapes

1. ✅ Obtenir la clé API Resend
2. ✅ Ajouter `RESEND_API_KEY` dans `.env`
3. ⏳ Intégrer dans les controllers (voir guide)
4. ⏳ Tester l'envoi d'emails
5. ⏳ Configurer un domaine personnalisé (production)

