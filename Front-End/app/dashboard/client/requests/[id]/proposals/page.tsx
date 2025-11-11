"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationsList } from "@/components/dashboard/reservations/ReservationsList";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import type { Reservation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Page pour afficher et gérer les propositions reçues pour une demande publique
 * Côté client
 */
export default function RequestProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const bookingId = params.id as string;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error) {
          router.push("/auth/login");
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger les propositions
  useEffect(() => {
    const loadData = async () => {
      if (isAuthLoading || !isAuthenticated || !user || !bookingId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Charger le booking
        const bookingResponse = await apiClient.getBookingById(bookingId);
        setBooking(bookingResponse.booking);

        // Charger les propositions
        const response = await apiClient.getReservationsByBookingId(bookingId);
        setReservations(response.reservations || []);
        setStats(response.stats || null);
      } catch (err: any) {
        console.error("Erreur lors du chargement des propositions:", err);
        setError(err.response?.data?.message || "Impossible de charger les propositions");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user && bookingId) {
      loadData();
    }
  }, [isAuthLoading, isAuthenticated, user, bookingId]);

  const handleAccept = async (reservationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir accepter cette proposition ? Les autres propositions seront automatiquement refusées.")) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiClient.acceptReservation(reservationId);
      alert(`Proposition acceptée ! Acompte à payer : ${response.depositAmount.toFixed(2)}€ (30%)`);
      
      // Recharger les données
      const reservationsResponse = await apiClient.getReservationsByBookingId(bookingId);
      setReservations(reservationsResponse.reservations || []);
      setStats(reservationsResponse.stats || null);
      
      // Rediriger vers la page de paiement ou de détails du booking
      router.push(`/dashboard/client/bookings/${bookingId}`);
    } catch (err: any) {
      console.error("Erreur lors de l'acceptation:", err);
      alert(err.response?.data?.message || "Erreur lors de l'acceptation de la proposition");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedReservationId) return;

    setIsProcessing(true);
    try {
      await apiClient.rejectReservation(selectedReservationId, rejectionReason || undefined);
      setIsRejectDialogOpen(false);
      setSelectedReservationId(null);
      setRejectionReason("");
      
      // Recharger les données
      const response = await apiClient.getReservationsByBookingId(bookingId);
      setReservations(response.reservations || []);
      setStats(response.stats || null);
    } catch (err: any) {
      console.error("Erreur lors du refus:", err);
      alert(err.response?.data?.message || "Erreur lors du refus de la proposition");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Propositions reçues
          </h1>
          <p className="text-muted-foreground">
            {booking && booking.booking_date && (
              <>Demande du {new Date(booking.booking_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="bg-yellow-500/10 border-yellow-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </div>
          <div className="bg-green-500/10 border-green-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</p>
            <p className="text-sm text-muted-foreground">Acceptées</p>
          </div>
          <div className="bg-red-500/10 border-red-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">Refusées</p>
          </div>
          <div className="bg-gray-500/10 border-gray-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.expired}</p>
            <p className="text-sm text-muted-foreground">Expirées</p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Liste des propositions */}
      <ReservationsList
        reservations={reservations}
        isLoading={isLoading}
        onAccept={handleAccept}
        onReject={handleReject}
        showActions={true}
      />

      {/* Dialog de refus */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la proposition</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de refuser cette proposition. Vous pouvez ajouter une raison (optionnel).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="rejectionReason">Raison du refus (optionnel)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Le prix ne correspond pas à mon budget..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleConfirmReject} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirmer le refus
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


