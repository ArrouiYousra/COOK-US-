"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { mockCooks } from "@/mockData";
import { CooksCarousel } from "./CooksCarousel";

/**
 * Section "Les chefs Cook US" - Crée la confiance
 * Affiche 3 cartes fixes + un carousel pour les autres chefs
 */
export function CooksSection() {
  const featuredCooks = mockCooks.slice(0, 3);
  const remainingCooks = mockCooks.slice(3);

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-trebuchet text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Les chefs Cook US
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Nos chefs sont triés sur le volet, passionnés, et amoureux du
            partage culinaire
          </p>
          <p className="text-sm text-muted-foreground italic">
            "Transformez votre maison en restaurant étoilé"
          </p>
        </motion.div>

        {/* 3 cartes fixes des chefs vedettes */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {featuredCooks.map((cook, index) => (
            <motion.div
              key={cook.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
              whileHover={{
                y: -12,
                scale: 1.02,
                transition: { duration: 0.3, type: "spring" },
              }}
              className="bg-card rounded-lg overflow-hidden border border-border shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden">
                <motion.div
                  initial={{ scale: 1.1 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={cook.avatarUrl || "/images/chef-feminin-versant-soigneusement-la-sauce-sur-le-plat.jpg"}
                    alt={cook.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    unoptimized
                    priority={index === 0}
                  />
                </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                    className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-border shadow-sm"
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <span className="text-sm font-semibold">{cook.rating}</span>
                    {cook.reviewCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({cook.reviewCount})
                      </span>
                    )}
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.6 }}
                  className="p-6"
                >
                  <h3 className="font-cera text-xl font-semibold text-foreground mb-2">
                    {cook.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {cook.bio.substring(0, 100)}...
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cook.specialties.slice(0, 2).map((specialty, specIndex) => (
                      <motion.span
                        key={specialty}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.2 + 0.7 + specIndex * 0.1 }}
                        className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full"
                      >
                        {specialty}
                      </motion.span>
                    ))}
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.9 }}
                    className="text-sm font-semibold text-foreground"
                  >
                    À partir de {cook.pricePerPerson}€/personne
                  </motion.p>
                </motion.div>
              </motion.div>
            ))}
        </div>

        {/* Carousel pour les autres chefs */}
        {remainingCooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <CooksCarousel cooks={remainingCooks} />
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/cooks">Découvrir tous nos chefs</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

