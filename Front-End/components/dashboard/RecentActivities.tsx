"use client";

import { motion } from "framer-motion";
import { MessageSquare, CheckCircle, Clock, ChefHat } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Mock data - À remplacer par les vraies données
const activities = [
  {
    id: 1,
    type: "message",
    title: "Nouveau message de Sophie Dubois",
    description: "Je serais ravie de cuisiner pour vous ce week-end",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    id: 2,
    type: "proposition",
    title: "Proposition reçue",
    description: "Marie Martin a proposé ses services",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5h
    icon: ChefHat,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    id: 3,
    type: "confirmation",
    title: "Réservation confirmée",
    description: "Votre repas du 15 janvier est confirmé",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 1 jour
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
  },
  {
    id: 4,
    type: "pending",
    title: "Demande en attente",
    description: "En attente de propositions de cuisiniers",
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
  },
];

/**
 * Bloc des dernières activités
 * Liste chronologique des actions récentes
 */
export function RecentActivities() {
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
                  activity.type === "pending" && "bg-yellow-500/10 dark:bg-yellow-500/20"
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

