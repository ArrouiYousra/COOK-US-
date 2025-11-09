"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import { mockReviews, mockUsers } from "@/mockData";

const testimonials = [
  {
    id: "1",
    name: "Sophie Martin",
    role: "Famille de 4",
    rating: 5,
    comment:
      "Une expérience incroyable ! Le chef a préparé un repas d'exception pour notre anniversaire de mariage. Tout était parfait, du menu au service.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  },
  {
    id: "2",
    name: "Pierre Dubois",
    role: "Dîner d'affaires",
    rating: 5,
    comment:
      "Parfait pour impressionner mes clients. Service professionnel, cuisine raffinée. Je recommande vivement Cook US !",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  },
  {
    id: "3",
    name: "Marie Leclerc",
    role: "Soirée entre amis",
    rating: 5,
    comment:
      "On a passé une soirée mémorable ! Le chef était adorable, la cuisine délicieuse. Plus besoin d'aller au restaurant !",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  },
];

/**
 * Section Témoignages clients - Preuve sociale
 */
export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
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
            Ils ont vécu l'expérience Cook US
          </h2>
          <p className="text-lg text-muted-foreground">
            Découvrez ce que nos clients pensent de nos chefs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-card rounded-lg p-6 border border-border shadow-lg"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "{testimonial.comment}"
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-cera font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

