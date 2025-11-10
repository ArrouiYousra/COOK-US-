# 📱 Configuration Twilio - Service SMS

## ✅ Installation terminée

Le service SMS Twilio est maintenant installé et prêt à être configuré.

## 📋 Ce qui a été fait

1. ✅ Package `twilio` installé
2. ✅ Service créé : `backend/src/core/services/sms.service.ts`
3. ✅ Types TypeScript ajoutés dans `backend/src/types/env.d.ts`

## 🔑 Configuration requise

### Étape 1 : Créer un compte Twilio

1. Aller sur [https://www.twilio.com](https://www.twilio.com)
2. Créer un compte (gratuit avec crédit de test)
3. Vérifier votre numéro de téléphone

### Étape 2 : Obtenir les clés API

1. Dans le dashboard Twilio, aller dans **Console** > **Account** > **API Keys & Tokens**
2. Vous verrez :
   - **Account SID** → `TWILIO_ACCOUNT_SID` (commence par `AC...`)
   - **Auth Token** → `TWILIO_AUTH_TOKEN` (cliquez sur "View" pour le voir)

### Étape 3 : Obtenir un numéro de téléphone

1. Dans le dashboard, aller dans **Phone Numbers** > **Manage** > **Buy a number**
2. Choisir un numéro (gratuit en mode test)
3. Copier le numéro → `TWILIO_PHONE_NUMBER` (format: `+33612345678`)

### Étape 4 : Ajouter dans `.env`

Ajouter dans `backend/.env` :

```env
# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC1234567890abcdef...
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+33612345678
```

**Note importante** :
- En mode test, vous pouvez envoyer des SMS uniquement aux numéros vérifiés
- Pour la production, vous devrez passer à un compte payant

## 📧 Fonctionnalités disponibles

Le service SMS fournit :

1. **sendSms()** - Envoyer un SMS personnalisé
2. **sendBookingConfirmationSms()** - Confirmation de réservation
3. **sendBookingReminderSms()** - Rappel de réservation (24h ou 1h avant)
4. **sendProposalReceivedSms()** - Nouvelle proposition reçue
5. **sendStatusChangeSms()** - Changement de statut

## 🔗 Utilisation

```typescript
import { SmsService } from '@core/services/sms.service';

// Envoyer un SMS simple
await SmsService.sendSms('+33612345678', 'Votre message ici');

// Envoyer une confirmation de réservation
await SmsService.sendBookingConfirmationSms('+33612345678', {
  bookingId: 'booking-123',
  cookName: 'Jean Dupont',
  date: '2024-01-15',
  time: '19:00',
});
```

## ⚠️ Important

1. **Format des numéros** :
   - Utiliser le format international : `+33612345678`
   - Le service ajoute automatiquement `+` si absent

2. **Mode Test** :
   - En mode test, vous ne pouvez envoyer qu'aux numéros vérifiés
   - Ajoutez vos numéros de test dans le dashboard Twilio

3. **Coûts** :
   - Mode test : gratuit (limité aux numéros vérifiés)
   - Production : payant (environ 0.05€ par SMS en France)

4. **Gestion des erreurs** :
   - Le service gère automatiquement les erreurs
   - Les erreurs sont loggées mais n'interrompent pas le processus principal

## 🧪 Tester

```typescript
// Vérifier si Twilio est configuré
if (SmsService.isConfigured()) {
  await SmsService.sendSms('+33612345678', 'Test SMS');
}
```

## 📚 Documentation

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Twilio Pricing](https://www.twilio.com/pricing)

## 🚀 Prochaines étapes

1. ✅ Obtenir les clés API Twilio
2. ✅ Ajouter les clés dans `backend/.env`
3. ⏳ Vérifier votre numéro de téléphone dans Twilio
4. ⏳ Tester l'envoi d'un SMS
5. ⏳ Intégrer dans les controllers (bookings, payments, etc.)

