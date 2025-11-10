"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestsList } from "@/components/dashboard/requests/RequestsList";
import { CreateRequestModal } from "@/components/dashboard/requests/CreateRequestModal";
import { useBookingStore } from "@/stores/bookingStore";

type RequestTab = "pending" | "confirmed" | "completed";

/**
 * Page "Mes Demandes"
 * Gestion de toutes les demandes de repas du client
 */
export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestTab>("pending");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { bookings, fetchBookings } = useBookingStore();
  const [counts, setCounts] = useState({ pending: 0, confirmed: 0, completed: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      await fetchBookings({ limit: 1000 });
    };
    loadCounts();
  }, [fetchBookings]);

  useEffect(() => {
    // Calculer les compteurs à partir des bookings
    const pendingCount = bookings.filter(
      (b) => b.status === "proposition_pending" || b.status === "payment_pending" || b.status === "pending"
    ).length;
    const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
    const completedCount = bookings.filter((b) => b.status === "done" || b.status === "completed").length;

    setCounts({ pending: pendingCount, confirmed: confirmedCount, completed: completedCount });
  }, [bookings]);

  const tabs = [
    { id: "pending" as RequestTab, label: "En attente de propositions", count: counts.pending },
    { id: "confirmed" as RequestTab, label: "Confirmées", count: counts.confirmed },
    { id: "completed" as RequestTab, label: "Terminées / Historiques", count: counts.completed },
  ];

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Mes demandes
          </h1>
          <p className="text-muted-foreground">
            Gérez toutes vos demandes de repas
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une demande
        </Button>
      </div>

      {/* Onglets */}
      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-3 font-medium text-sm transition-colors
                border-b-2 -mb-px
                ${
                  activeTab === tab.id
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`
                    ml-2 px-2 py-0.5 rounded-full text-xs
                    ${
                      activeTab === tab.id
                        ? "bg-blue-600 dark:bg-blue-400 text-white"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des demandes */}
      <RequestsList status={activeTab} />

      {/* Modal de création */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
