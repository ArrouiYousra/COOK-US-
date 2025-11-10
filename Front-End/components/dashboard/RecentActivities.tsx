"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, CheckCircle, Clock, ChefHat, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";

interface Activity {
  id: string;
  type: "message" | "proposition" | "confirmation" | "pending" | "payment" | "reminder";
  title: string;
  description: string;
  time: Date;
  icon: typeof MessageSquare;
  color: string;
  actionUrl?: string;
}

/**
 * Bloc des dernières activités
 * Liste chronologique des actions récentes
 */
export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Éviter les rechargements multiples simultanés
    if (isLoadingRef.current) return;
    
    const loadActivities = async () => {
      isLoadingRef.current = true;
      try {
        setIsLoading(true);

        // Charger toutes les données en parallèle pour améliorer les performances
        // On charge directement depuis l'API sans passer par le store pour éviter les rechargements
        const [notificationsResult, proposalsResult, bookingsResult] = await Promise.allSettled([
          apiClient.getNotifications({
            limit: 10,
            offset: 0,
          }),
          apiClient.getMyProposals({ filter: "pending", limit: 5 }),
          apiClient.getBookings({ limit: 5 }),
        ]);

        // Extraire les résultats et fournir des valeurs par défaut en cas d'erreur
        const notificationsData = notificationsResult.status === "fulfilled"
          ? notificationsResult.value
          : { notifications: [], count: 0, unread_count: 0, limit: 10, offset: 0 };

        const proposalsData = proposalsResult.status === "fulfilled"
          ? proposalsResult.value
          : { bookings: [], count: 0, stats: { pending: 0, accepted: 0, rejected: 0 } };

        const bookingsData = bookingsResult.status === "fulfilled"
          ? bookingsResult.value
          : { bookings: [], count: 0 };

        // Transformer les données en activités
        const activitiesList: Activity[] = [];

        // 1. Notifications récentes
        const notificationsList = Array.isArray(notificationsData?.notifications)
          ? notificationsData.notifications
          : [];

        notificationsList.slice(0, 5).forEach((notification) => {
          let type: Activity["type"] = "confirmation";
          let icon = CheckCircle;
          let color = "text-green-600 dark:text-green-400";

          switch (notification.type) {
            case "MESSAGE_RECEIVED":
              type = "message";
              icon = MessageSquare;
              color = "text-blue-600 dark:text-blue-400";
              break;
            case "BOOKING_REQUEST":
              type = "proposition";
              icon = ChefHat;
              color = "text-purple-600 dark:text-purple-400";
              break;
            case "BOOKING_CONFIRMED":
            case "PAYMENT_RECEIVED":
              type = "confirmation";
              icon = CheckCircle;
              color = "text-green-600 dark:text-green-400";
              break;
            case "BOOKING_REMINDER":
              type = "reminder";
              icon = Clock;
              color = "text-yellow-600 dark:text-yellow-400";
              break;
            default:
              type = "pending";
              icon = Clock;
              color = "text-yellow-600 dark:text-yellow-400";
          }

          activitiesList.push({
            id: notification.id,
            type,
            title: notification.title || "Notification",
            description: notification.message || "",
            time: new Date(notification.created_at),
            icon,
            color,
            actionUrl: notification.action_url || undefined,
          });
        });

        // 2. Propositions récentes (si pas déjà dans les notifications)
        const proposalsList = Array.isArray(proposalsData?.bookings) ? proposalsData.bookings : [];
        proposalsList
          .filter((p: any) => p.status === "PENDING" || p.status === "pending")
          .slice(0, 3)
          .forEach((proposal: any) => {
            // Vérifier si déjà dans les activités
            if (!activitiesList.some((a) => a.id === proposal.id)) {
              // Utiliser booking_date ou date selon la structure
              const proposalDate = proposal.booking_date || proposal.date || "date non définie";
              const proposalCreatedAt = proposal.created_at || proposal.createdAt || Date.now();
              
              activitiesList.push({
                id: `proposal-${proposal.id}`,
                type: "proposition",
                title: "Nouvelle proposition reçue",
                description: `Proposition pour le ${proposalDate}`,
                time: new Date(proposalCreatedAt),
                icon: ChefHat,
                color: "text-purple-600 dark:text-purple-400",
                actionUrl: `/dashboard/client/proposals`,
              });
            }
          });

        // 3. Bookings récents (si pas déjà dans les notifications)
        const bookingsList = Array.isArray(bookingsData?.bookings) ? bookingsData.bookings : [];
        bookingsList
          .filter((b: any) => b.status === "CONFIRMED" || b.status === "payment_pending" || b.payment_status === "PENDING")
          .slice(0, 3)
          .forEach((booking: any) => {
            // Vérifier si déjà dans les activités
            if (!activitiesList.some((a) => a.id === booking.id)) {
              // Utiliser booking_date ou date selon la structure
              const bookingDate = booking.booking_date || booking.date || "date non définie";
              const bookingCreatedAt = booking.created_at || booking.createdAt || Date.now();
              const isPending = booking.status === "payment_pending" || booking.payment_status === "PENDING";
              
              activitiesList.push({
                id: `booking-${booking.id}`,
                type: isPending ? "pending" : "confirmation",
                title: isPending ? "Réservation en attente de paiement" : "Réservation confirmée",
                description: `Réservation du ${bookingDate}`,
                time: new Date(bookingCreatedAt),
                icon: isPending ? Clock : CheckCircle,
                color: isPending
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-green-600 dark:text-green-400",
                actionUrl: `/dashboard/client/bookings/${booking.id}`,
              });
            }
          });

        // Trier par date (plus récent en premier) et limiter à 4
        activitiesList.sort((a, b) => b.time.getTime() - a.time.getTime());
        setActivities(activitiesList.slice(0, 4));
      } catch (error) {
        console.error("Erreur lors du chargement des activités:", error);
        setActivities([]);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadActivities();
    // Charger uniquement au montage du composant pour éviter les rechargements infinis
    // Les données sont chargées directement depuis l'API, pas depuis le store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Tableau de dépendances vide = chargement unique au montage

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="font-cera text-xl font-bold text-foreground mb-6">
          Dernières activités
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="font-cera text-xl font-bold text-foreground mb-6">
          Dernières activités
        </h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucune activité récente</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <h2 className="font-cera text-xl font-bold text-foreground mb-6">
        Dernières activités
      </h2>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent transition-all duration-200 hover:shadow-md"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
                  activity.type === "message" && "bg-blue-500/10 dark:bg-blue-500/20",
                  activity.type === "proposition" && "bg-purple-500/10 dark:bg-purple-500/20",
                  activity.type === "confirmation" && "bg-green-500/10 dark:bg-green-500/20",
                  activity.type === "pending" && "bg-yellow-500/10 dark:bg-yellow-500/20",
                  activity.type === "reminder" && "bg-yellow-500/10 dark:bg-yellow-500/20",
                  activity.type === "payment" && "bg-green-500/10 dark:bg-green-500/20"
                )}
              >
                <Icon className={`w-5 h-5 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground mb-1">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.time, { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

