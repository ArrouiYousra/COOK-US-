"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Euro,
  Users,
  MapPin,
  ArrowLeft,
  Download,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Hourglass,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { BookingMessages } from "@/components/dashboard/bookings/BookingMessages";
import { PaymentSection } from "@/components/dashboard/bookings/PaymentSection";
import { InvoiceExport } from "@/components/dashboard/bookings/InvoiceExport";

/**
 * Page de détails d'une réservation
 * Affiche toutes les informations, facture, messages et paiement
 */
export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<any>(null);
  const [cook, setCook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la réservation
  useEffect(() => {
    const loadBooking = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Charger toutes les réservations pour trouver celle-ci
        const bookingsData = await apiClient.getBookings({ limit: 1000 });
        const foundBooking = bookingsData.bookings.find((b: any) => b.id === bookingId);

        if (!foundBooking) {
          setError("Réservation introuvable");
          setIsLoading(false);
          return;
        }

        setBooking(foundBooking);

        // Charger les infos du cuisinier
        const cookId = foundBooking.cookId;
        if (cookId) {
          try {
            const cookProfiles = await apiClient.getCookProfiles({ limit: 1000 });
            const cookProfile = cookProfiles.profiles.find(
              (p: any) => p.id === cookId || p.user?.id === cookId
            );
            if (cookProfile?.user) {
              setCook({
                id: cookProfile.user.id,
                name: cookProfile.user.first_name && cookProfile.user.last_name
                  ? `${cookProfile.user.first_name} ${cookProfile.user.last_name}`
                  : cookProfile.user.first_name || "Cuisinier",
                avatarUrl: cookProfile.user.avatar_url,
                rating: cookProfile.average_rating,
                reviewCount: cookProfile.review_count || 0,
              });
            }
          } catch (err) {
            console.warn("Impossible de charger le profil du cuisinier:", err);
          }
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement de la réservation:", err);
        setError(err.response?.data?.message || "Impossible de charger la réservation");
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error || "Réservation introuvable"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/client/bookings">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Informations du cuisinier introuvables</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/client/bookings">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  // Mapper le statut
  let mappedStatus = booking.status;
  if (booking.status === "proposition_pending" || booking.status === "payment_pending" || booking.status === "pending") {
    mappedStatus = "pending";
  } else if (booking.status === "confirmed" || booking.status === "proposition_accepted") {
    mappedStatus = "confirmed";
  } else if (booking.status === "done") {
    mappedStatus = "done";
  } else if (booking.status === "cancelled") {
    mappedStatus = "cancelled";
  }

  const statusConfig = {
    pending: {
      label: "En attente",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      icon: Hourglass,
    },
    confirmed: {
      label: "Confirmée",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      icon: CheckCircle,
    },
    done: {
      label: "Terminée",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Annulée",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      icon: XCircle,
    },
  };

  const config = statusConfig[mappedStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Formater l'heure
  const timeSlot = booking.time
    ? booking.time.includes(":")
      ? booking.time
      : `${booking.time}h`
    : "Non spécifié";

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${config.color}`}
        >
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </span>
      </div>

      {/* Informations principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Photo et infos du chef */}
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
              {cook.avatarUrl ? (
                <Image
                  src={cook.avatarUrl}
                  alt={cook.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-3xl">👨‍🍳</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="font-cera text-2xl font-bold text-foreground mb-2">
                {cook.name}
              </h2>
              {cook.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-yellow-600 dark:text-yellow-400">⭐</span>
                  <span className="font-semibold text-foreground">
                    {cook.rating.toFixed(1)}
                  </span>
                  {cook.reviewCount !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      ({cook.reviewCount} avis)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Détails du repas */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground">
                  {formatDate(booking.date || booking.booking_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Heure</p>
                <p className="font-semibold text-foreground">{timeSlot}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre de personnes</p>
                <p className="font-semibold text-foreground">
                  {booking.numberOfGuests || booking.number_of_guests || 1} personne{(booking.numberOfGuests || booking.number_of_guests || 1) > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Euro className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="font-semibold text-foreground text-lg">
                  {booking.totalPrice || booking.total_price || 0} €
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Demandes spéciales */}
        {(booking.specialRequests || booking.special_requests) && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Demandes spéciales</p>
            <p className="text-foreground">{booking.specialRequests || booking.special_requests}</p>
          </div>
        )}
      </motion.div>

      {/* Facture / Reçu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-cera text-xl font-bold text-foreground">
            Facture / Reçu
          </h3>
          <InvoiceExport
            booking={{
              id: booking.id,
              date: booking.date || booking.booking_date,
              time: timeSlot,
              numberOfGuests: booking.numberOfGuests || booking.number_of_guests || 1,
              totalPrice: booking.totalPrice || booking.total_price || 0,
              specialRequests: booking.specialRequests || booking.special_requests,
              cookId: cook.id,
              cookName: cook.name,
            }}
            cookAddress={cook.location || "Adresse non spécifiée"}
          />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prestation</span>
            <span className="font-semibold text-foreground">
              {booking.totalPrice || booking.total_price || 0} €
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de plateforme</span>
            <span className="text-foreground">0 €</span>
          </div>
          <div className="pt-3 border-t border-border flex justify-between font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground text-lg">{booking.totalPrice || booking.total_price || 0} €</span>
          </div>
        </div>
      </motion.div>

      {/* Messages liés */}
      <BookingMessages bookingId={bookingId} cookId={cook.id} />

      {/* Section Paiement */}
      <PaymentSection booking={{
        id: booking.id,
        status: mappedStatus,
        totalPrice: booking.totalPrice || booking.total_price || 0,
        paymentStatus: booking.paymentStatus || booking.payment_status,
        paidAt: booking.paidAt || booking.paid_at,
        partialPaymentAmount: booking.partialPaymentAmount || booking.partial_payment_amount,
        remainingAmount: booking.remainingAmount || booking.remaining_amount,
      }} />

      {/* Bouton Laisser un avis (si terminée) */}
      {mappedStatus === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Partagez votre expérience avec {cook.name}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href={`/dashboard/client/bookings/${bookingId}/review`}>
              <Star className="w-5 h-5 mr-2" />
              Laisser un avis
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
