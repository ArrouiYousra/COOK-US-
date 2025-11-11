# COOK‑US API Documentation

> Version : 1.0 – Dernière mise à jour : 11 novembre 2025  
> Hébergement : Backend (Express + Supabase) – Frontend (Next.js)

Cette documentation décrit les principales routes de l’API REST exposée par la plateforme COOK‑US.  
Les URL sont préfixées par `https://cook-us-back-end.onrender.com/api` en production et `http://localhost:5000/api` en environnement local.

---

## 1. Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST`  | `/auth/register/client` | Inscription d’un client |
| `POST`  | `/auth/register/cook`   | Inscription d’un cuisinier |
| `POST`  | `/auth/login`           | Connexion (email + mot de passe) |
| `POST`  | `/auth/logout`          | Déconnexion (invalide le cookie de session) |
| `GET`   | `/auth/me`              | Récupération de la session courante |
| `POST`  | `/auth/password/forgot` | Déclenche un email de réinitialisation |
| `POST`  | `/auth/password/reset`  | Réinitialise le mot de passe |
| `POST`  | `/auth/oauth/google`    | Démarre un flux OAuth Google (client ou cook) |

> **Authentification** :  
> - Les endpoints protégé·es exigent le cookie de session (`withCredentials` côté client).  
> - Les tokens JWT sont stockés côté serveur, côté client seules les routes ouvertes restent accessibles.

---

## 2. Profils & Utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/profiles/me`                     | Profil détaillé de l’utilisateur connecté |
| `PUT`   | `/profiles/me`                     | Mise à jour des informations personnelles |
| `POST`  | `/profiles/me/avatar`              | Upload avatar (base64 → Supabase Storage) |
| `GET`   | `/profiles/cooks`                  | Liste paginée des profils cuisiniers |
| `GET`   | `/profiles/cooks/:cookProfileId`   | Détails d’un cuisinier |
| `GET`   | `/profiles/clients/:clientId`      | Profil public d’un client |

Les préférences de notifications, les adresses et la sécurité (2FA, mot de passe) disposent de routes dédiées (cf. sections 6, 8 et 9).

---

## 3. Favoris

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/favorites`                    | Liste des cuisiniers favoris du client |
| `POST`  | `/favorites/:cookProfileId`     | Ajoute un favori |
| `DELETE`| `/favorites/:cookProfileId`     | Supprime un favori |
| `GET`   | `/favorites/:cookProfileId`     | Vérifie si un cuisinier est en favori |

---

## 4. Avis / Reviews

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST`  | `/reviews`                      | Création d’un avis pour une réservation terminée |
| `GET`   | `/reviews/me`                  | Avis rédigés par le client connecté |
| `GET`   | `/reviews/received`            | Avis reçus par le cuisinier connecté |
| `POST`  | `/reviews/upload-image`        | Upload d’une photo d’avis (base64) |

Payload `POST /reviews` :
```json
{
  "booking_id": "uuid",
  "rating": 5,
  "comment": "Super prestation !",
  "detailed_ratings": { "savor": 5, "presentation": 4 },
  "photos": ["https://..."],
  "is_recommended": true
}
```

---

## 5. Réservations & Propositions (Flux 2)

### 5.1 Routes côté clients

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/bookings`                           | Liste des réservations (confirmées + historiques) |
| `GET`   | `/bookings/:bookingId`                | Détails d’une réservation |
| `POST`  | `/bookings`                           | Proposition directe à un cuisinier |
| `POST`  | `/bookings/public`                    | Création d’une demande publique |
| `GET`   | `/bookings/public`                    | Recherche de demandes publiques (pour les cuisiniers) |
| `GET`   | `/bookings/my-proposals`              | Suivi des propositions envoyées par le client |

### 5.2 Routes côté cuisiniers

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/bookings/received-proposals`        | Liste des propositions directes reçues |
| `PUT`   | `/bookings/:bookingId/accept`         | Accepter une proposition (client ou cuisinier suivant le statut) |
| `PUT`   | `/bookings/:bookingId/reject`         | Refuser une proposition |
| `GET`   | `/bookings/calendar` (à venir)        | Vue calendrier cuisinier |

### 5.3 Propositions sur demandes publiques (Flux 1)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST`  | `/reservations/:bookingId`               | Un cuisinier répond à une demande publique |
| `GET`   | `/reservations/:bookingId`               | Liste des propositions sur une demande |
| `GET`   | `/reservations/my-proposals`             | Propositions envoyées par le cuisinier |
| `PUT`   | `/reservations/:reservationId/cancel`    | Annuler sa proposition |
| `PUT`   | `/reservations/:reservationId/accept`    | Acceptation par le client |
| `PUT`   | `/reservations/:reservationId/reject`    | Refus par le client |

---

## 6. Notifications & Realtime

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/notifications`                         | Liste (avec pagination, filtres type) |
| `PUT`   | `/notifications/:id/read`                | Marquer comme lue |
| `PUT`   | `/notifications/:id/unread`              | Marquer comme non lue |
| `PUT`   | `/notifications/read-all`                | Tout marquer comme lu |
| `GET`   | `/notifications/preferences`             | Préférences de notification |
| `PUT`   | `/notifications/preferences`             | Mise à jour (email / SMS / app / promotions) |

Supabase Realtime :
- Canal `notifications` (INSERT / UPDATE / DELETE) – le frontend s’abonne via `lib/supabase/client.ts` et le hook `useNotifications`.

---

## 7. Paiements & Stripe

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/payments/methods`            | Liste des cartes Stripe du client |
| `POST`  | `/payments/methods`            | Ajout d’une carte (SetupIntent) |
| `DELETE`| `/payments/methods/:pmId`      | Suppression d’un moyen de paiement |
| `POST`  | `/payments/methods/:pmId/default` | Définit la carte par défaut |
| `POST`  | `/payments/:bookingId/deposit` | Paiement de l’acompte (30 %) |
| `POST`  | `/payments/:bookingId/remaining` | Paiement du solde (70 %) |
| `POST`  | `/payments/stripe/webhook`     | Webhook Stripe (gère les intents et transferts) |

