# Architecture & Principes de Développement - COOK US

## 🎯 Mentalité Senior

## 1. Philosophie de Code

### Chaque ligne a un but
- ❌ Pas de code inutile
- ❌ Pas de hacks ou workarounds
- ✅ Code intentionnel et justifié

### Prévoir le futur
- **Scalabilité** : Architecture qui supporte la croissance
- **Modularité** : Composants réutilisables et indépendants
- **Réutilisabilité** : DRY appliqué systématiquement

### Lisibilité > Tout
- Code auto-documenté
- Noms explicites : fichiers, variables, fonctions
- Structure claire et logique

### Pragmatisme
1. **MVP fonctionnel** d'abord
2. **Optimisation progressive** ensuite (performance, animations, UX)

---

## 2. Architecture Composants

### Principe : 1 Composant = 1 Responsabilité Unique (SRP)

```
UI Components → Purement visuels, pas de logique métier
Hooks → Logique métier ou appels API, typés TS
Pages → Orchestrent composants + hooks
```

### Règles strictes
- ✅ Fichiers courts : **<200 lignes max**
- ✅ Import/export propres et organisés
- ✅ Pas de code dupliqué : helpers, utils, hooks réutilisables
- ❌ Pas de logique métier dans les composants UI

### Structure recommandée
```
components/
  ├── ui/              # Composants shadcn/ui (purement visuels)
  ├── forms/           # Composants de formulaires
  ├── layout/          # Composants de layout
  └── features/        # Composants métier (CookCard, BookingCard, etc.)

hooks/
  ├── api/            # Hooks d'appels API (useFetchCooks, useCreateBooking)
  ├── business/        # Hooks logique métier
  └── ui/             # Hooks UI (useGeolocation, etc.)

pages/ (app/)
  └── [route]/        # Pages qui orchestrent composants + hooks
```

---

## 3. Typage Strict TypeScript

### Règle absolue : JAMAIS `any`

### Types pour chaque entité
```typescript
// ✅ Types définis pour chaque entité
interface User { ... }
interface Cook extends User { ... }
interface Booking { ... }
interface Review { ... }
interface Dish { ... }
interface FormInputs { ... }
```

### Types pour les API
- ✅ Créer des types TS correspondant aux réponses REST
- ✅ Type safety = éviter erreurs runtime

### Valeurs fixes
```typescript
// ✅ Utiliser as const et enum
type BookingStatus = "pending" | "confirmed" | "done" | "cancelled" as const;
enum UserRole {
  CLIENT = "client",
  COOK = "cook"
}
```

---

## 4. Gestion du State

### Zustand pour l'état global
- `authStore` → Authentification
- `bookingStore` → Réservations
- `filterStore` → Filtres de recherche
- `uiStore` → État UI globale (modals, toasts, etc.)

### Hooks clairs
```typescript
// ✅ Hooks typés et clairs
const { user, login, logout } = useAuthStore();
const { bookings, addBooking, updateBooking } = useBookingStore();
```

### Règle
- ❌ Pas de logique métier dans le composant UI
- ✅ Tout via hooks

---

## 5. Mock Data

### Fichier séparé
```
mockData/
  └── index.ts        # Tous les mocks centralisés
```

### Règles
- ✅ Types TS identiques à la vraie API
- ✅ Facile à remplacer par backend réel
- ❌ Pas de mock hardcodé dans JSX

### Exemple
```typescript
// mockData/index.ts
export const mockCooks: Cook[] = [...];

// Dans le composant
const { data: cooks } = useFetchCooks(); // Remplace mockCooks facilement
```

---

## 6. Forms et Validation

### Stack : react-hook-form + Zod

### Structure
```typescript
// hooks/forms/useBookingForm.ts
export function useBookingForm() {
  const form = useForm<BookingFormInputs>({
    resolver: zodResolver(bookingSchema),
  });
  
  const onSubmit = async (data: BookingFormInputs) => {
    // Logique de soumission
  };
  
  return { form, onSubmit, errors };
}
```

### Règles
- ✅ Chaque formulaire a son hook dédié
- ✅ Validation strict TS avec Zod
- ✅ Feedback UX immédiat : erreur sous le champ, champ invalide visuel

---

## 7. API / Backend

### REST + Supabase Realtime

### Structure API Layer
```
lib/
  ├── api/
  │   ├── cooks.ts        # Endpoints cuisiniers
  │   ├── bookings.ts     # Endpoints réservations
  │   └── auth.ts         # Endpoints authentification
  └── supabase.ts         # Client Supabase
```

### Hooks API
```typescript
// hooks/api/useFetchCooks.ts
export function useFetchCooks(filters?: SearchFilters) {
  // Logique fetch + cache + error handling
}

// hooks/api/useCreateBooking.ts
export function useCreateBooking() {
  // Logique création + optimistic update
}
```

### Règles
- ✅ CRUD via REST → chaque endpoint a son hook dédié
- ✅ Temps réel via Realtime → statut réservation, notifications
- ✅ Séparer API layer : pas de fetch direct dans le composant
- ✅ URLs fichiers stockées dans DB → front charge depuis Supabase Storage

