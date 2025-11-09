"use client";

import { motion } from "framer-motion";
import { FileText, Calendar, Heart, Euro } from "lucide-react";

const stats = [
  {
    label: "Demandes actives",
    value: "3",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  {
    label: "Réservations confirmées",
    value: "12",
    icon: Calendar,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
  },
  {
    label: "Chefs favoris",
    value: "5",
    icon: Heart,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
  },
  {
    label: "Total dépensé",
    value: "1 240 €",
    icon: Euro,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
  },
];

/**
 * Cartes de statistiques rapides
 */
export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

