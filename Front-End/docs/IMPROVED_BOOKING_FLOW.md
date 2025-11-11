# 🔄 Flux de Réservation Amélioré - COOK US

> ⚠️ **ATTENTION** : Cette version a été corrigée. Voir `IMPROVED_BOOKING_FLOW_CORRECTED.md` pour la version finale avec l'architecture corrigée utilisant la table `reservations`.

## 📋 Vue d'ensemble du flux actuel

### Flux actuel (basique)
1. Client poste une demande publique
2. Chefs voient la demande et font des propositions
3. Client reçoit les propositions (accepte/refuse)
4. Les deux peuvent converser par messagerie
5. On procède au booking
6. Client paie 30% de la somme
7. En cas d'annulation par le client → pas de remboursement

---

## 🚀 Proposition de flux amélioré

### Phase 1 : Publication et Découverte (Jours 1-3)

#### 1.1 Client publie une demande publique
**Statut initial** : `PUBLIC_REQUEST_PENDING`

- **Informations requises** :
  - Date et heure souhaitée
  - Type de repas (déjeuner, dîner, événement)
  - Nombre de convives
  - Budget estimé (optionnel mais recommandé)
  - Adresse complète
  - Restrictions alimentaires / allergies
  - Services additionnels (courses, mise de table, vaisselle)
  - Description détaillée

- **Fonctionnalités** :
  - ✅ Délai de réponse : 3 jours pour recevoir des propositions
  - ✅ Notification automatique aux cuisiniers dans la zone
  - ✅ Badge "Nouvelle demande" pour les cuisiniers
  - ✅ Possibilité de modifier/annuler avant la première proposition

#### 1.2 Cuisiniers voient et proposent
**Statut pour chaque proposition** : `PROPOSAL_PENDING`

- **Informations de la proposition** :
  - Prix total (détaillé : service + courses + extras)
  - Message personnalisé
  - Disponibilité confirmée
  - Expérience pertinente
  - Note moyenne du cuisinier

- **Fonctionnalités** :
  - ✅ Les cuisiniers peuvent voir combien d'autres ont déjà proposé (sans voir les prix)
  - ✅ Système de "favoris" pour sauvegarder des demandes
  - ✅ Notification au client à chaque nouvelle proposition
  - ✅ Délai de 48h pour proposer après publication

---

### Phase 2 : Sélection et Négociation (Jours 3-5)

#### 2.1 Client reçoit et compare les propositions
**Statut** : `PROPOSAL_RECEIVED` (pour chaque proposition)

- **Fonctionnalités** :
  - ✅ Vue comparative des propositions (tableau)
  - ✅ Filtres : prix, note, disponibilité
  - ✅ Profils des cuisiniers accessibles
  - ✅ Système de "shortlist" (3 favoris max)
  - ✅ Délai de 72h pour répondre aux propositions

#### 2.2 Client sélectionne une proposition
**Actions possibles** :
- ✅ **Accepter** → Passage à `PROPOSAL_ACCEPTED`
- ✅ **Refuser** → Statut `PROPOSAL_REJECTED` (avec raison optionnelle)
- ✅ **Demander des modifications** → Statut `PROPOSAL_NEGOTIATION`
- ✅ **Poser des questions** → Déblocage de la messagerie (sans engagement)

**Règles** :
- Une fois acceptée, les autres propositions sont automatiquement refusées
- Le cuisinier accepté reçoit une notification immédiate
- Les autres cuisiniers reçoivent une notification de refus (polie)

---

### Phase 3 : Discussion et Finalisation (Jours 5-7)

#### 3.1 Messagerie débloquée
**Statut** : `PROPOSAL_ACCEPTED` → Conversation active

- **Fonctionnalités** :
  - ✅ Chat en temps réel entre client et cuisinier
  - ✅ Partage de photos (menu, ingrédients, etc.)
  - ✅ Finalisation des détails (menu, horaires précis, etc.)
  - ✅ Possibilité de modifier certains détails (avec accord mutuel)

#### 3.2 Finalisation du booking
**Statut** : `BOOKING_PENDING_PAYMENT`

