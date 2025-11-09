"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

/**
 * Message de bienvenue personnalisé avec CTA
 */
export function WelcomeMessage() {
  const { user } = useAuthStore();
  const firstName = user?.firstName || "Utilisateur";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-blue-600/5 via-blue-500/5 to-blue-600/5 dark:from-blue-600/10 dark:via-blue-500/10 dark:to-blue-600/10 rounded-2xl p-6 lg:p-8 border border-border"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Prêt à savourer un nouveau repas chez vous ?
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white flex-shrink-0 w-full sm:w-auto"
        >
          <Link href="/dashboard/client/requests/new" className="flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Créer une nouvelle demande
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

