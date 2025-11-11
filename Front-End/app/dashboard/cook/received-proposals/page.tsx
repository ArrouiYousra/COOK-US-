"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Euro,
  MapPin,
  MessageSquare,
  Loader2,
  AlertCircle,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api/client";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

/**
 * Page "Propositions Reçues" (Flux 2)
 * Gestion des propositions directes reçues par le cuisinier
 */
export default function ReceivedProposalsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthGuard();
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "guests" | "budget">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // NE PAS AFFICHER LE CONTENU SI L'UTILISATEUR N'EST PAS AUTHENTIFIÉ
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Charger les propositions reçues
  useEffect(() => {
    const loadProposals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getReceivedProposals({ limit: 1000 });
        const loadedProposals = response.bookings || [];
        setProposals(loadedProposals);
        setStats(response.stats || { pending: 0, accepted: 0, rejected: 0 });
      } catch (err: any) {
        console.error("Erreur lors du chargement des propositions:", err);
        setError(err.response?.data?.message || "Impossible de charger les propositions");
      } finally {
        setIsLoading(false);
      }
    };

    loadProposals();
  }, []);

  // Filtrer et trier les propositions
  const filteredAndSortedProposals = useMemo(() => {
    let filtered = proposals;

    // Filtrer par statut
    if (activeTab === "pending") {
      filtered = filtered.filter((p) => p.status === "PENDING");
    } else if (activeTab === "accepted") {
      filtered = filtered.filter(
        (p) => p.status === "ACCEPTED" || p.status === "CONFIRMED",
      );
    } else if (activeTab === "rejected") {
      filtered = filtered.filter((p) => p.status === "CANCELLED");
    }

    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "guests":
          const guestsA = a.number_of_guests || 0;
          const guestsB = b.number_of_guests || 0;
          comparison = guestsA - guestsB;
          break;
        case "budget":
          const budgetA = a.total_price || 0;
          const budgetB = b.total_price || 0;
          comparison = budgetA - budgetB;
          break;
        case "date":
        default:
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [proposals, activeTab, sortBy, sortOrder]);

  const handleAccept = (proposal: any) => {
    setSelectedProposal(proposal);
    setIsAcceptDialogOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedProposal) return;

    setIsProcessing(true);
    try {
      await apiClient.acceptBooking(selectedProposal.id);
      showSuccessToast("Proposition acceptée ! La conversation a été créée automatiquement.");
      
      // Recharger les propositions
      const response = await apiClient.getReceivedProposals({ limit: 1000 });
      setProposals(response.bookings || []);
      setStats(response.stats || { pending: 0, accepted: 0, rejected: 0 });
      
      setIsAcceptDialogOpen(false);
      setSelectedProposal(null);
    } catch (error: any) {
      console.error("Erreur lors de l'acceptation:", error);
      const errorMessage = error?.response?.data?.message || "Erreur lors de l'acceptation";
      showErrorToast(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (proposal: any) => {
    setSelectedProposal(proposal);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedProposal) return;

    setIsProcessing(true);
    try {
      await apiClient.rejectBooking(selectedProposal.id);
      showSuccessToast("Proposition refusée.");
      
      // Recharger les propositions
      const response = await apiClient.getReceivedProposals({ limit: 1000 });
      setProposals(response.bookings || []);
      setStats(response.stats || { pending: 0, accepted: 0, rejected: 0 });
      
      setIsRejectDialogOpen(false);
      setSelectedProposal(null);
      setRejectionReason("");
    } catch (error: any) {
      console.error("Erreur lors du refus:", error);
      const errorMessage = error?.response?.data?.message || "Erreur lors du refus";
      showErrorToast(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "pending") {
      return {
        label: "En attente",
        color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        icon: Clock,
      };
    } else if (statusLower === "accepted" || statusLower === "confirmed") {
      return {
        label: "Acceptée",
        color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        icon: CheckCircle2,
      };
    } else if (statusLower === "cancelled") {
      return {
        label: "Refusée",
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: XCircle,
      };
    }
    return {
      label: status,
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
      icon: AlertCircle,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Propositions Reçues
          </h1>
          <p className="text-muted-foreground">
            Gérez les propositions directes que vous recevez des clients
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats.pending > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {stats.pending} proposition{stats.pending > 1 ? "s" : ""} en attente de réponse
              </p>
              <p className="text-sm text-muted-foreground">
                Les clients attendent votre réponse
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et tri */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Toutes ({proposals.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Acceptées ({stats.accepted})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Refusées ({stats.rejected})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date">Date</option>
            <option value="guests">Nombre de personnes</option>
            <option value="budget">Budget</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Liste des propositions */}
      {filteredAndSortedProposals.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {activeTab === "pending"
              ? "Aucune proposition en attente"
              : activeTab === "accepted"
              ? "Aucune proposition acceptée"
              : activeTab === "rejected"
              ? "Aucune proposition refusée"
              : "Aucune proposition reçue"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedProposals.map((proposal) => {
            const statusConfig = getStatusConfig(proposal.status);
            const StatusIcon = statusConfig.icon;
            const clientName = proposal.client
              ? `${proposal.client.firstName || ""} ${proposal.client.lastName || ""}`.trim()
              : "Client";

            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Informations principales */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-cera text-xl font-bold text-foreground">
                            Proposition de {clientName}
                          </h3>
                          <Badge
                            variant="outline"
                            className={statusConfig.color}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Reçue le {formatDate(proposal.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-semibold text-foreground">
                            {proposal.booking_date
                              ? formatDate(proposal.booking_date)
                              : "Non spécifiée"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Personnes</p>
                          <p className="font-semibold text-foreground">
                            {proposal.number_of_guests || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="font-semibold text-foreground">
                            {proposal.total_price
                              ? `${proposal.total_price.toFixed(2)} €`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Lieu</p>
                          <p className="font-semibold text-foreground text-xs">
                            {proposal.address?.address || "Non spécifié"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {proposal.special_requests && (
                      <div className="bg-muted/50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {proposal.special_requests}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    {proposal.status === "PENDING" && (
                      <>
                        <Button
                          onClick={() => handleAccept(proposal)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Accepter
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(proposal)}
                          className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                      </>
                    )}
                    {(proposal.status === "ACCEPTED" || proposal.status === "CONFIRMED") && (
                      <Button
                        asChild
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Link href={`/dashboard/cook/bookings/${proposal.id}`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Voir les détails
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog d'acceptation */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Confirmer l'acceptation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir accepter cette proposition ? Une conversation sera créée automatiquement et vous pourrez discuter avec le client.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleConfirmAccept} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de refus */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Refuser la proposition
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir refuser cette proposition ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Label htmlFor="rejectionReason">Raison du refus (optionnel)</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez pourquoi vous refusez cette proposition..."
              rows={3}
              className="mt-2"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleConfirmReject} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Refuser
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

