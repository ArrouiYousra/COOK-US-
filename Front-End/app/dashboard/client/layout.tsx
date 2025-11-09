"use client";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useBookingReminders } from "@/lib/hooks/useBookingReminders";

/**
 * Layout principal du dashboard client
 * Contient la sidebar et le header persistants
 */
export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialiser les notifications en temps réel
  useNotifications();
  
  // Initialiser les rappels automatiques
  useBookingReminders();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <DashboardHeader />

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

