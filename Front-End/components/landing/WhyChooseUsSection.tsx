"use client";

import { motion } from "framer-motion";
import { Utensils, CreditCard, Shield, Clock, Sparkles, Calendar } from "lucide-react";

const benefits = [
  {
    icon: Utensils,
    title: "Expérience sur-mesure à domicile",
    description: "Un menu personnalisé selon vos goûts, vos ingrédients et votre occasion spéciale.",
  },
  {
    icon: CreditCard,
    title: "Réservation et paiement sécurisés",
    description: "Réservez en quelques clics, avec des transactions 100% sécurisées et protégées.",
  },
  {
    icon: Shield,
    title: "Chefs vérifiés et passionnés",
    description: "Tous nos cuisiniers sont soigneusement sélectionnés, vérifiés et expérimentés.",
  },
  {
    icon: Clock,
    title: "Gain de temps",
    description: "Le cuisinier s'occupe de tout : préparation, cuisson, mise en table… vous profitez simplement.",
  },
  {
    icon: Sparkles,
    title: "Nettoyage inclus",
    description: "Après le repas, votre cuisine est rangée et nettoyée.",
  },
  {
    icon: Calendar,
    title: "Flexibilité totale",
    description: "Choisissez vos horaires et services : repas express, dîners familiaux ou événements spéciaux, selon vos besoins.",
  },
];

/**
 * Section "Pourquoi choisir Cook US ?" - Démontre la valeur unique
 */
export function WhyChooseUsSection() {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
              <h2 className="font-trebuchet text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Pourquoi choisir Cook US ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Vivez la gastronomie autrement, cuisinée chez vous, juste pour vous.
              </p>
        </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-cera text-lg font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
      </div>
    </section>
  );
}

