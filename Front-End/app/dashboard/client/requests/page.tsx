"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestsList } from "@/components/dashboard/requests/RequestsList";
import { CreateRequestModal } from "@/components/dashboard/requests/CreateRequestModal";
import { useBookingStore } from "@/stores/bookingStore";

type RequestTab = "pending" | "confirmed" | "completed";

function RequestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<RequestTab>("pending");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { bookings, fetchBookings } = useBookingStore();
  const [counts, setCounts] = useState({ pending: 0, confirmed: 0, completed: 0 });

  // Recharger les données au montage et quand le paramètre refresh est présent
  useEffect(() => {
    const loadData = async () => {
      console.log("[RequestsPage] Chargement des bookings...");
      // IMPORTANT: Réinitialiser le filtre de statut pour obtenir TOUS les bookings
      // Sinon le filtre persistant (ex: status: 'CONFIRMED') exclut les demandes PENDING
      await fetchBookings({ limit: 1000, status: undefined });
      console.log("[RequestsPage] Bookings chargés:", bookings.length);
      
      // Si on vient d'une redirection avec refresh, retirer le paramètre
      if (searchParams.get("refresh") === "true") {
        router.replace("/dashboard/client/requests", { scroll: false });
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, fetchBookings]);

  useEffect(() => {
    console.log("[RequestsPage] Calcul des compteurs, bookings:", bookings.length);
    // Calculer les compteurs à partir des bookings
    // IMPORTANT: Pour "Mes demandes", on veut UNIQUEMENT les demandes publiques (sans cuisinier assigné)
    const pendingCount = bookings.filter(
      (b) => {
        const statusValue = b.status || "";
        const statusLower = statusValue.toLowerCase();
        
        // Vérifier si c'est une demande publique (sans cuisinier assigné)
        // Essayer plusieurs façons de récupérer cook_profile_id
        const cookProfileId = 
          (b as any).cook_profile_id !== undefined ? (b as any).cook_profile_id :
          b.cookId !== undefined ? b.cookId :
          null;
        const hasNoCook = 
          cookProfileId === null || 
          cookProfileId === undefined || 
          cookProfileId === "" ||
          String(cookProfileId).trim() === "";
        
        // Inclure uniquement les demandes publiques avec statut pending
        const isPending = (
          (statusLower === "proposition_pending" || 
          statusLower === "payment_pending" || 
          statusLower === "pending") &&
          hasNoCook
        );
        
        if (isPending) {
          console.log("[RequestsPage] Demande publique pending trouvée:", { id: b.id, status: b.status, cook_profile_id: cookProfileId });
        }
        
        return isPending;
      }
    ).length;
    
    const confirmedCount = bookings.filter((b) => {
      const statusLower = (b.status || "").toLowerCase();
      return statusLower === "confirmed" || b.status === "proposition_accepted";
    }).length;
    
    const completedCount = bookings.filter((b) => {
      const statusLower = (b.status || "").toLowerCase();
      return statusLower === "done";
    }).length;

    console.log("[RequestsPage] Compteurs calculés - pending:", pendingCount, "confirmed:", confirmedCount, "completed:", completedCount);
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

      {/* Statistiques rapides */}
      {counts.pending > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {counts.pending} demande{counts.pending > 1 ? "s" : ""} en attente de propositions
              </p>
              <p className="text-sm text-muted-foreground">
                Les cuisiniers peuvent maintenant voir et proposer leurs services
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-3 font-medium text-sm transition-colors
                border-b-2 -mb-px flex items-center gap-2
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
                    px-2 py-0.5 rounded-full text-xs font-semibold
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
        onClose={async () => {
          setIsCreateModalOpen(false);
          // Recharger les bookings après création
          await fetchBookings({ limit: 1000 });
        }}
      />
    </div>
  );
}

/**
 * Page "Mes Demandes"
 * Gestion de toutes les demandes de repas du client
 */
export default function RequestsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    }>
      <RequestsPageContent />
    </Suspense>
  );
}
