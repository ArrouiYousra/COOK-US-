"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Euro,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Hourglass,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
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
 * Page de détails d'une réservation
 */
export default function CookBookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error) {
          console.warn("Authentification échouée, redirection vers la page de connexion");
          router.push("/auth/login");
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger la réservation
  useEffect(() => {
    const loadBooking = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user || !bookingId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getBookingById(bookingId);
        setBooking(response.booking);
      } catch (err: any) {
        console.error("Erreur lors du chargement de la réservation:", err);
        if (err.response?.status === 404) {
          setError("Réservation introuvable");
        } else {
          setError(err.response?.data?.message || "Impossible de charger la réservation");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user && bookingId) {
      loadBooking();
    }
  }, [isAuthenticated, user, isAuthLoading, bookingId]);

  const handleAccept = () => {
    setActionType("accept");
    setIsActionDialogOpen(true);
  };

  const handleReject = () => {
    setActionType("reject");
    setRejectionMessage("");
    setIsActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!booking || !actionType) return;

    setIsProcessing(true);

    try {
      if (actionType === "accept") {
        await apiClient.acceptBooking(booking.id);
        setSuccessMessage("La réservation a été acceptée avec succès.");
      } else if (actionType === "reject") {
        await apiClient.rejectBooking(booking.id);
        setSuccessMessage("La réservation a été rejetée.");
      }

      // Recharger la réservation
      const response = await apiClient.getBookingById(booking.id);
      setBooking(response.booking);

      setIsActionDialogOpen(false);
      setActionType(null);
      setRejectionMessage("");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur lors de l'action:", err);
      setError(err.response?.data?.message || "Une erreur est survenue");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "En attente",
          color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
          icon: Hourglass,
        };
      case "ACCEPTED":
      case "CONFIRMED":
        return {
          label: "Confirmée",
          color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
          icon: CheckCircle,
        };
      case "COMPLETED":
        return {
          label: "Terminée",
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          icon: CheckCircle,
        };
      case "CANCELLED":
        return {
          label: "Annulée",
          color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
          icon: XCircle,
        };
      case "IN_PROGRESS":
        return {
          label: "En cours",
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          icon: Hourglass,
        };
      default:
        return {
          label: "Inconnu",
          color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
          icon: Hourglass,
        };
    }
  };

  // Afficher un loader pendant le chargement
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de la réservation...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur si nécessaire
  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/cook/bookings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-destructive">{error || "Réservation introuvable"}</p>
            <Button onClick={() => router.push("/dashboard/cook/bookings")} variant="outline">
              Retour aux réservations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const config = getStatusConfig(booking.status);
  const StatusIcon = config.icon;

  const clientName =
    booking.client?.first_name && booking.client?.last_name
      ? `${booking.client.first_name} ${booking.client.last_name}`
      : booking.client?.email || "Client inconnu";

  const mealTypeLabels: Record<string, string> = {
    BREAKFAST: "Petit-déjeuner",
    LUNCH: "Déjeuner",
    DINNER: "Dîner",
    BRUNCH: "Brunch",
  };

  const mealType = mealTypeLabels[booking.meal_type] || booking.meal_type || "Non spécifié";

  return (
    <div className="space-y-6">
      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cook/bookings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Réservation #{booking.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">Détails de la réservation</p>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${config.color}`}
        >
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails du repas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="font-cera text-xl font-bold text-foreground mb-4">Détails du repas</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold text-foreground">
                      {booking.booking_date
                        ? format(new Date(booking.booking_date), "d MMMM yyyy", { locale: fr })
                        : "Non spécifiée"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Heure</p>
                    <p className="font-semibold text-foreground">
                      {booking.start_time
                        ? `${booking.start_time.slice(0, 5)}${booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ""}`
                        : mealType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre d'invités</p>
                    <p className="font-semibold text-foreground">
                      {booking.number_of_guests || "N/A"} personne{booking.number_of_guests > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                    <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant total</p>
                    <p className="font-semibold text-foreground">
                      {booking.total_price ? `${booking.total_price.toFixed(2)} €` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              {booking.address && (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-semibold text-foreground">{booking.address}</p>
                  </div>
                </div>
              )}
              {booking.special_requests && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Demandes spéciales</p>
                  <p className="text-foreground">{booking.special_requests}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Informations client */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="font-cera text-xl font-bold text-foreground mb-4">
              Informations client
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-semibold text-foreground">{clientName}</p>
                </div>
              </div>
              {booking.client?.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold text-foreground">{booking.client.email}</p>
                  </div>
                </div>
              )}
              {booking.client?.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-semibold text-foreground">{booking.client.phone}</p>
                  </div>
                </div>
              )}
            </div>
            {booking.client?.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/cook/messages?conversation=${booking.client.id}`}>
                    Contacter le client
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="font-cera text-lg font-bold text-foreground mb-4">Actions</h2>
            <div className="space-y-3">
              {booking.status === "PENDING" && (
                <>
                  <Button
                    onClick={handleAccept}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accepter la réservation
                  </Button>
                  <Button onClick={handleReject} variant="outline" className="w-full">
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </>
              )}
              {["ACCEPTED", "CONFIRMED"].includes(booking.status) && (
                <Button variant="outline" className="w-full" disabled>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Réservation confirmée
                </Button>
              )}
              {booking.status === "COMPLETED" && (
                <Button variant="outline" className="w-full" disabled>
                  Réservation terminée
                </Button>
              )}
            </div>
          </motion.div>

          {/* Informations de paiement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="font-cera text-lg font-bold text-foreground mb-4">Paiement</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Montant total</span>
                <span className="font-semibold text-foreground">
                  {booking.total_price ? `${booking.total_price.toFixed(2)} €` : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.payment_status === "PAID" || booking.payment_status === "COMPLETED"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : booking.payment_status === "PENDING"
                      ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {booking.payment_status === "PAID" || booking.payment_status === "COMPLETED"
                    ? "Payé"
                    : booking.payment_status === "PENDING"
                    ? "En attente"
                    : booking.payment_status || "N/A"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dialog de confirmation d'action */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" ? "Accepter la réservation" : "Rejeter la réservation"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept"
                ? "Êtes-vous sûr de vouloir accepter cette réservation ?"
                : "Voulez-vous rejeter cette réservation ? Vous pouvez ajouter un message optionnel."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionMessage">Message (optionnel)</Label>
                <Textarea
                  id="rejectionMessage"
                  placeholder="Expliquez pourquoi vous rejetez cette réservation..."
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                setActionType(null);
                setRejectionMessage("");
              }}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={`flex-1 ${
                actionType === "accept"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : actionType === "accept" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accepter
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
