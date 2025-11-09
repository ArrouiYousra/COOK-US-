# COOK US - Front-End

Plateforme de cuisine à domicile entre particuliers - Application Next.js 15

## 🚀 Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Langage**: TypeScript (strict mode)
- **State Management**: Zustand
- **UI/Styling**: Tailwind CSS + shadcn/ui
- **Forms/Validation**: react-hook-form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide-react
- **Maps/Geoloc**: Mapbox
- **Backend**: Supabase (REST + Realtime)
- **Storage**: Supabase Storage

## 📁 Structure du Projet

```
Front-End/
├── app/                    # Pages Next.js (App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # Composants React
│   └── ui/                # Composants shadcn/ui
├── hooks/                 # Hooks personnalisés
│   ├── useGeolocation.ts
│   └── useSupabaseRealtime.ts
├── lib/                    # Utilitaires et configurations
│   ├── utils.ts           # Fonctions utilitaires (cn, formatPrice, etc.)
│   └── supabase.ts        # Client Supabase
├── stores/                 # Stores Zustand
│   ├── authStore.ts       # Gestion de l'authentification
│   ├── bookingStore.ts    # Gestion des réservations
│   └── filterStore.ts     # Gestion des filtres de recherche
├── types/                  # Types TypeScript
│   ├── index.ts           # Types principaux (User, Cook, Booking, etc.)
│   └── database.ts        # Types Supabase (à générer)
├── mockData/              # Données de test
│   └── index.ts
└── public/                # Assets statiques
```

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Démarrer le serveur de production
npm start
```

## ⚙️ Configuration

### Variables d'environnement

Créer un fichier `.env.local` à partir de `.env.local.example` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

### shadcn/ui

Le projet est configuré pour utiliser shadcn/ui. Pour ajouter de nouveaux composants :

```bash
npx shadcn@latest add [component-name]
```

## 📝 Types Principaux

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
}
```

### Cook
```typescript
interface Cook extends User {
  siret?: string;
  bio: string;
  dishes: Dish[];
  rating: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    zipCode: string;
  };
  specialties: string[];
  pricePerPerson: number;
  maxGuests: number;
}
```

### Booking
```typescript
interface Booking {
  id: string;
  cookId: string;
  userId: string;
  date: string;
  time: string;
  numberOfGuests: number;
  status: "pending" | "confirmed" | "done" | "cancelled";
  totalPrice: number;
}
```

## 🎯 Bonnes Pratiques & Architecture

> **📖 Documentation complète** : Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les principes détaillés de développement senior.

### Principes fondamentaux
- **Composants**: Maximum 200 lignes, un seul rôle par composant (SRP)
- **Typage**: TypeScript strict, **jamais de `any`**
- **State**: Zustand pour l'état global, hooks pour la logique locale
- **Forms**: react-hook-form + Zod pour tous les formulaires
- **Performance**: Lazy load des images, pagination/infinite scroll
- **Clean Code**: Respect DRY, SOLID, KISS - code modulaire et réutilisable
- **Production Ready**: Chaque composant = production ready dès la première version

### Mentalité Senior
- Chaque ligne de code a un but : pas de code inutile
- Prévoir le futur : scalabilité, modularité, réutilisabilité
- Lisibilité > tout : code clair, auto-documenté
- Pragmatisme : MVP fonctionnel d'abord, optimisation progressive ensuite

## 🔄 Intégration API

### REST (CRUD)
Utiliser le client Supabase pour les opérations CRUD :

```typescript
import { supabase } from "@/lib/supabase";

const { data, error } = await supabase
  .from("cooks")
  .select("*")
  .eq("city", "Paris");
```

### Realtime (WebSockets)
Utiliser le hook `useSupabaseRealtime` pour écouter les changements en temps réel :

```typescript
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

function MyComponent() {
  useSupabaseRealtime(); // Écoute les mises à jour des réservations
  // ...
}
```

## 📦 Mock Data

Les données de test sont disponibles dans `mockData/index.ts`. Elles peuvent être facilement remplacées par les appels API réels.

## 🚧 Prochaines Étapes

1. Configurer Supabase (base de données, storage, auth)
2. Générer les types Supabase : `npx supabase gen types typescript`
3. Implémenter les pages principales (accueil, profil, réservation)
4. Intégrer Mapbox pour la géolocalisation
5. Configurer l'authentification Supabase
6. Implémenter l'upload de fichiers vers Supabase Storage
