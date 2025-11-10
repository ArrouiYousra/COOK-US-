"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Users, Euro, MapPin, User, Phone, Mail, CheckCircle, XCircle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { mockBookings } from "@/mockData";
import { useParams } from "next/navigation";

/**
 * Page de détails d'une réservation
 */
export default function CookBookingDetailsPage() {
  const params = useParams();
  const bookingId = params.id as string;
  
  // TODO: Récupérer la réservation depuis l'API
  const booking = mockBookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/cook/bookings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Réservation introuvable</p>
        </div>
      </div>
    );
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

  const config = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
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
            <p className="text-muted-foreground">
              Détails de la réservation
            </p>
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
            <h2 className="font-cera text-xl font-bold text-foreground mb-4">
              Détails du repas
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold text-foreground">{formatDate(booking.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Heure</p>
                    <p className="font-semibold text-foreground">{booking.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre d'invités</p>
                    <p className="font-semibold text-foreground">
                      {booking.numberOfGuests} personne{booking.numberOfGuests > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                    <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant total</p>
                    <p className="font-semibold text-foreground">{booking.totalPrice} €</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-semibold text-foreground">{booking.address || "Adresse non spécifiée"}</p>
                </div>
              </div>
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
                  <p className="font-semibold text-foreground">{booking.clientName || "Client"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground">{booking.userId}@example.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-semibold text-foreground">+33 6 XX XX XX XX</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/cook/messages?conversation=${booking.userId}`}>
                  Contacter le client
                </Link>
              </Button>
            </div>
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
            <h2 className="font-cera text-lg font-bold text-foreground mb-4">
              Actions
            </h2>
            <div className="space-y-3">
              {booking.status === "pending" && (
                <>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer la réservation
                  </Button>
                  <Button variant="outline" className="w-full">
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                </>
              )}
              {booking.status === "confirmed" && (
                <Button variant="outline" className="w-full">
                  Voir les détails de paiement
                </Button>
              )}
              {booking.status === "done" && (
                <Button variant="outline" className="w-full">
                  Laisser un avis
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
            <h2 className="font-cera text-lg font-bold text-foreground mb-4">
              Paiement
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Montant total</span>
                <span className="font-semibold text-foreground">{booking.totalPrice} €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                  Payé
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