---

## 8. Paramètres Compte & Sécurité

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST`  | `/security/password`   | Changement de mot de passe |
| `POST`  | `/security/2fa/setup`  | Génère secret + QR code |
| `POST`  | `/security/2fa/enable` | Active la 2FA (code requis) |
| `POST`  | `/security/2fa/disable`| Désactive la 2FA |
| `DELETE`| `/security/delete`     | Suppression du compte (mot de passe requis) |

---

## 9. Adresses & Mapbox

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/addresses`               | Liste des adresses utilisateur |
| `POST`  | `/addresses`               | Création (avec géocodage Mapbox) |
| `PUT`   | `/addresses/:id`           | Mise à jour |
| `DELETE`| `/addresses/:id`           | Suppression |
| `PUT`   | `/addresses/:id/default`   | Définit l’adresse par défaut |
| `GET`   | `/mapbox/token`            | Récupération du token d’autocomplétion (proxy) |

---

## 10. Statistiques

### Clients (`/dashboard/client/stats`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/stats/client/summary`      | Total dépensé, nombre de réservations |
| `GET`   | `/stats/client/timeseries`   | Séries temporelles (jour / semaine / mois) |
| `GET`   | `/stats/client/bookings`     | Historique détaillé (filtres, tri) |
| `GET`   | `/stats/client/export`       | Export CSV |

### Cuisiniers (`/dashboard/cook/stats`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/stats/cook/summary`        | Revenus, réservations |
| `GET`   | `/stats/cook/timeseries`     | Séries temporelles recettes / demandes |
| `GET`   | `/stats/cook/distribution`   | Répartition par type de prestations |

### Admin (projeté)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/stats/admin/summary`       | KPI globaux |
| `GET`   | `/stats/admin/timeseries`    | Séries opérationnelles |
| `GET`   | `/stats/admin/distributions` | Répartition par rôles, villes, revenus |
| `GET`   | `/stats/admin/users`         | Tableau utilisateurs (avec pagination) |

---

## 11. Messagerie & Conversations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/messages/conversations`            | Conversations accessibles |
| `GET`   | `/messages/conversations/:id`        | Messages d’une conversation |
| `POST`  | `/messages/conversations/:id`        | Envoi d’un message texte |
| `POST`  | `/messages/conversations/:id/image`  | Envoi d’une image (Upload Supabase Storage) |
| `POST`  | `/messages/conversations/:id/read`   | Marque comme lu |

Déblocage automatique de la messagerie :
- Clients ↔️ cuisiniers après acceptation d’une proposition (`status = ACCEPTED`).
- Notifications envoyées à chaque nouveau message.

---

## 12. Portfolios, Certifications & Disponibilités

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`   | `/portfolio/:cookProfileId`           | Éléments du portfolio cuisinier |
| `POST`  | `/portfolio/:cookProfileId`           | Ajout (images, descriptions, catégories) |
| `DELETE`| `/portfolio/items/:itemId`            | Suppression |
| `GET`   | `/certifications/:cookProfileId`      | Certifications cuisinier |
| `POST`  | `/certifications/:cookProfileId`      | Ajout (upload document) |
| `DELETE`| `/certifications/items/:itemId`       | Suppression |
| `GET`   | `/availabilities/:cookProfileId`      | Disponibilités récurrentes |
| `POST`  | `/availabilities/:cookProfileId`      | Création / mise à jour |
| `DELETE`| `/availabilities/:availabilityId`     | Suppression d’un créneau |
| `GET`   | `/availabilities/:cookProfileId/blocked-dates` | Jours bloqués |
| `POST`  | `/availabilities/:cookProfileId/blocked-dates` | Ajout |
| `DELETE`| `/availabilities/blocked-dates/:id`   | Suppression |

---

## 13. Administration (roadmap)

Les endpoints Admin (gestion utilisateurs, monitoring, modération) suivent la convention `/admin/*` avec rôle `ADMIN` requis.  
Exemples planifiés :
- `GET /admin/users` – Gestion des comptes et statuts
- `POST /admin/notifications/broadcast` – Envoi d’annonces globales
- `GET /admin/audits` – Suivi des logs critiques

---

## 14. Conventions & Erreurs

- Réponses JSON enveloppées d’un objet (`{ message, data, ... }` ou `{ error, message }`).
- Codes d’état : `200/201` succès, `400` validation, `401/403` accès, `404` ressource absente, `409` conflit, `422` validation complexe, `500` erreur interne.
- Les identifiants sont des UUID v4.
- Les dates sont retournées en ISO 8601 (UTC).

---

## 15. Outils & Monitoring

- Documentation Swagger : `/api/docs` (non publiée en prod pour l’instant).  
- Linter & tests : `npx tsc --noEmit`, `npm run lint`, `npm run test`.  
- Santé du service : `GET /health` → `{ status: "ok" }`.

---

Pour toute question ou contribution :  
- Backend : `backend/` (Express + Supabase)  
- Frontend : `Front-End/` (Next.js + Zustand)  
- Contact technique : `tech@cook-us.fr`

Bon développement !

