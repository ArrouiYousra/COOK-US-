# 🔄 Flux de Réservation Amélioré - COOK US (Version Corrigée)

## 🎯 Architecture Corrigée

### Structure de Données

```typescript
// 1. Booking (Demande publique ou réservation directe)
interface Booking {
  id: string;
  client_profile_id: string;
  cook_profile_id: string | null;  // NULL = demande publique, non-NULL = cuisinier assigné
  status: BookingStatus;
  // Paiement en 2 temps
  deposit_amount: number | null;      // 30% (acompte)
  remaining_amount: number | null;    // 70% (solde)
  deposit_paid_at: string | null;
  remaining_paid_at: string | null;
  // ... autres champs
}

// 2. Reservation (Proposition d'un cuisinier sur une demande publique)
interface Reservation {
  id: string;
  booking_id: string;           // Référence à la demande publique
  cook_profile_id: string;      // Le cuisinier qui propose
  status: ReservationStatus;    // PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED
  proposed_price: number;
  proposed_hours: number;
  message: string;
  expires_at: string;           // 72h après création
  accepted_at: string | null;
  rejected_at: string | null;
  // ... autres champs
}
```

### Statuts Simplifiés

```typescript
// Statuts de Booking (simplifiés)
type BookingStatus = 
  | "PENDING"              // Demande publique en attente OU proposition directe en attente
  | "ACCEPTED"            // Proposition acceptée (en attente de paiement)
  | "CONFIRMED"           // Acompte payé (30%), réservation confirmée
  | "IN_PROGRESS"         // Service en cours
  | "COMPLETED"           // Service terminé, solde à payer
  | "CANCELLED"           // Annulé
  | "DISPUTED";           // Litige ouvert

// Statuts de Reservation (propositions)
type ReservationStatus = 
  | "PENDING"             // Proposition envoyée, en attente
  | "ACCEPTED"            // Acceptée par le client
  | "REJECTED"            // Refusée par le client
  | "CANCELLED"           // Annulée par le cuisinier
  | "EXPIRED";            // Expirée (72h sans réponse)
```

---

## 🔄 Flux Corrigé (Flux 1 : Demande Publique)

### Phase 1 : Publication (Jours 1-3)

#### 1.1 Client publie une demande publique
```
Action : Client crée une demande
→ Booking créé avec :
  - cook_profile_id = NULL
  - status = 'PENDING'
  - deposit_amount = NULL
  - remaining_amount = NULL
```

**Fonctionnalités** :
- ✅ Délai de 3 jours pour recevoir des propositions
- ✅ Notification automatique aux cuisiniers dans la zone
- ✅ Badge "Nouvelle demande" pour les cuisiniers
- ✅ Possibilité de modifier/annuler avant la première proposition

#### 1.2 Cuisiniers proposent
```
Action : Cuisinier fait une proposition
→ Reservation créée avec :
  - booking_id = ID de la demande publique
  - cook_profile_id = ID du cuisinier
  - status = 'PENDING'
  - expires_at = now() + 72h
  - proposed_price = prix proposé
  - message = message personnalisé
```

**Fonctionnalités** :
- ✅ Les cuisiniers peuvent voir combien d'autres ont déjà proposé (sans voir les prix)
- ✅ Système de "favoris" pour sauvegarder des demandes
- ✅ Notification au client à chaque nouvelle proposition
- ✅ Délai de 72h pour que le client réponde (expiration automatique)

---

### Phase 2 : Sélection (Jours 3-5)

#### 2.1 Client reçoit et compare les propositions
```
Action : Client consulte les propositions
→ Récupération de toutes les reservations avec status = 'PENDING'
  pour le booking_id de sa demande
```

**Fonctionnalités** :
- ✅ Vue comparative des propositions (tableau)
- ✅ Filtres : prix, note, disponibilité
- ✅ Profils des cuisiniers accessibles
- ✅ Système de "shortlist" (3 favoris max)
- ✅ Délai de 72h pour répondre aux propositions

#### 2.2 Client sélectionne une proposition
```
Action : Client accepte une proposition
→ Reservation mise à jour :
  - status = 'ACCEPTED'
  - accepted_at = now()
  
→ Autres reservations automatiquement :
  - status = 'REJECTED'
  - rejected_at = now()
  - rejection_reason = 'Autre proposition acceptée'

→ Booking mis à jour :
  - cook_profile_id = cuisinier accepté
  - status = 'ACCEPTED'
  - deposit_amount = proposed_price * 0.3
  - remaining_amount = proposed_price * 0.7
```