- **Étapes** :
  1. Cuisinier confirme les détails finaux
  2. Client valide le booking
  3. Système calcule le montant total
  4. Passage à l'étape de paiement

---

### Phase 4 : Paiement et Confirmation (Jours 7-8)

#### 4.1 Paiement de l'acompte
**Montant** : 30% du total (acompte de réservation)

- **Fonctionnalités** :
  - ✅ Paiement sécurisé (Stripe)
  - ✅ Options de paiement multiples (carte, virement)
  - ✅ Reçu automatique envoyé
  - ✅ Notification au cuisinier du paiement reçu

**Statut après paiement** : `BOOKING_CONFIRMED`

#### 4.2 Confirmation du booking
- ✅ Booking officiellement réservé
- ✅ Calendrier mis à jour (client et cuisinier)
- ✅ Rappels automatiques programmés
- ✅ Préparation du service peut commencer

---

### Phase 5 : Service et Finalisation (Jour J)

#### 5.1 Le jour du service
**Statut** : `BOOKING_IN_PROGRESS` (automatique à l'heure de début)

- **Fonctionnalités** :
  - ✅ Check-in du cuisinier (arrivée confirmée)
  - ✅ Suivi en temps réel (optionnel)
  - ✅ Communication pendant le service si besoin

#### 5.2 Fin du service
**Statut** : `BOOKING_COMPLETED`

- **Étapes** :
  1. Cuisinier marque le service comme terminé
  2. Paiement du solde (70% restant) déclenché automatiquement
  3. Client reçoit une demande d'avis (7 jours pour noter)
  4. Cuisinier reçoit le paiement final (délai de sécurité : 24h)

---

## 💰 Système de Paiement Amélioré

### Structure de paiement

```
Montant total = Service + Courses + Extras
├── Acompte (30%) → Payé à la confirmation
│   └── Non remboursable si annulation par le client
│
└── Solde (70%) → Payé après le service
    └── Remboursable selon les règles d'annulation
```

### Règles de remboursement améliorées

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

#### Annulation mutuelle / Force majeure

- ✅ Remboursement intégral des deux parties
- ✅ Pas de pénalité
- ✅ Exemples : maladie grave, catastrophe naturelle, etc.

---

## 📊 Statuts de Booking Améliorés

```typescript
type BookingStatus = 
  // Phase 1 : Publication
  | "PUBLIC_REQUEST_PENDING"      // Demande publique publiée, en attente de propositions
  | "PUBLIC_REQUEST_EXPIRED"       // Délai de 3 jours écoulé sans propositions
  
  // Phase 2 : Propositions
  | "PROPOSAL_PENDING"            // Proposition envoyée par un cuisinier, en attente
  | "PROPOSAL_RECEIVED"           // Client a reçu la proposition (pour tracking)
  | "PROPOSAL_ACCEPTED"           // Client a accepté la proposition
  | "PROPOSAL_REJECTED"           // Client a refusé la proposition
  | "PROPOSAL_NEGOTIATION"        // Client demande des modifications
  
  // Phase 3 : Discussion
  | "BOOKING_PENDING_PAYMENT"    // Proposition acceptée, détails finalisés, en attente de paiement
  
  // Phase 4 : Paiement
  | "BOOKING_CONFIRMED"           // Acompte payé (30%), booking confirmé
  
  // Phase 5 : Service
  | "BOOKING_IN_PROGRESS"         // Service en cours
  | "BOOKING_COMPLETED"           // Service terminé, solde à payer
  
  // Final
  | "BOOKING_PAID_FULL"           // Solde payé (70%), tout est réglé
  | "BOOKING_CANCELLED"           // Booking annulé (avec raison)
  | "BOOKING_DISPUTED";           // Litige ouvert
```

---

## 🔔 Système de Notifications Amélioré

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

## 🎯 Améliorations Clés Proposées

### 1. Système de délais et deadlines
- ✅ Délai de 3 jours pour recevoir des propositions
- ✅ Délai de 72h pour répondre aux propositions
- ✅ Délai de 48h pour payer l'acompte
- ✅ Rappels automatiques avant les deadlines

### 2. Système de négociation
- ✅ Possibilité de demander des modifications avant d'accepter
- ✅ Chat débloqué même avant acceptation (pour poser des questions)
- ✅ Système de contre-propositions

### 3. Système de remboursement équitable
- ✅ Règles claires selon qui annule et quand
- ✅ Compensation pour annulation tardive du cuisinier
- ✅ Protection des deux parties

### 4. Système de propositions amélioré
- ✅ Vue comparative pour le client
- ✅ Système de shortlist
- ✅ Notifications en temps réel

### 5. Gestion des conversations
- ✅ Chat débloqué après acceptation (ou pour questions)
- ✅ Partage de photos et documents
- ✅ Historique complet de la conversation

### 6. Système de paiement sécurisé
- ✅ Acompte de 30% à la confirmation
- ✅ Solde de 70% après le service
- ✅ Paiement automatique du solde
- ✅ Délai de sécurité de 24h avant versement au cuisinier

### 7. Suivi et transparence
- ✅ Statut clair à chaque étape
- ✅ Historique complet des actions
- ✅ Notifications à chaque changement d'état

---

## 🔄 Diagramme de Flux

```
[Client] Publie demande publique
    ↓
[Status: PUBLIC_REQUEST_PENDING]
    ↓
[Cuisiniers] Voient et proposent
    ↓
[Status: PROPOSAL_PENDING] (pour chaque proposition)
    ↓
[Client] Reçoit propositions
    ↓
[Client] Sélectionne une proposition
    ├─→ Accepte → [Status: PROPOSAL_ACCEPTED]
    ├─→ Refuse → [Status: PROPOSAL_REJECTED]
    └─→ Négocie → [Status: PROPOSAL_NEGOTIATION]
    ↓
[Status: PROPOSAL_ACCEPTED]
    ↓
[Messagerie] Débloquée
    ↓
[Discussion] Finalisation des détails
    ↓
[Status: BOOKING_PENDING_PAYMENT]
    ↓
[Client] Paie acompte (30%)
    ↓
[Status: BOOKING_CONFIRMED]
    ↓
[Jour J] Service
    ↓
[Status: BOOKING_IN_PROGRESS]
    ↓
[Fin du service]
    ↓
[Status: BOOKING_COMPLETED]
    ↓
[Paiement automatique] Solde (70%)
    ↓
[Status: BOOKING_PAID_FULL]
    ↓
[Demande d'avis] (7 jours)
```

---

## 📝 Prochaines Étapes d'Implémentation

### Priorité 1 (Essentiel)
1. ✅ Implémenter les nouveaux statuts de booking
2. ✅ Système de propositions structuré
3. ✅ Déblocage conditionnel de la messagerie
4. ✅ Système de paiement en 2 temps (30% / 70%)

### Priorité 2 (Important)
5. ✅ Système de délais et deadlines
6. ✅ Notifications améliorées
7. ✅ Règles de remboursement
8. ✅ Vue comparative des propositions

### Priorité 3 (Amélioration)
9. ✅ Système de négociation
10. ✅ Système de shortlist
11. ✅ Rappels automatiques
12. ✅ Suivi en temps réel

---

## 💡 Points d'Attention

1. **Sécurité des paiements** : Toujours utiliser Stripe avec escrow
2. **Transparence** : Tous les frais doivent être clairs dès le début
3. **Communication** : Faciliter la communication entre les parties
4. **Flexibilité** : Permettre des ajustements avec accord mutuel
5. **Protection** : Protéger à la fois le client et le cuisinier

---

## 🎨 Expérience Utilisateur

### Pour le CLIENT
- Interface claire et intuitive
- Vue comparative des propositions
- Notifications en temps réel
- Processus de paiement simplifié
- Suivi du service

### Pour le CUISINIER
- Alertes pour nouvelles demandes
- Outil de proposition rapide
- Suivi des propositions envoyées
- Gestion du calendrier
- Suivi des paiements

---

Cette proposition améliore significativement le flux actuel en ajoutant :
- ✅ Plus de clarté dans les statuts
- ✅ Meilleure protection des deux parties
- ✅ Système de remboursement équitable
- ✅ Communication facilitée
- ✅ Expérience utilisateur améliorée