---

## 8. Clean Code & Bonnes Pratiques

### Principes
- **DRY** (Don't Repeat Yourself)
- **SOLID** (Single Responsibility, Open/Closed, etc.)
- **KISS** (Keep It Simple Stupid)

### Noms explicites
```typescript
// ✅ Bon
function calculateTotalPriceWithTax(price: number, tax: number): number

// ❌ Mauvais
function calc(p: number, t: number): number
```

### Règles
- ✅ Noms explicites : variables, fonctions, fichiers, composants
- ❌ Pas de logique imbriquée dans JSX → extraire dans hooks/utils
- ✅ Commentaires rares mais pertinents : uniquement logique métier complexe

---

## 9. Performance

### Lazy Loading
```typescript
// ✅ Composants lourds
const MapComponent = dynamic(() => import("@/components/Map"), {
  loading: () => <MapSkeleton />,
  ssr: false
});

// ✅ Images
<Image src={url} loading="lazy" alt="..." />
```

### Pagination / Infinite Scroll
- ✅ Pagination pour listes longues
- ✅ Infinite scroll pour meilleure UX

### REST Queries
- ✅ Requêtes filtrées et paginées
- ❌ Éviter overfetch

### Map / Markers
- ✅ Clustering Mapbox pour performances

### Memoization
```typescript
// ✅ React.memo pour composants lourds
export const CookCard = React.memo(({ cook }: { cook: Cook }) => {
  // ...
});

// ✅ useMemo pour calculs coûteux
const filteredCooks = useMemo(() => {
  return cooks.filter(/* ... */);
}, [cooks, filters]);
```

### Animations
- ✅ Optimisation Framer Motion pour fluidité mobile et desktop

---

## 10. UX / Design

### Stack UI
- **Tailwind CSS** + **shadcn/ui** → cohérence UI
- **Responsive design** → mobile-first

### Animations
- ✅ Discrètes et fluides pour transitions
- ✅ Feedback utilisateur immédiat : loading spinners, disabled buttons, alert messages

### Accessibilité
- ✅ Labels sur tous les inputs
- ✅ Alt sur toutes les images
- ✅ Focus states visibles
- ✅ Couleurs contrastées (WCAG)

---

## 11. Tests et Maintenance

### Testabilité
- ✅ Hooks et utilitaires testables séparément
- ✅ Chaque composant peut être testé isolément

### Documentation
- ✅ Noms cohérents → facilite recherche et refactor
- ✅ Documentation minimale dans code : props, hooks, types, endpoints REST

---

## 12. Philosophie Senior

### Production Ready
- ✅ Chaque composant = production ready dès la première version
- ✅ Pas de "je corrigerai plus tard"

### Remplaçabilité
- ✅ Mock → API réelle : transition facile
- ✅ REST → GraphQL futur : architecture flexible

### Priorités absolues
1. **Performance**
2. **Lisibilité**
3. **Typage strict**

### Mentalité
> Pense comme un architecte, pas juste un développeur : chaque décision impacte maintenance et scalabilité.

---

## 📋 Checklist Avant de Coder un Composant

- [ ] 1 responsabilité unique ?
- [ ] Typage strict (pas de `any`) ?
- [ ] <200 lignes ?
- [ ] Logique métier dans un hook séparé ?
- [ ] Noms explicites et clairs ?
- [ ] Code réutilisable (DRY) ?
- [ ] Performance optimisée (lazy load, memoization si nécessaire) ?
- [ ] Accessibilité (labels, alt, focus) ?
- [ ] Production ready dès maintenant ?

---

## 🎯 Exemple de Structure Complète

```
Front-End/
├── app/                    # Pages Next.js
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── cooks/
│   │   │   └── [id]/
│   │   └── bookings/
│   └── layout.tsx
│
├── components/
│   ├── ui/                 # shadcn/ui (Button, Input, Card, etc.)
│   ├── forms/
│   │   ├── BookingForm.tsx
│   │   └── SearchFilters.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── features/
│       ├── CookCard.tsx
│       ├── BookingCard.tsx
│       └── ReviewCard.tsx
│
├── hooks/
│   ├── api/
│   │   ├── useFetchCooks.ts
│   │   ├── useCreateBooking.ts
│   │   └── useUpdateBooking.ts
│   ├── forms/
│   │   ├── useBookingForm.ts
│   │   └── useSearchForm.ts
│   └── business/
│       ├── useGeolocation.ts
│       └── useSupabaseRealtime.ts
│
├── lib/
│   ├── api/
│   │   ├── cooks.ts
│   │   ├── bookings.ts
│   │   └── auth.ts
│   ├── utils.ts
│   └── supabase.ts
│
├── stores/                 # Zustand
│   ├── authStore.ts
│   ├── bookingStore.ts
│   └── filterStore.ts
│
├── types/
│   ├── index.ts
│   └── database.ts
│
└── mockData/
    └── index.ts
```

---

**Dernière mise à jour** : 2024-11-08  
**Version** : 1.0.0


