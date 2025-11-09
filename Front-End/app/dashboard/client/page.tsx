"use client";

import { WelcomeMessage } from "@/components/dashboard/WelcomeMessage";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { PopularCooks } from "@/components/dashboard/PopularCooks";

/**
 * Page Dashboard (Accueil)
 * Vue synthétique des activités récentes
 */
export default function ClientDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Message de bienvenue et CTA */}
      <WelcomeMessage />

      {/* Statistiques rapides */}
      <StatsCards />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Dernières activités */}
        <RecentActivities />

        {/* Cuisiniers populaires */}
        <PopularCooks />
      </div>
    </div>
  );
}

