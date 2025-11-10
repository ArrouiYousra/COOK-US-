# 🔔 Configuration Firebase Cloud Messaging - Push Notifications

## ✅ Installation terminée

Le service Firebase Cloud Messaging est maintenant installé et prêt à être configuré.

## 📋 Ce qui a été fait

1. ✅ Package `firebase-admin` installé
2. ✅ Service créé : `backend/src/core/services/push.service.ts`
3. ✅ Types TypeScript ajoutés dans `backend/src/types/env.d.ts`

## 🔑 Configuration requise

### Étape 1 : Créer un projet Firebase

1. Aller sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Cliquer sur **Add project** (ou utiliser un projet existant)
3. Suivre les étapes de création

### Étape 2 : Activer Cloud Messaging

1. Dans le projet Firebase, aller dans **Build** > **Cloud Messaging**
2. Cliquer sur **Get started** si pas encore activé

### Étape 3 : Générer une clé de compte de service

1. Dans Firebase Console, aller dans **Project Settings** (⚙️)
2. Aller dans l'onglet **Service accounts**
3. Cliquer sur **Generate new private key**
4. Télécharger le fichier JSON

### Étape 4 : Extraire les informations du JSON

Le fichier JSON téléchargé contient :
```json
{
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
}
```

### Étape 5 : Ajouter dans `.env`

Ajouter dans `backend/.env` :

```env
# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Note importante** :
- `FIREBASE_PRIVATE_KEY` doit être entre guillemets et contenir les `\n` pour les retours à la ligne
- Le service remplace automatiquement `\\n` par `\n`

## 📧 Fonctionnalités disponibles

Le service Push fournit :

1. **sendPushNotification()** - Envoyer une notification à un utilisateur
2. **sendPushNotificationToMultiple()** - Envoyer à plusieurs utilisateurs
3. **sendBookingConfirmationPush()** - Confirmation de réservation
4. **sendBookingReminderPush()** - Rappel de réservation
5. **sendProposalReceivedPush()** - Nouvelle proposition reçue

## 🔗 Utilisation

```typescript
import { PushService } from '@core/services/push.service';

// Envoyer une notification simple
await PushService.sendPushNotification(
  'fcm-token-here',
  'Titre de la notification',
  'Corps de la notification',
  { type: 'CUSTOM', actionUrl: '/dashboard' }
);

// Envoyer une confirmation de réservation
await PushService.sendBookingConfirmationPush('fcm-token-here', {
  bookingId: 'booking-123',
  cookName: 'Jean Dupont',
  date: '2024-01-15',
  time: '19:00',
});
```

## 📱 Frontend - Récupérer le token FCM

### Pour React/Next.js

1. Installer Firebase SDK :
```bash
npm install firebase
```

2. Initialiser Firebase dans votre app :
```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Demander la permission et obtenir le token
getToken(messaging, { vapidKey: 'your-vapid-key' })
  .then((token) => {
    console.log('FCM Token:', token);
    // Envoyer ce token au backend pour le stocker
  });
```

3. Obtenir la VAPID key :
   - Firebase Console > Project Settings > Cloud Messaging
   - Section "Web configuration" > "Web Push certificates"
   - Générer une nouvelle paire de clés si nécessaire

## ⚠️ Important

1. **Tokens FCM** :
   - Les tokens doivent être stockés dans votre base de données (table `users` ou `devices`)
   - Les tokens peuvent expirer et doivent être rafraîchis

2. **Permissions** :
   - Les notifications push nécessitent la permission de l'utilisateur
   - Demander la permission au premier chargement de l'app

3. **Gestion des erreurs** :
   - Les tokens invalides sont automatiquement ignorés
   - Le service ne lance pas d'erreur si le token est invalide (utilisateur peut avoir désinstallé l'app)

4. **Multi-appareils** :
   - Un utilisateur peut avoir plusieurs tokens (plusieurs appareils)
   - Utiliser `sendPushNotificationToMultiple()` pour envoyer à tous les appareils

## 🧪 Tester

```typescript
// Vérifier si Firebase est configuré
if (PushService.isConfigured()) {
  await PushService.sendPushNotification(
    'fcm-token-here',
    'Test',
    'Ceci est un test'
  );
}
```

## 📚 Documentation

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [FCM Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)

## 🚀 Prochaines étapes

1. ✅ Créer un projet Firebase
2. ✅ Générer la clé de compte de service
3. ✅ Ajouter les variables dans `backend/.env`
4. ⏳ Configurer Firebase côté frontend
5. ⏳ Implémenter la récupération des tokens FCM
6. ⏳ Stocker les tokens dans la base de données
7. ⏳ Intégrer dans les controllers

