"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Cook } from "@/types";

interface CooksCarouselProps {
  cooks: Cook[];
}

/**
 * Carousel horizontal simple : 5 cartes au total, 3 visibles à la fois
 * Navigation par boutons pour voir les 2 autres cartes
 */
export function CooksCarousel({ cooks }: CooksCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCards = 3;
  const maxIndex = Math.max(0, cooks.length - visibleCards);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // Images différentes pour chaque chef
  const imageUrls = [
    "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&q=80",
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80",
    "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=400&q=80",
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80",
  ];

  return (
    <div className="relative w-full">
      {/* Boutons de navigation */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        disabled={currentIndex === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-background/90 hover:bg-background text-foreground shadow-lg backdrop-blur-sm disabled:opacity-30"
        aria-label="Chefs précédents"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        disabled={currentIndex >= maxIndex}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-background/90 hover:bg-background text-foreground shadow-lg backdrop-blur-sm disabled:opacity-30"
        aria-label="Chefs suivants"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Container avec overflow pour masquer les cartes non visibles */}
      <div className="overflow-hidden">
        <motion.div
          className="flex gap-8"
          animate={{
            x: `-${currentIndex * (100 / visibleCards)}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          style={{
            width: `${(cooks.length / visibleCards) * 100}%`,
          }}
        >
          {cooks.map((cook, index) => (
            <motion.div
              key={cook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 bg-card rounded-lg overflow-hidden border border-border shadow-lg hover:shadow-xl transition-shadow"
              style={{
                width: `${100 / visibleCards}%`,
              }}
            >
              <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden">
                <Image
                  src={cook.avatarUrl || imageUrls[index % imageUrls.length]}
                  alt={cook.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  unoptimized
                />
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-border shadow-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <span className="text-sm font-semibold">{cook.rating}</span>
                  {cook.reviewCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({cook.reviewCount})
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-cera text-xl font-semibold text-foreground mb-2">
                  {cook.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {cook.bio.substring(0, 100)}...
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {cook.specialties.slice(0, 2).map((specialty) => (
                    <span
                      key={specialty}
                      className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  À partir de {cook.pricePerPerson}€/personne
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

