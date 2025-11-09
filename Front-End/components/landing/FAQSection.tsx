"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Comment sont sélectionnés les chefs ?",
    answer:
      "Tous nos chefs sont rigoureusement sélectionnés : vérification des diplômes, expérience professionnelle, et tests culinaires. Nous privilégions la passion, le professionnalisme et l'amour du partage culinaire.",
  },
  {
    question: "Que comprend le prix ?",
    answer:
      "Le prix comprend la préparation du repas, le service, et le nettoyage complet après le repas. Les ingrédients peuvent être inclus selon le forfait choisi ou apportés par le chef selon vos préférences.",
  },
  {
    question: "Que se passe-t-il si j'ai une allergie ?",
    answer:
      "Lors de la réservation, vous pouvez indiquer toutes vos allergies et restrictions alimentaires. Nos chefs sont formés pour adapter leurs menus en conséquence et garantir votre sécurité.",
  },
  {
    question: "Est-ce que le chef apporte ses ingrédients ?",
    answer:
      "Oui, selon le forfait choisi, le chef peut apporter tous les ingrédients nécessaires. Vous pouvez également choisir de fournir certains ingrédients si vous le souhaitez. Tout est précisé lors de la réservation.",
  },
  {
    question: "Combien de temps à l'avance dois-je réserver ?",
    answer:
      "Nous recommandons de réserver au moins 48h à l'avance pour garantir la disponibilité de votre chef préféré. Cependant, des réservations de dernière minute peuvent être possibles selon les disponibilités.",
  },
  {
    question: "Puis-je annuler ma réservation ?",
    answer:
      "Oui, vous pouvez annuler votre réservation jusqu'à 24h avant la date prévue sans frais. Au-delà, des frais d'annulation peuvent s'appliquer selon nos conditions générales.",
  },
];

/**
 * Section FAQ - Lève les dernières objections
 */
export function FAQSection() {
  return (
    <section
      id="faq"
      className="py-20 lg:py-32 bg-muted/30"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-trebuchet text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tout ce que vous devez savoir avant de réserver
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`item-${index}`}
                className="border-border"
              >
                <AccordionTrigger className="text-left font-cera font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

