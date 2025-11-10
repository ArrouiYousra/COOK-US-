# 🔔 Intégration Push Notifications - Résumé

## ✅ Ce qui a été fait

### 1. Migration Base de Données
- ✅ Migration créée : `backend/migrations/003_add_fcm_token_to_users.sql`
- ✅ Ajoute `fcm_token` et `fcm_token_updated_at` dans la table `users`

### 2. Types TypeScript
- ✅ `User` interface mise à jour avec `fcm_token` et `fcm_token_updated_at`

### 3. Services créés
- ✅ `NotificationService` : Service unifié pour envoyer notifications (DB + Push + Email + SMS)
- ✅ Routes FCM : `POST /api/notifications/fcm-token` et `DELETE /api/notifications/fcm-token`

### 4. Intégration dans les webhooks
- ✅ `payment.webhook.ts` : Utilise `NotificationService` pour les paiements
  - Paiement réussi → Push + Email + SMS
  - Paiement échoué → Notification
  - Remboursement → Notification

## 📋 Comment ça fonctionne maintenant

### Flux de notification

1. **Événement déclencheur** (ex: paiement réussi)
2. **NotificationService.sendNotification()** est appelé
3. **Création en base de données** (toujours)
4. **Envoi Push** si :
   - `notifications_enabled = true`
   - `fcm_token` existe
   - Firebase est configuré
5. **Envoi Email** si :
   - `notifications_enabled = true`
   - `email_notifications = true`
   - Resend est configuré
6. **Envoi SMS** si :
   - `notifications_enabled = true`
   - `sms_notifications = true`
   - `phone` existe
   - Twilio est configuré

### Exemple d'utilisation

```typescript
import { NotificationService } from '@core/services/notification.service';

// Notification simple
await NotificationService.sendNotification(userId, {
  user_id: userId,
  type: 'BOOKING_CONFIRMED',
  title: 'Réservation confirmée',
  message: 'Votre réservation est confirmée.',
  action_url: '/dashboard/bookings/123',
});

// Notification spécialisée (avec templates)
await NotificationService.sendBookingConfirmationNotification(userId, {
  bookingId: 'booking-123',
  cookName: 'Jean Dupont',
  date: '2024-01-15',
  time: '19:00',
  numberOfGuests: 4,
  totalPrice: 140.00,
  address: '123 Rue de la Paix',
});
```

## 🔧 Configuration requise

### 1. Appliquer la migration

Exécuter dans Supabase SQL Editor :
```sql
-- Contenu de backend/migrations/003_add_fcm_token_to_users.sql
```

### 2. Variables d'environnement

Dans `backend/.env` :
```env
# Firebase (Push Notifications) - Optionnel
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Resend (Email) - Déjà configuré
RESEND_API_KEY=re_...

# Twilio (SMS) - Déjà configuré
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...
```

## 📱 Frontend - Enregistrer le token FCM

### Route API disponible

```typescript
// Enregistrer le token FCM
POST /api/notifications/fcm-token
Body: { fcm_token: "fcm-token-here" }

// Supprimer le token FCM (logout)
DELETE /api/notifications/fcm-token
```

### Exemple d'utilisation frontend

```typescript
// Après avoir obtenu le token FCM depuis Firebase
const fcmToken = await getToken(messaging, { vapidKey: '...' });

// Enregistrer dans le backend
await apiClient.client.post('/notifications/fcm-token', {
  fcm_token: fcmToken,
});
```

## ⚠️ Important

1. **Migration à appliquer** : Exécuter `003_add_fcm_token_to_users.sql` dans Supabase
2. **Gestion des erreurs** : Les notifications push/email/SMS ne bloquent jamais le processus principal
3. **Préférences utilisateur** : Respectées automatiquement (notifications_enabled, email_notifications, sms_notifications)
4. **Tokens invalides** : Gérés automatiquement (pas d'erreur si token expiré)

## 🚀 Prochaines étapes

1. ✅ Appliquer la migration SQL
2. ⏳ Configurer Firebase (si besoin de push)
3. ⏳ Implémenter la récupération du token FCM côté frontend
4. ⏳ Tester l'envoi de notifications

## 📚 Documentation

- Migration : `backend/migrations/003_add_fcm_token_to_users.sql`
- Service : `backend/src/core/services/notification.service.ts`
- Routes FCM : `backend/src/domain/notifications/fcm-token.controllers.ts`
- Firebase Setup : `backend/FIREBASE_SETUP.md`

