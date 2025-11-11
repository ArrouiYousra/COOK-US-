"use client";

import { CookDashboardSidebar } from "@/components/dashboard/cook/CookDashboardSidebar";
import { CookDashboardHeader } from "@/components/dashboard/cook/CookDashboardHeader";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useBookingReminders } from "@/lib/hooks/useBookingReminders";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { Loader2 } from "lucide-react";

/**
 * Layout principal du dashboard cuisinier
 * Contient la sidebar et le header persistants
 * PROTÉGÉ : Nécessite une authentification
 */
export default function CookDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protection d'authentification au niveau du layout
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthGuard();

  // NE PAS AFFICHER LE LAYOUT SI L'UTILISATEUR N'EST PAS AUTHENTIFIÉ
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Initialiser les notifications en temps réel
  useNotifications();
  
  // Initialiser les rappels automatiques
  useBookingReminders();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <CookDashboardSidebar />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <CookDashboardHeader />

        {/* Contenu dynamique */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
}