**Règles** :
- ✅ Une fois acceptée, les autres propositions sont automatiquement refusées (trigger SQL)
- ✅ Le cuisinier accepté reçoit une notification immédiate
- ✅ Les autres cuisiniers reçoivent une notification de refus (polie)
- ✅ Conversation débloquée automatiquement

---

### Phase 3 : Discussion et Finalisation (Jours 5-7)

#### 3.1 Messagerie débloquée
```
Action : Conversation créée automatiquement
→ Conversation créée avec :
  - booking_id = ID du booking
  - participants = client + cuisinier accepté
```

**Fonctionnalités** :
- ✅ Chat en temps réel entre client et cuisinier
- ✅ Partage de photos (menu, ingrédients, etc.)
- ✅ Finalisation des détails (menu, horaires précis, etc.)
- ✅ Possibilité de modifier certains détails (avec accord mutuel)

#### 3.2 Finalisation du booking
```
Action : Détails finalisés, prêt pour paiement
→ Booking status reste 'ACCEPTED'
→ Prêt pour passage à l'étape de paiement
```

---

### Phase 4 : Paiement et Confirmation (Jours 7-8)

#### 4.1 Paiement de l'acompte
```
Action : Client paie l'acompte (30%)
→ Paiement Stripe créé pour deposit_amount
→ Booking mis à jour :
  - deposit_paid_at = now()
  - deposit_payment_intent_id = stripe_payment_intent_id
  - status = 'CONFIRMED'
```

**Fonctionnalités** :
- ✅ Paiement sécurisé (Stripe)
- ✅ Options de paiement multiples (carte, virement)
- ✅ Reçu automatique envoyé
- ✅ Notification au cuisinier du paiement reçu
- ✅ Délai de 48h pour payer l'acompte (sinon annulation automatique)

#### 4.2 Confirmation du booking
```
→ Booking officiellement réservé
→ Calendrier mis à jour (client et cuisinier)
→ Rappels automatiques programmés
→ Préparation du service peut commencer
```

---

### Phase 5 : Service et Finalisation (Jour J)

#### 5.1 Le jour du service
```
Action : Service commence
→ Booking status = 'IN_PROGRESS' (automatique à l'heure de début)
```

**Fonctionnalités** :
- ✅ Check-in du cuisinier (arrivée confirmée)
- ✅ Suivi en temps réel (optionnel)
- ✅ Communication pendant le service si besoin

#### 5.2 Fin du service
```
Action : Service terminé
→ Booking status = 'COMPLETED'
→ Paiement automatique du solde déclenché (70%)
→ Booking mis à jour :
  - remaining_paid_at = now()
  - remaining_payment_intent_id = stripe_payment_intent_id
  - status = 'PAID_FULL' (ou reste 'COMPLETED')
```

**Étapes** :
1. Cuisinier marque le service comme terminé
2. Paiement du solde (70% restant) déclenché automatiquement
3. Client reçoit une demande d'avis (7 jours pour noter)
4. Cuisinier reçoit le paiement final (délai de sécurité : 24h)

---

## 💰 Système de Paiement en 2 Temps

### Structure

```
Montant total = proposed_price (de la reservation acceptée)
├── Acompte (30%) → Payé à la confirmation
│   └── Non remboursable si annulation par le client
│
└── Solde (70%) → Payé après le service
    └── Remboursable selon les règles d'annulation
```

### Règles de Remboursement Simplifiées

#### Annulation par le CLIENT

