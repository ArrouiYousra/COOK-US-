"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const benefits = [
  "Visibilité sur une plateforme dédiée",
  "Autonomie et liberté dans votre travail",
  "Rémunération attractive",
  "Communauté de chefs passionnés",
];

/**
 * Section "Devenez chef Cook US" - Recrute des chefs partenaires
 */
export function BecomeCookSection() {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-trebuchet text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Devenez chef Cook US
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez une communauté de chefs passionnés, et vivez de votre
              art. Transformez votre passion en métier.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-foreground">
                    {benefit}
                  </span>
                </motion.li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/auth/role">Postuler comme chef</Link>
            </Button>
          </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden border border-border shadow-xl">
                  <Image
                    src="/images/chef-cuisinant-dans-la-cuisine-en-portant-une-tenue-professionnelle.jpg"
                    alt="Chef professionnel"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cookus-bg/80 via-transparent to-transparent" />
                </div>
              </motion.div>
        </div>
      </div>
    </section>
  );
}

