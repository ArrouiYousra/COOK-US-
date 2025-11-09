"use client";

import { motion } from "framer-motion";
import { FileText, Calendar, ChefHat } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Publiez votre demande",
    description:
      "Décrivez ce que vous souhaitez manger, ce que vous avez dans votre frigo ou vos placards, votre budget, et indiquez si vous voulez que le cuisinier mette la table ou fasse la vaisselle.",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Calendar,
    title: "Recevez les propositions des cuisiniers",
    description:
      "Les cuisiniers proches et disponibles consultent votre demande et se proposent. Voyez leurs profils, spécialités, tarifs et notes, et échangez avec eux via la messagerie intégrée pour finaliser votre choix.",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: ChefHat,
    title: "Savourez votre repas",
    description:
      "Le jour venu, votre cuisinier arrive à l'heure, cuisine chez vous avec vos ingrédients, et peut également mettre la table ou faire la vaisselle. Profitez d'un repas sans stress 🍽️",
    color: "text-green-600 dark:text-green-400",
  },
];

/**
 * Section "Comment ça marche" - Simplifie le concept
 */
export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 lg:py-32 bg-background"
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
            Comment ça marche ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trois étapes simples pour un repas sans stress
          </p>
        </motion.div>

        {/* Timeline container */}
        <div className="relative">
          {/* Ligne de timeline élégante - commence sous la première icône, se termine sous la dernière */}
          <div className="hidden md:block absolute left-0 right-0" style={{ top: '64px', height: '1px' }}>
            {/* Calcul précis : grid 3 colonnes, icônes centrées dans chaque colonne */}
            {/* Première icône au centre de la première colonne (16.67%), dernière au centre de la dernière (83.33%) */}
            <div className="relative" style={{ 
              left: 'calc(16.67% - 24px)', 
              right: 'calc(16.67% - 24px)',
              width: 'calc(66.66% + 48px)'
            }}>
              {/* Ligne de fond subtile */}
              <div className="absolute inset-0 h-px bg-border/20 dark:bg-border/30" />
              
              {/* Ligne animée qui se dessine progressivement */}
              <motion.div
                className="absolute inset-0 h-px bg-gradient-to-r from-blue-500/60 via-purple-500/60 to-green-500/60"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.5,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.2,
                }}
                style={{ transformOrigin: "left" }}
              />
              
              {/* Points fixes sur la timeline */}
              {steps.map((step, index) => {
                const position = index === 0 ? '0%' : index === 1 ? '50%' : '100%';
                return (
                  <motion.div
                    key={`timeline-point-${index}`}
                    className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full border border-background z-10"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.6 + index * 0.3,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    style={{
                      left: position,
                      background: step.color.includes("blue") 
                        ? "rgb(59, 130, 246)" 
                        : step.color.includes("purple") 
                        ? "rgb(168, 85, 247)" 
                        : "rgb(34, 197, 94)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 60, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.4,
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                }}
                whileHover={{
                  y: -12,
                  scale: 1.02,
                  transition: { duration: 0.3, type: "spring" },
                }}
                className="text-center cursor-default relative group flex flex-col h-full"
              >
                {/* Icône au-dessus de la section avec animation élégante */}
                <div className="mb-6 flex items-center justify-center relative">
                  {/* Icône principale */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.4 + index * 0.3,
                      duration: 0.8,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    className="relative z-20"
                  >
                    <step.icon 
                      className={`w-12 h-12 ${step.color} transition-all duration-300`}
                      fill="none"
                      strokeWidth={2}
                    />
                  </motion.div>
                  
                </div>

                {/* Titre avec animation timeline */}
                <motion.h3
                  className="text-xl lg:text-2xl xl:text-3xl font-cera font-bold text-foreground mb-4 hover:text-blue-600 dark:hover:text-blue-400 min-h-[3.5rem] lg:min-h-[4rem] xl:min-h-[4.5rem] flex items-center justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.4 + 1,
                    duration: 0.5,
                  }}
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 },
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.4 + 1.1,
                      duration: 0.4,
                    }}
                    className="text-center"
                  >
                    {step.title}
                  </motion.span>
                </motion.h3>

                {/* Description avec animation timeline */}
                <motion.p
                  className="text-sm lg:text-base text-muted-foreground leading-relaxed flex-grow"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.4 + 1.4,
                    duration: 0.6,
                  }}
                  whileHover={{
                    color: "hsl(var(--foreground))",
                    transition: { duration: 0.2 },
                  }}
                >
                  {step.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Micro-vidéo - Optimisée avec lazy loading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border shadow-2xl bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  preload="none"
                >
                  <source src="/video.mp4" type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
            {/* Overlay subtil pour meilleure intégration */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

