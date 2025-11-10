"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Euro, Download, Calendar, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { mockBookings } from "@/mockData";

type PaymentStatusFilter = "all" | "pending" | "paid" | "refunded";

/**
 * Page "Paiements"
 * Gestion des paiements et transactions
 */
export default function CookPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Simuler les paiements à partir des réservations
  const payments = mockBookings.map((booking) => ({
    id: booking.id,
    bookingId: booking.id,
    clientName: booking.clientName || "Client",
    amount: booking.totalPrice,
    status: booking.status === "done" ? "paid" : booking.status === "cancelled" ? "refunded" : "pending",
    date: booking.date,
    createdAt: booking.createdAt || new Date().toISOString(),
  }));

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    if (searchQuery && !payment.clientName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

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
              <p className="text-2xl font-bold text-foreground">{totalRevenue} €</p>
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
              <p className="text-2xl font-bold text-foreground">{pendingAmount} €</p>
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
              <p className="text-2xl font-bold text-foreground">{payments.length}</p>
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
              { id: "paid" as PaymentStatusFilter, label: "Payés" },
              { id: "refunded" as PaymentStatusFilter, label: "Remboursés" },
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
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">Aucun paiement trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment, index) => (
            <PaymentCard key={payment.id} payment={payment} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

interface PaymentCardProps {
  payment: {
    id: string;
    bookingId: string;
    clientName: string;
    amount: number;
    status: string;
    date: string;
    createdAt: string;
  };
  index: number;
}

function PaymentCard({ payment, index }: PaymentCardProps) {
  const statusConfig = {
    pending: {
      label: "En attente",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    },
    paid: {
      label: "Payé",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    refunded: {
      label: "Remboursé",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
  };

  const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;

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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Réservation #{payment.bookingId.slice(0, 8)}</span>
            <span>•</span>
            <span>{formatDate(payment.date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{payment.amount} €</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(payment.createdAt)}
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