| Délai avant le service | Remboursement acompte | Remboursement solde |
|------------------------|----------------------|---------------------|
| **Plus de 7 jours** | ❌ 0% (frais d'annulation) | ✅ 100% (pas encore payé) |
| **Entre 3 et 7 jours** | ❌ 0% (frais d'annulation) | ✅ 50% (dédommagement cuisinier) |
| **Moins de 3 jours** | ❌ 0% | ❌ 0% (trop tardif) |

**Justification** :
- L'acompte sert de garantie pour le cuisinier
- Plus c'est tardif, plus c'est préjudiciable pour le cuisinier
- Le solde n'est payé qu'après le service, donc pas de problème

#### Annulation par le CUISINIER

| Délai avant le service | Remboursement acompte | Compensation client |
|------------------------|----------------------|---------------------|
| **Plus de 7 jours** | ✅ 100% + 10% de compensation | ✅ Client remboursé intégralement |
| **Entre 3 et 7 jours** | ✅ 100% + 20% de compensation | ✅ Client remboursé + dédommagement |
| **Moins de 3 jours** | ✅ 100% + 50% de compensation | ✅ Client remboursé + dédommagement important |

**Justification** :
- Le cuisinier doit assumer sa responsabilité
- Compensation pour le préjudice causé au client
- Plus c'est tardif, plus la compensation est importante

**⚠️ IMPORTANT** : Qui paie la compensation ?
- **Option recommandée** : La plateforme (COOK US) paie la compensation initialement, puis la récupère via une pénalité sur le cuisinier (retard de paiement, suspension, etc.)

#### Annulation mutuelle / Force majeure

- ✅ Remboursement intégral des deux parties
- ✅ Pas de pénalité
- ✅ Exemples : maladie grave, catastrophe naturelle, etc.

---

## 🔔 Système de Notifications

### Notifications pour le CLIENT

1. **Nouvelle proposition reçue**
   - "🎉 [Nom du cuisinier] vous a fait une proposition pour votre demande du [date]"
   - Lien direct vers la proposition

2. **Proposition acceptée**
   - "✅ Votre proposition a été acceptée ! Vous pouvez maintenant discuter avec le client."

3. **Rappel de paiement**
   - "💳 N'oubliez pas de payer l'acompte (30%) pour confirmer votre réservation"
   - Délai : 48h après acceptation

4. **Rappel de service**
   - "📅 Votre service avec [Nom du cuisinier] est prévu demain à [heure]"
   - Envoyé 24h avant

5. **Demande d'avis**
   - "⭐ Comment s'est passé votre expérience avec [Nom du cuisinier] ?"
   - Envoyé après le service

### Notifications pour le CUISINIER

1. **Nouvelle demande publique**
   - "🔔 Une nouvelle demande correspond à vos critères : [Type de repas] le [date]"
   - Lien direct vers la demande

2. **Proposition acceptée**
   - "✅ Votre proposition a été acceptée ! Le client souhaite discuter avec vous."

3. **Paiement reçu**
   - "💰 Acompte de [montant] reçu pour votre réservation du [date]"

4. **Rappel de service**
   - "📅 Votre service avec [Nom du client] est prévu demain à [heure]"
   - Envoyé 24h avant

5. **Paiement final reçu**
   - "💰 Solde de [montant] reçu. Total : [montant total]"

---

## 📊 Diagramme de Flux Corrigé

```
[Client] Publie demande publique
    ↓
[Booking] Créé avec cook_profile_id = NULL, status = 'PENDING'
    ↓
[Cuisiniers] Voient et proposent
    ↓
[Reservations] Créées avec status = 'PENDING', expires_at = +72h
    ↓
[Client] Reçoit propositions
    ↓
[Client] Sélectionne une proposition
    ├─→ Accepte → [Reservation] status = 'ACCEPTED'
    │              [Booking] cook_profile_id = cuisinier, status = 'ACCEPTED'
    │              [Autres Reservations] status = 'REJECTED' (automatique)
    │              [Conversation] Débloquée
    │
    ├─→ Refuse → [Reservation] status = 'REJECTED'
    │
    └─→ Expire (72h) → [Reservation] status = 'EXPIRED'
    ↓
[Status: ACCEPTED]
    ↓
[Discussion] Finalisation des détails
    ↓
[Client] Paie acompte (30%)
    ↓
[Booking] deposit_paid_at = now(), status = 'CONFIRMED'
    ↓
[Jour J] Service
    ↓
[Booking] status = 'IN_PROGRESS' (automatique)
    ↓
[Fin du service]
    ↓
[Booking] status = 'COMPLETED'
    ↓
[Paiement automatique] Solde (70%)
    ↓
[Booking] remaining_paid_at = now(), status = 'PAID_FULL'
    ↓
[Demande d'avis] (7 jours)
```

---

## 🛠️ Plan d'Implémentation

### Phase 1 : Base de Données (URGENT)
1. ✅ Créer la table `reservations` (script SQL fourni)
2. ✅ Ajouter les colonnes de paiement en 2 temps dans `bookings`
3. ✅ Créer les triggers pour auto-rejet des propositions
4. ✅ Créer la fonction d'expiration automatique

### Phase 2 : Backend Core
5. ✅ API `POST /api/reservations` - Créer une proposition
6. ✅ API `GET /api/reservations/booking/:bookingId` - Récupérer les propositions d'une demande
7. ✅ API `PUT /api/reservations/:id/accept` - Accepter une proposition
8. ✅ API `PUT /api/reservations/:id/reject` - Refuser une proposition
9. ✅ API `PUT /api/reservations/:id/cancel` - Annuler une proposition (cuisinier)
10. ✅ Modifier `createPublicRequest` pour créer un booking avec `cook_profile_id = NULL`
11. ✅ Modifier le système de paiement pour gérer acompte/solde

### Phase 3 : Frontend
12. ✅ Page de comparaison des propositions
13. ✅ Interface d'acceptation/refus de proposition
14. ✅ Interface de paiement en 2 temps
15. ✅ Notifications en temps réel

### Phase 4 : Améliorations
16. ✅ Système de délais et deadlines (cron jobs)
17. ✅ Rappels automatiques
18. ✅ Système de matching intelligent
19. ✅ Règles de remboursement automatiques

---

## ✅ Avantages de cette Architecture

1. **Séparation claire** : Booking (demande) vs Reservation (proposition)
2. **Multiples propositions** : Un booking peut avoir plusieurs reservations
3. **Auto-rejet** : Trigger SQL pour rejeter automatiquement les autres propositions
4. **Expiration automatique** : Fonction SQL pour expirer les propositions
5. **Paiement en 2 temps** : Champs dédiés dans bookings
6. **Statuts simplifiés** : Moins de confusion, plus de clarté

---

## 🎯 Conclusion

Cette architecture corrigée résout tous les problèmes identifiés :
- ✅ Utilise une table `reservations` séparée pour les propositions
- ✅ Statuts simplifiés et clairs
- ✅ Paiement en 2 temps intégré
- ✅ Règles de remboursement équitables
- ✅ Messagerie débloquée uniquement après acceptation
- ✅ Délais configurables

**La logique est maintenant "béton" et prête à être implémentée !** 🚀


## 🎯 Architecture Corrigée

### Structure de Données

```typescript
// 1. Booking (Demande publique ou réservation directe)
interface Booking {
  id: string;
  client_profile_id: string;
  cook_profile_id: string | null;  // NULL = demande publique, non-NULL = cuisinier assigné
  status: BookingStatus;
  // Paiement en 2 temps
  deposit_amount: number | null;      // 30% (acompte)
  remaining_amount: number | null;    // 70% (solde)
  deposit_paid_at: string | null;
  remaining_paid_at: string | null;
  // ... autres champs
}

// 2. Reservation (Proposition d'un cuisinier sur une demande publique)
interface Reservation {
  id: string;
  booking_id: string;           // Référence à la demande publique
  cook_profile_id: string;      // Le cuisinier qui propose
  status: ReservationStatus;    // PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED
  proposed_price: number;
  proposed_hours: number;
  message: string;
  expires_at: string;           // 72h après création
  accepted_at: string | null;
  rejected_at: string | null;
  // ... autres champs
}
```

### Statuts Simplifiés

```typescript
// Statuts de Booking (simplifiés)
type BookingStatus = 
  | "PENDING"              // Demande publique en attente OU proposition directe en attente
  | "ACCEPTED"            // Proposition acceptée (en attente de paiement)
  | "CONFIRMED"           // Acompte payé (30%), réservation confirmée
  | "IN_PROGRESS"         // Service en cours
  | "COMPLETED"           // Service terminé, solde à payer
  | "CANCELLED"           // Annulé
  | "DISPUTED";           // Litige ouvert

// Statuts de Reservation (propositions)
type ReservationStatus = 
  | "PENDING"             // Proposition envoyée, en attente
  | "ACCEPTED"            // Acceptée par le client
  | "REJECTED"            // Refusée par le client
  | "CANCELLED"           // Annulée par le cuisinier
  | "EXPIRED";            // Expirée (72h sans réponse)
```

---

## 🔄 Flux Corrigé (Flux 1 : Demande Publique)

### Phase 1 : Publication (Jours 1-3)

#### 1.1 Client publie une demande publique
```
Action : Client crée une demande
→ Booking créé avec :
  - cook_profile_id = NULL
  - status = 'PENDING'
  - deposit_amount = NULL
  - remaining_amount = NULL
```

**Fonctionnalités** :
- ✅ Délai de 3 jours pour recevoir des propositions
- ✅ Notification automatique aux cuisiniers dans la zone
- ✅ Badge "Nouvelle demande" pour les cuisiniers
- ✅ Possibilité de modifier/annuler avant la première proposition

#### 1.2 Cuisiniers proposent
```
Action : Cuisinier fait une proposition
→ Reservation créée avec :
  - booking_id = ID de la demande publique
  - cook_profile_id = ID du cuisinier
  - status = 'PENDING'
  - expires_at = now() + 72h
  - proposed_price = prix proposé
  - message = message personnalisé
```

**Fonctionnalités** :
- ✅ Les cuisiniers peuvent voir combien d'autres ont déjà proposé (sans voir les prix)
- ✅ Système de "favoris" pour sauvegarder des demandes
- ✅ Notification au client à chaque nouvelle proposition
- ✅ Délai de 72h pour que le client réponde (expiration automatique)

---

### Phase 2 : Sélection (Jours 3-5)

#### 2.1 Client reçoit et compare les propositions
```
Action : Client consulte les propositions
→ Récupération de toutes les reservations avec status = 'PENDING'
  pour le booking_id de sa demande
```

**Fonctionnalités** :
- ✅ Vue comparative des propositions (tableau)
- ✅ Filtres : prix, note, disponibilité
- ✅ Profils des cuisiniers accessibles
- ✅ Système de "shortlist" (3 favoris max)
- ✅ Délai de 72h pour répondre aux propositions

#### 2.2 Client sélectionne une proposition
```
Action : Client accepte une proposition
→ Reservation mise à jour :
  - status = 'ACCEPTED'
  - accepted_at = now()
  
→ Autres reservations automatiquement :
  - status = 'REJECTED'
  - rejected_at = now()
  - rejection_reason = 'Autre proposition acceptée'

→ Booking mis à jour :
  - cook_profile_id = cuisinier accepté
  - status = 'ACCEPTED'
  - deposit_amount = proposed_price * 0.3
  - remaining_amount = proposed_price * 0.7
```

**Règles** :
- ✅ Une fois acceptée, les autres propositions sont automatiquement refusées (trigger SQL)
- ✅ Le cuisinier accepté reçoit une notification immédiate
- ✅ Les autres cuisiniers reçoivent une notification de refus (polie)
- ✅ Conversation débloquée automatiquement

---

### Phase 3 : Discussion et Finalisation (Jours 5-7)

#### 3.1 Messagerie débloquée
```
Action : Conversation créée automatiquement
→ Conversation créée avec :
  - booking_id = ID du booking
  - participants = client + cuisinier accepté
```

**Fonctionnalités** :
- ✅ Chat en temps réel entre client et cuisinier
- ✅ Partage de photos (menu, ingrédients, etc.)
- ✅ Finalisation des détails (menu, horaires précis, etc.)
- ✅ Possibilité de modifier certains détails (avec accord mutuel)

#### 3.2 Finalisation du booking
```
Action : Détails finalisés, prêt pour paiement
→ Booking status reste 'ACCEPTED'
→ Prêt pour passage à l'étape de paiement
```

---

### Phase 4 : Paiement et Confirmation (Jours 7-8)

#### 4.1 Paiement de l'acompte
```
Action : Client paie l'acompte (30%)
→ Paiement Stripe créé pour deposit_amount
→ Booking mis à jour :
  - deposit_paid_at = now()
  - deposit_payment_intent_id = stripe_payment_intent_id
  - status = 'CONFIRMED'
```

**Fonctionnalités** :
- ✅ Paiement sécurisé (Stripe)
- ✅ Options de paiement multiples (carte, virement)
- ✅ Reçu automatique envoyé
- ✅ Notification au cuisinier du paiement reçu
- ✅ Délai de 48h pour payer l'acompte (sinon annulation automatique)

#### 4.2 Confirmation du booking
```
→ Booking officiellement réservé
→ Calendrier mis à jour (client et cuisinier)
→ Rappels automatiques programmés
→ Préparation du service peut commencer
```

---

### Phase 5 : Service et Finalisation (Jour J)

#### 5.1 Le jour du service
```
Action : Service commence
→ Booking status = 'IN_PROGRESS' (automatique à l'heure de début)
```

**Fonctionnalités** :
- ✅ Check-in du cuisinier (arrivée confirmée)
- ✅ Suivi en temps réel (optionnel)
- ✅ Communication pendant le service si besoin

#### 5.2 Fin du service
```
Action : Service terminé
→ Booking status = 'COMPLETED'
→ Paiement automatique du solde déclenché (70%)
→ Booking mis à jour :
  - remaining_paid_at = now()
  - remaining_payment_intent_id = stripe_payment_intent_id
  - status = 'PAID_FULL' (ou reste 'COMPLETED')
```

**Étapes** :
1. Cuisinier marque le service comme terminé
2. Paiement du solde (70% restant) déclenché automatiquement
3. Client reçoit une demande d'avis (7 jours pour noter)
4. Cuisinier reçoit le paiement final (délai de sécurité : 24h)

---

## 💰 Système de Paiement en 2 Temps

### Structure

```
Montant total = proposed_price (de la reservation acceptée)
├── Acompte (30%) → Payé à la confirmation
│   └── Non remboursable si annulation par le client
│
└── Solde (70%) → Payé après le service
    └── Remboursable selon les règles d'annulation
```

### Règles de Remboursement Simplifiées

#### Annulation par le CLIENT

| Délai avant le service | Remboursement acompte | Remboursement solde |
|------------------------|----------------------|---------------------|
| **Plus de 7 jours** | ❌ 0% (frais d'annulation) | ✅ 100% (pas encore payé) |
| **Entre 3 et 7 jours** | ❌ 0% (frais d'annulation) | ✅ 50% (dédommagement cuisinier) |
| **Moins de 3 jours** | ❌ 0% | ❌ 0% (trop tardif) |

**Justification** :
- L'acompte sert de garantie pour le cuisinier
- Plus c'est tardif, plus c'est préjudiciable pour le cuisinier
- Le solde n'est payé qu'après le service, donc pas de problème

#### Annulation par le CUISINIER

| Délai avant le service | Remboursement acompte | Compensation client |
|------------------------|----------------------|---------------------|
| **Plus de 7 jours** | ✅ 100% + 10% de compensation | ✅ Client remboursé intégralement |
| **Entre 3 et 7 jours** | ✅ 100% + 20% de compensation | ✅ Client remboursé + dédommagement |
| **Moins de 3 jours** | ✅ 100% + 50% de compensation | ✅ Client remboursé + dédommagement important |

**Justification** :
- Le cuisinier doit assumer sa responsabilité
- Compensation pour le préjudice causé au client
- Plus c'est tardif, plus la compensation est importante

**⚠️ IMPORTANT** : Qui paie la compensation ?
- **Option recommandée** : La plateforme (COOK US) paie la compensation initialement, puis la récupère via une pénalité sur le cuisinier (retard de paiement, suspension, etc.)

#### Annulation mutuelle / Force majeure

- ✅ Remboursement intégral des deux parties
- ✅ Pas de pénalité
- ✅ Exemples : maladie grave, catastrophe naturelle, etc.

---

## 🔔 Système de Notifications

### Notifications pour le CLIENT

1. **Nouvelle proposition reçue**
   - "🎉 [Nom du cuisinier] vous a fait une proposition pour votre demande du [date]"
   - Lien direct vers la proposition

2. **Proposition acceptée**
   - "✅ Votre proposition a été acceptée ! Vous pouvez maintenant discuter avec le client."

3. **Rappel de paiement**
   - "💳 N'oubliez pas de payer l'acompte (30%) pour confirmer votre réservation"
   - Délai : 48h après acceptation

4. **Rappel de service**
   - "📅 Votre service avec [Nom du cuisinier] est prévu demain à [heure]"
   - Envoyé 24h avant

5. **Demande d'avis**
   - "⭐ Comment s'est passé votre expérience avec [Nom du cuisinier] ?"
   - Envoyé après le service

### Notifications pour le CUISINIER

1. **Nouvelle demande publique**
   - "🔔 Une nouvelle demande correspond à vos critères : [Type de repas] le [date]"
   - Lien direct vers la demande

2. **Proposition acceptée**
   - "✅ Votre proposition a été acceptée ! Le client souhaite discuter avec vous."

3. **Paiement reçu**
   - "💰 Acompte de [montant] reçu pour votre réservation du [date]"

4. **Rappel de service**
   - "📅 Votre service avec [Nom du client] est prévu demain à [heure]"
   - Envoyé 24h avant

5. **Paiement final reçu**
   - "💰 Solde de [montant] reçu. Total : [montant total]"

---

## 📊 Diagramme de Flux Corrigé

```
[Client] Publie demande publique
    ↓
[Booking] Créé avec cook_profile_id = NULL, status = 'PENDING'
    ↓
[Cuisiniers] Voient et proposent
    ↓
[Reservations] Créées avec status = 'PENDING', expires_at = +72h
    ↓
[Client] Reçoit propositions
    ↓
[Client] Sélectionne une proposition
    ├─→ Accepte → [Reservation] status = 'ACCEPTED'
    │              [Booking] cook_profile_id = cuisinier, status = 'ACCEPTED'
    │              [Autres Reservations] status = 'REJECTED' (automatique)
    │              [Conversation] Débloquée
    │
    ├─→ Refuse → [Reservation] status = 'REJECTED'
    │
    └─→ Expire (72h) → [Reservation] status = 'EXPIRED'
    ↓
[Status: ACCEPTED]
    ↓
[Discussion] Finalisation des détails
    ↓
[Client] Paie acompte (30%)
    ↓
[Booking] deposit_paid_at = now(), status = 'CONFIRMED'
    ↓
[Jour J] Service
    ↓
[Booking] status = 'IN_PROGRESS' (automatique)
    ↓
[Fin du service]
    ↓
[Booking] status = 'COMPLETED'
    ↓
[Paiement automatique] Solde (70%)
    ↓
[Booking] remaining_paid_at = now(), status = 'PAID_FULL'
    ↓
[Demande d'avis] (7 jours)
```

---

## 🛠️ Plan d'Implémentation

### Phase 1 : Base de Données (URGENT)
1. ✅ Créer la table `reservations` (script SQL fourni)
2. ✅ Ajouter les colonnes de paiement en 2 temps dans `bookings`
3. ✅ Créer les triggers pour auto-rejet des propositions
4. ✅ Créer la fonction d'expiration automatique

### Phase 2 : Backend Core
5. ✅ API `POST /api/reservations` - Créer une proposition
6. ✅ API `GET /api/reservations/booking/:bookingId` - Récupérer les propositions d'une demande
7. ✅ API `PUT /api/reservations/:id/accept` - Accepter une proposition
8. ✅ API `PUT /api/reservations/:id/reject` - Refuser une proposition
9. ✅ API `PUT /api/reservations/:id/cancel` - Annuler une proposition (cuisinier)
10. ✅ Modifier `createPublicRequest` pour créer un booking avec `cook_profile_id = NULL`
11. ✅ Modifier le système de paiement pour gérer acompte/solde

### Phase 3 : Frontend
12. ✅ Page de comparaison des propositions
13. ✅ Interface d'acceptation/refus de proposition
14. ✅ Interface de paiement en 2 temps
15. ✅ Notifications en temps réel

### Phase 4 : Améliorations
16. ✅ Système de délais et deadlines (cron jobs)
17. ✅ Rappels automatiques
18. ✅ Système de matching intelligent
19. ✅ Règles de remboursement automatiques

---

## ✅ Avantages de cette Architecture

1. **Séparation claire** : Booking (demande) vs Reservation (proposition)
2. **Multiples propositions** : Un booking peut avoir plusieurs reservations
3. **Auto-rejet** : Trigger SQL pour rejeter automatiquement les autres propositions
4. **Expiration automatique** : Fonction SQL pour expirer les propositions
5. **Paiement en 2 temps** : Champs dédiés dans bookings
6. **Statuts simplifiés** : Moins de confusion, plus de clarté

---

## 🎯 Conclusion

Cette architecture corrigée résout tous les problèmes identifiés :
- ✅ Utilise une table `reservations` séparée pour les propositions
- ✅ Statuts simplifiés et clairs
- ✅ Paiement en 2 temps intégré
- ✅ Règles de remboursement équitables
- ✅ Messagerie débloquée uniquement après acceptation
- ✅ Délais configurables

**La logique est maintenant "béton" et prête à être implémentée !** 🚀



