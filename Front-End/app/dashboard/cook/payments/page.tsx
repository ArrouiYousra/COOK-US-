"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Euro, Download, Calendar, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

type PaymentStatusFilter = "all" | "pending" | "completed" | "failed" | "cancelled";

interface Payment {
  id: string;
  bookingId: string | null;
  clientName: string;
  amount: number;
  status: string;
  type: string;
  date: string;
  createdAt: string;
  description?: string;
}

/**
 * Page "Paiements"
 * Gestion des paiements et transactions
 */
export default function CookPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Charger les transactions depuis l'API
  useEffect(() => {
    const loadPayments = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Charger les transactions et les réservations en parallèle
        const [transactionsResponse, bookingsResponse] = await Promise.allSettled([
          apiClient.getMyTransactions(),
          apiClient.getBookings({ limit: 1000 }),
        ]);

        const transactions = transactionsResponse.status === "fulfilled" 
          ? transactionsResponse.value.transactions 
          : [];
        const bookings = bookingsResponse.status === "fulfilled"
          ? bookingsResponse.value.bookings
          : [];

        // Créer un map des réservations par ID pour accès rapide
        const bookingsMap = new Map(bookings.map((b: any) => [b.id, b]));

        // Transformer les transactions en paiements
        // Pour un cuisinier, on affiche seulement les transactions où il est le destinataire (to_user_id)
        // ou les transactions où il est l'expéditeur (from_user_id) pour les REFUND
        const transformedPayments: Payment[] = transactions
          .filter((transaction: any) => {
            // Exclure les transactions où le cuisinier est l'expéditeur (sauf REFUND)
            if (transaction.from_user_id === user.id && transaction.type !== "REFUND") {
              return false;
            }
            
            // Inclure les transactions où le cuisinier est le destinataire
            if (transaction.to_user_id === user.id) {
              // Exclure les PLATFORM_FEE où le cuisinier est le destinataire (ce sont des débits)
              if (transaction.type === "PLATFORM_FEE") {
                return false;
              }
              return true;
            }
            
            // Inclure les REFUND où le cuisinier est l'expéditeur
            if (transaction.from_user_id === user.id && transaction.type === "REFUND") {
              return true;
            }
            
            return false;
          })
          .map((transaction: any) => {
            const booking = transaction.booking_id ? bookingsMap.get(transaction.booking_id) : null;
            const clientName = booking?.client?.first_name && booking?.client?.last_name
              ? `${booking.client.first_name} ${booking.client.last_name}`
              : booking?.client?.first_name || "Client";

            // Déterminer le statut pour l'affichage
            let displayStatus = transaction.status.toLowerCase();
            if (transaction.type === "REFUND") {
              displayStatus = "refunded";
            } else if (transaction.status === "COMPLETED") {
              displayStatus = "paid";
            } else if (transaction.status === "PENDING") {
              displayStatus = "pending";
            }

            // Pour les REFUND où le cuisinier est l'expéditeur, c'est un débit (montant négatif)
            // Pour les autres, c'est un crédit (montant positif)
            const isDebit = transaction.type === "REFUND" && transaction.from_user_id === user.id;
            const amount = isDebit 
              ? -(transaction.amount / 100) // Débit (négatif)
              : transaction.amount / 100;   // Crédit (positif)

            return {
              id: transaction.id,
              bookingId: transaction.booking_id,
              clientName,
              amount,
              status: displayStatus,
              type: transaction.type,
              date: booking?.date || transaction.created_at,
              createdAt: transaction.created_at,
              description: transaction.description,
            };
          });

        // Trier par date (plus récent en premier)
        transformedPayments.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPayments(transformedPayments);
      } catch (err: any) {
        console.error("Erreur lors du chargement des paiements:", err);
        setError(err.response?.data?.message || "Impossible de charger les paiements");
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, [user?.id]);

  const filteredPayments = payments.filter((payment) => {
    // Filtrer par statut
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && payment.status !== "pending") return false;
      if (statusFilter === "completed" && payment.status !== "paid") return false;
      if (statusFilter === "failed" && payment.status !== "failed") return false;
      if (statusFilter === "cancelled" && payment.status !== "cancelled") return false;
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !payment.clientName.toLowerCase().includes(query) &&
        !payment.bookingId?.toLowerCase().includes(query) &&
        !payment.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    return true;
  });

  // Calculer les revenus totaux (seulement les crédits payés)
  const totalRevenue = payments
    .filter((p) => p.status === "paid" && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculer le montant en attente (seulement les crédits en attente)
  const pendingAmount = payments
    .filter((p) => p.status === "pending" && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);

  const handleDownloadInvoice = async (paymentId: string) => {
    // TODO: Implémenter le téléchargement de facture
    console.log("Télécharger la facture pour:", paymentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Paiements
        </h1>
        <p className="text-muted-foreground">
          Gérez vos revenus et vos transactions
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenus totaux</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : `${totalRevenue.toFixed(2)} €`}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center">
              <Euro className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : `${pendingAmount.toFixed(2)} €`}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : payments.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un paiement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: "all" as PaymentStatusFilter, label: "Tous" },
              { id: "pending" as PaymentStatusFilter, label: "En attente" },
              { id: "completed" as PaymentStatusFilter, label: "Payés" },
              { id: "failed" as PaymentStatusFilter, label: "Échoués" },
              { id: "cancelled" as PaymentStatusFilter, label: "Annulés" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    statusFilter === filter.id
                      ? "bg-blue-600 text-white"
                      : "bg-accent text-foreground hover:bg-accent/80"
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des paiements */}
      {isLoading ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des paiements...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-destructive">{error}</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">Aucun paiement trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment, index) => (
            <PaymentCard 
              key={payment.id} 
              payment={payment} 
              index={index}
              onDownload={() => handleDownloadInvoice(payment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PaymentCardProps {
  payment: Payment;
  index: number;
  onDownload: () => void;
}

function PaymentCard({ payment, index, onDownload }: PaymentCardProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: {
      label: "En attente",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    },
    paid: {
      label: "Payé",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    completed: {
      label: "Complété",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    refunded: {
      label: "Remboursé",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    failed: {
      label: "Échoué",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    cancelled: {
      label: "Annulé",
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    },
  };

  const config = statusConfig[payment.status] || statusConfig.pending;

  // Déterminer le type de transaction pour l'affichage
  const typeLabels: Record<string, string> = {
    BOOKING_PAYMENT: "Paiement réservation",
    PAYOUT: "Virement",
    REFUND: "Remboursement",
    BONUS: "Bonus",
    PLATFORM_FEE: "Frais plateforme",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-cera text-lg font-bold text-foreground">
              {payment.clientName}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
            >
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {payment.bookingId && (
              <>
                <span>Réservation #{payment.bookingId.slice(0, 8)}</span>
                <span>•</span>
              </>
            )}
            <span>{typeLabels[payment.type] || payment.type}</span>
            <span>•</span>
            <span>{formatDate(payment.date)}</span>
            {payment.description && (
              <>
                <span>•</span>
                <span className="truncate max-w-xs">{payment.description}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              payment.amount < 0 
                ? "text-red-600 dark:text-red-400" 
                : "text-foreground"
            }`}>
              {payment.amount >= 0 ? "+" : ""}{payment.amount.toFixed(2)} €
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(payment.createdAt)}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
