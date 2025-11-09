"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Section CTA de conversion - Relance la conversion
 * Design élégant avec des couleurs douces et raffinées
 */
export function CTASection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border-t border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-trebuchet text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Prêt à goûter l'expérience ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Réservez aujourd'hui, savourez demain. Un chef privé, un moment
            unique.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 shadow-lg shadow-blue-500/30"
            >
              <Link href="/cooks">Trouver mon chef maintenant</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

