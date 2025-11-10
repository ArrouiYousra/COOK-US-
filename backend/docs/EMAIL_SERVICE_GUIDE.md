# 📧 Guide d'utilisation du Service Email (Resend)

## ✅ Installation terminée

Le service email transactionnel est maintenant installé et prêt à être utilisé.

## 📋 Ce qui a été installé

1. ✅ **Package Resend** installé dans `backend/package.json`
2. ✅ **Service Email** créé : `backend/src/core/services/email.service.ts`
3. ✅ **Types TypeScript** ajoutés dans `backend/src/types/env.d.ts`
4. ✅ **Documentation** mise à jour dans `backend/ENV_SETUP.md`

## 🔧 Configuration requise

### 1. Obtenir une clé API Resend

1. Créer un compte sur [https://resend.com](https://resend.com)
2. Aller dans **API Keys** > **Create API Key**
3. Donner un nom à la clé (ex: "Cook US Development")
4. Copier la clé API (commence par `re_...`)

### 2. Ajouter la clé dans `.env`

Ajouter dans `backend/.env` :

```env
# Resend (Emails Transactionnels)
RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz
RESEND_FROM_EMAIL=noreply@cook-us.com
RESEND_FROM_NAME=Cook US
```

**Note** : En développement, vous pouvez utiliser l'email de test fourni par Resend sans configurer de domaine personnalisé.

## 📝 Fonctions disponibles

Le service `EmailService` fournit les fonctions suivantes :

### 1. `sendBookingConfirmationEmail()`
Envoie un email de confirmation de réservation au client.

```typescript
import { EmailService } from '@core/services/email.service';

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

### 2. `sendBookingReminderEmail()`
Envoie un rappel de réservation (24h ou 1h avant).

```typescript
await EmailService.sendBookingReminderEmail(
  'client@example.com',
  {
    bookingId: 'booking-123',
    cookName: 'Jean Dupont',
    date: '2024-01-15',
    time: '19:00',
    reminderType: '24h', // ou '1h'
  }
);
```

### 3. `sendProposalReceivedEmail()`
Envoie une notification quand un cuisinier propose ses services.

```typescript
await EmailService.sendProposalReceivedEmail(
  'client@example.com',
  {
    proposalId: 'proposal-123',
    cookName: 'Marie Martin',
    date: '2024-01-15',
    time: '19:00',
    price: 120.00,
  }
);
```

### 4. `sendStatusChangeEmail()`
Envoie une notification de changement de statut.

```typescript
await EmailService.sendStatusChangeEmail(
  'client@example.com',
  {
    bookingId: 'booking-123',
    cookName: 'Jean Dupont',
    status: 'CONFIRMED',
    date: '2024-01-15',
    message: 'Votre réservation a été confirmée.',
  }
);
```

### 5. `sendEmail()` (Générique)
Envoie un email personnalisé.

```typescript
await EmailService.sendEmail(
  'user@example.com',
  'Sujet de l\'email',
  '<h1>Contenu HTML</h1>',
  'Contenu texte brut (optionnel)'
);
```

## 🔗 Exemples d'intégration

### Exemple 1 : Envoyer un email après confirmation de paiement

Dans `backend/src/domain/payments/payment.webhook.ts` :

```typescript
import { EmailService } from '@core/services/email.service';
import { UserStore } from '@stores/user.store';

// Après confirmation du paiement
const clientUser = await UserStore.getUserById(clientUserId);
if (clientUser?.email) {
  try {
    await EmailService.sendBookingConfirmationEmail(clientUser.email, {
      bookingId: booking.id,
      cookName: cookName,
      date: booking.booking_date,
      time: booking.booking_time,
      numberOfGuests: booking.number_of_guests,
      totalPrice: booking.total_price,
      address: booking.address,
    });
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Ne pas bloquer le processus si l'email échoue
  }
}
```

### Exemple 2 : Envoyer un rappel 24h avant

Créer un job/cron qui vérifie les réservations à venir :

```typescript
// Dans un job/cron
const bookingsTomorrow = await BookingStore.getBookingsForDate(tomorrow);

for (const booking of bookingsTomorrow) {
  const clientUser = await UserStore.getUserById(booking.user_id);
  if (clientUser?.email && clientUser.email_notifications) {
    await EmailService.sendBookingReminderEmail(clientUser.email, {
      bookingId: booking.id,
      cookName: cookName,
      date: booking.booking_date,
      time: booking.booking_time,
      reminderType: '24h',
    });
  }
}
```

## ⚠️ Gestion des erreurs

Le service email ne doit **jamais** bloquer le processus principal. Toujours utiliser try/catch :

```typescript
try {
  await EmailService.sendBookingConfirmationEmail(...);
} catch (error) {
  console.error('Email sending failed:', error);
  // Continuer le processus même si l'email échoue
}
```

## 🎨 Personnalisation des templates

Les templates HTML sont dans `backend/src/core/services/email.service.ts`. Vous pouvez :
- Modifier les styles CSS
- Ajouter votre logo
- Personnaliser les couleurs
- Ajouter des liens vers votre site

## 📊 Limites Resend

- **Gratuit** : 3 000 emails/mois
- **Pro** : 50 000 emails/mois (à partir de $20/mois)
- **Rate limit** : 10 emails/seconde (gratuit)

## 🚀 Prochaines étapes

1. ✅ Obtenir la clé API Resend
2. ✅ Ajouter `RESEND_API_KEY` dans `.env`
3. ⏳ Intégrer les appels email dans les controllers
4. ⏳ Tester l'envoi d'emails
5. ⏳ Configurer un domaine personnalisé (optionnel, pour production)

