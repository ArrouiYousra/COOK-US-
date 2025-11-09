# Flux Métier - COOK US

## Vue d'ensemble

COOK US propose **deux flux métier distincts** qui coexistent parfaitement pour offrir une flexibilité maximale aux clients et cuisiniers.

---

## 🔄 Flux 1 : Demande Publique (Flux actuel)

### Description
Le client publie une demande publique, et les cuisiniers peuvent proposer leurs services.

### Étapes

1. **Client publie une demande**
   - Formulaire : titre, description, date, créneau, nombre de personnes, budget, adresse
   - Statut : `pending` (en attente de propositions)

2. **Cuisiniers proposent**
   - Les cuisiniers voient la demande et peuvent proposer leurs services
   - Chaque proposition contient : prix, message, disponibilité

3. **Client accepte une proposition**
   - Le client choisit parmi les propositions reçues
   - Statut : `confirmed` (après acceptation)

4. **Paiement et réservation**
   - Le client paie
   - Statut : `confirmed` → `done` (après le repas)

### Identifiants
- `requestId` : ID de la demande publique
- `proposalId` : null (pas de proposition directe)

---

## 💬 Flux 2 : Proposition Directe (Nouveau flux)

### Description
Le client contacte directement un cuisinier et lui fait une proposition personnalisée.

### Étapes

1. **Client consulte les cuisiniers**
   - Le client parcourt les profils de cuisiniers
   - Il voit leurs disponibilités, spécialités, tarifs

2. **Client fait une proposition**
   - Le client clique sur "Faire une proposition"
   - Formulaire : date, créneau, nombre de personnes, budget proposé, adresse, description
   - Statut : `proposition_pending` (en attente d'acceptation du cuisinier)

3. **Cuisinier accepte la proposition**
   - Le cuisinier reçoit la proposition et peut l'accepter ou la refuser
   - Si acceptée :
     - Statut : `proposition_accepted`
     - **Messages débloqués automatiquement** (conversation créée)
     - Booking créé avec statut `payment_pending`

4. **Discussion et accord**
   - Client et cuisinier peuvent maintenant discuter via la messagerie
   - Ils finalisent les détails ensemble

5. **Paiement**
   - Le client effectue le paiement
   - Statut : `payment_pending` → `confirmed`
   - **Important** : Le rendez-vous n'est **pas booké** tant que le paiement n'est pas effectué

6. **Réservation confirmée**
   - Après paiement, statut : `confirmed`
   - Le rendez-vous est officiellement réservé

### Identifiants
- `requestId` : null (pas de demande publique)
- `proposalId` : ID de la proposition directe
- `conversationId` : ID de la conversation débloquée après acceptation

---

## 🔐 Règles de Coexistence

### 1. Les deux flux sont indépendants
- Un client peut utiliser les deux flux simultanément
- Un cuisinier peut recevoir des propositions des deux flux
- Aucun conflit entre les deux flux

### 2. Statuts de Booking

```typescript
type BookingStatus = 
  | "proposition_pending"    // Flux 2 : Proposition envoyée, en attente
  | "proposition_accepted"   // Flux 2 : Proposition acceptée, messages débloqués
  | "payment_pending"        // Flux 2 : En attente de paiement
  | "confirmed"              // Les deux flux : Réservation confirmée (paiement fait)
  | "pending"                // Flux 1 : Demande publique, en attente de propositions
  | "done"                   // Réservation terminée
  | "cancelled";             // Réservation annulée
```

### 3. Déblocage des Messages

**Règle** : Les messages sont débloqués uniquement après acceptation d'une proposition (Flux 2) ou après acceptation d'une proposition sur une demande publique (Flux 1).

- **Flux 1** : Messages débloqués après acceptation d'une proposition de cuisinier
- **Flux 2** : Messages débloqués automatiquement après acceptation de la proposition du client

### 4. Paiement et Réservation

**Règle critique** : Un rendez-vous n'est **jamais "booké"** tant que le paiement n'est pas effectué.

- Statut `payment_pending` : Proposition acceptée, mais pas encore payée
- Statut `confirmed` : Paiement effectué, réservation officielle
- Le cuisinier ne doit pas considérer le rendez-vous comme confirmé avant le paiement

---

## 📊 Comparaison des Flux

| Aspect | Flux 1 : Demande Publique | Flux 2 : Proposition Directe |
|--------|---------------------------|------------------------------|
| **Initiative** | Client publie | Client propose directement |
| **Visibilité** | Tous les cuisiniers voient | Un seul cuisinier ciblé |
| **Proposition** | Cuisiniers proposent | Client propose |
| **Acceptation** | Client accepte | Cuisinier accepte |
| **Messages** | Débloqués après acceptation | Débloqués automatiquement après acceptation |
| **Paiement** | Après acceptation | Après acceptation et discussion |
| **Réservation** | Confirmée après paiement | Confirmée après paiement |

---

## 🎯 Cas d'Usage

### Quand utiliser le Flux 1 (Demande Publique) ?
- Le client veut comparer plusieurs propositions
- Le client n'a pas de cuisinier spécifique en tête
- Le client veut voir les prix et options disponibles

### Quand utiliser le Flux 2 (Proposition Directe) ?
- Le client a déjà un cuisinier en tête
- Le client veut négocier directement
- Le client veut discuter avant de finaliser
- Le client préfère un contact direct et personnalisé

---

## 🔄 Transitions d'État

### Flux 1 (Demande Publique)
```
pending → confirmed → done
         (après acceptation + paiement)
```

### Flux 2 (Proposition Directe)
```
proposition_pending → proposition_accepted → payment_pending → confirmed → done
                     (messages débloqués)   (paiement requis) (paiement fait)
```

---

## ⚠️ Points d'Attention

1. **Paiement obligatoire** : Un booking n'est jamais confirmé sans paiement
2. **Messages débloqués** : Les messages sont automatiquement débloqués après acceptation (Flux 2)
3. **Pas de conflit** : Les deux flux peuvent coexister sans problème
4. **Identifiants** : Utiliser `requestId` pour Flux 1, `proposalId` pour Flux 2
5. **Conversation** : Créer automatiquement une conversation après acceptation (Flux 2)

---

## 📝 Notes Techniques

- Les types TypeScript sont définis dans `types/index.ts`
- `ClientProposal` : Interface pour les propositions directes
- `Booking` : Interface étendue avec `requestId`, `proposalId`, `conversationId`
- Les statuts sont gérés via `BookingStatus` enum

