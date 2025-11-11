## Espace Administrateur – Vision & Périmètre

### Objectifs produit
- Offrir une vue centralisée sur la santé de la plateforme : croissance utilisateurs, activité des réservations, revenus, charges opérationnelles.
- Accélérer les décisions opérationnelles (validation des profils cuisiniers, résolution des litiges, suivi qualité).
- Garantir la conformité et la sécurité (suivi KYC/KYB, monitoring des paiements, alertes anomalies).

### Personas & besoins
- **Ops / Customer Success** : monitorer les demandes clientes, les litiges, prioriser les actions quotidiennes.
- **Responsable qualité** : valider les cuisiniers, vérifier les documents, suivre les scores de satisfaction.
- **Direction produit** : suivre KPIs business (GMV, conversion, rétention) et activité temps réel.

---

## Modules fonctionnels

1. **Tableau de bord global**
   - Cartes KPI animées (GMV, réservations confirmées, nouveaux utilisateurs, taux d’activation).
   - Graphique temporel (courbe combinée : réservations vs revenus – 30 derniers jours).
   - Graphique en anneau (répartition des statuts de réservations).
   - Indicateurs d’alertes (litiges ouverts, profils en attente de validation).

2. **Gestion des utilisateurs**
   - Tableau interactif (filtrable par rôle, statut, date d’inscription).
   - Actions rapides : suspendre/réactiver, forcer la vérification, consulter le profil.
   - Historique des connexions et score de confiance (à terme).

3. **Monitoring des cuisiniers**
   - Liste des cuisiniers en attente de validation (documents, SIRET).
  - Vue synthétique des scores qualité (notation moyenne, réponse, taux d’acceptation).

4. **Suivi des réservations et paiements**
   - Heatmap / histogramme des réservations par heure/jour.
   - Tableau des transactions Stripe (montant, statut, commission).

5. **Activité temps réel**
   - Timeline animée alimentée par Supabase Realtime (nouvelle demande, proposition, avis).
   - Filtrage par type d’événement.

---

## APIs backend à exposer

| Endpoint | Description | Notes |
|----------|-------------|-------|
| `GET /api/admin/stats/summary` | KPIs synthétiques (utilisateurs, bookings, GMV, litiges, vérifications) | Agrégations SQL sur `users`, `cook_profiles`, `bookings`, `transactions`, `disputes`. |
| `GET /api/admin/stats/timeseries?metric=bookings&range=30d` | Séries temporelles quotidiennes/semaine | groupement par date. |
| `GET /api/admin/stats/distribution` | Répartition statuts booking / rôles utilisateurs | Pour graphiques donut/bar. |
| `GET /api/admin/users?status=ACTIVE&role=COOK` | Liste paginée filtrable | Inclure métadonnées (profil cook/client). |
| `GET /api/admin/cooks/pending` | Profils cuisiniers en attente | Vérifications docs. |
| `GET /api/admin/activity` | Activité récente (bookings, disputes, avis) | Option d’abonnement Realtime. |

### Contraintes techniques
- **Sécurité** : middleware `requireRole("ADMIN")` + logs d’accès.
- **Performance** : requêtes agrégées via Supabase RPC ou vues matérialisées (future optimisation).
- **Pagination** : paramètres `limit`, `offset`, `sort`.

---

## Front-end – Architecture

### Pages & navigation
```
app/dashboard/admin/
  ├── layout.tsx          # Layout protégé + sidebar admin
  ├── page.tsx            # Dashboard overview
  ├── users/page.tsx      # Gestion utilisateurs
  ├── cooks/page.tsx      # Validation cuisiniers
  ├── activity/page.tsx   # Timeline temps réel
```

### Composants clés
- `AdminSidebar`, `AdminHeader` (navigation contextuelle).
- `KpiCard` (cartes animées via Framer Motion).
- `TimeseriesChart`, `DonutChart`, `BarChart` (utilisation de `recharts` + animations).
- `AdminDataTable` (tableau with shadcn `Table` + virtualisation si besoin).
- `ActivityFeed` (timeline animée).

### Hooks / stores
- `useAdminStatsStore` : gère requêtes summary + timeseries + distribution.
- `useAdminUsersStore` : pagination, filtres, actions.
- `useRealtimeActivity` : abonnement Supabase canal admin.

### UX / Animations
- Framer Motion pour transitions, hover, micro-interactions.
- Charts : transitions animées (ex: `react-spring` intégré à `recharts` ou `framer-motion` wrappers).
- Dark mode support.

---

## Sécurité & Auth
- Layout admin applique `useAuthGuard()` + vérification du rôle (`useAuthStore.user.role === "ADMIN"`), sinon redirection.
- Appels API centralisés via `apiClient` avec headers `Authorization`.
- Gestion des erreurs (toast `sonner`, rechargement silencieux).

---

## Roadmap d’implémentation
1. **Backend**
   - Créer module `domain/admin` + routes.
   - Middleware `requireRole("ADMIN")`.
   - Implémenter endpoints summary + timeseries + distribution + users minimal.
2. **Frontend**
   - Ajouter layout + navigation admin.
   - Store stats + hook.
   - Dashboard overview avec KPI + charts animés.
3. **Gestion utilisateurs & activity feed**
   - Table filtrable + actions (MVP).
   - Timeline Realtime (optionnel V1 si temps).
4. **Tests & docs**
   - Tests unitaires `admin.controllers` (agrégations).
   - Documentation (README admin).

---

## Mesures de succès
- Temps de chargement dashboard < 1s (données caches).
- Équipe Ops dispose de KPIs fiabilisés quotidiennement.
- Process de validation cuisiniers et litiges pilotable depuis l’admin.


