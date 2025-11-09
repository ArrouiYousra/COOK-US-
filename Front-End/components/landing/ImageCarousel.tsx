"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const carouselImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
    alt: "Chef cuisinant à domicile",
    title: "Cuisine d'exception",
    subtitle: "Des plats raffinés préparés chez vous",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80",
    alt: "Chef professionnel",
    title: "Expérience sur-mesure",
    subtitle: "Un menu adapté à vos goûts",
  },
  {
    id: 3,
    src: "/images/chef-de-cuisine-dans-un-restaurant-ajoutant-de-la-sauce-a-la-salade.jpg",
    alt: "Repas gastronomique",
    title: "Moment inoubliable",
    subtitle: "Transformez votre maison en restaurant étoilé",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    alt: "Service professionnel",
    title: "Service complet",
    subtitle: "Le chef s'occupe de tout",
  },
];

/**
 * Carousel moderne et élégant avec preview des images adjacentes
 * Design inspiré des meilleures pratiques UX
 */
export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
  };

  // Auto-play du carousel (pause au hover)
  useEffect(() => {
    if (!isAutoPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlaying]);

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Calcul des indices pour les images adjacentes
  const getAdjacentIndex = (offset: number) => {
    return (currentIndex + offset + carouselImages.length) % carouselImages.length;
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <div
      className="relative w-full max-w-6xl mx-auto"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Container principal avec preview des images adjacentes */}
      <div className="relative h-[500px] lg:h-[650px] xl:h-[700px] rounded-2xl overflow-hidden">
        {/* Images adjacentes (gauche et droite) - Preview subtile */}
        <div className="absolute inset-0 flex items-center justify-between px-2 lg:px-4 pointer-events-none z-10">
          {/* Image précédente (gauche) */}
          <motion.div
            className="w-[12%] h-[45%] rounded-xl overflow-hidden opacity-30 blur-sm"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 0.3, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={carouselImages[getAdjacentIndex(-1)].src}
              alt={carouselImages[getAdjacentIndex(-1)].alt}
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Image suivante (droite) */}
          <motion.div
            className="w-[12%] h-[45%] rounded-xl overflow-hidden opacity-30 blur-sm"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 0.3, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={carouselImages[getAdjacentIndex(1)].src}
              alt={carouselImages[getAdjacentIndex(1)].alt}
              fill
              className="object-cover"
            />
          </motion.div>
        </div>

        {/* Image principale au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.3 },
              }}
              className="relative w-[95%] lg:w-[75%] h-[90%] rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src={carouselImages[currentIndex].src}
                alt={carouselImages[currentIndex].alt}
                fill
                className="object-cover"
                style={{ objectPosition: "center 25%" }}
                sizes="(max-width: 768px) 95vw, 80vw"
                priority={currentIndex === 0}
              />
              {/* Overlay sombre pour améliorer la lisibilité du texte */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              
              {/* Contenu texte sur l'image avec fond semi-transparent */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative"
                >
                  {/* Fond semi-transparent derrière le texte pour meilleure lisibilité */}
                  <div className="absolute inset-0 bg-black/30 dark:bg-black/50 rounded-lg -m-4 blur-sm" />
                  <div className="relative">
                    <h3 className="font-trebuchet text-2xl lg:text-4xl font-bold text-white drop-shadow-lg mb-2">
                      {carouselImages[currentIndex].title}
                    </h3>
                    <p className="text-base lg:text-lg text-white/90 drop-shadow-md">
                      {carouselImages[currentIndex].subtitle}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Boutons de navigation - Design minimaliste */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background text-foreground shadow-lg backdrop-blur-sm"
          aria-label="Image précédente"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background text-foreground shadow-lg backdrop-blur-sm"
          aria-label="Image suivante"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Indicateurs de pagination - Design moderne */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="group relative"
            aria-label={`Aller à l'image ${index + 1}`}
          >
            <motion.div
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-blue-600"
                  : "w-2 bg-cookus-text/30 hover:bg-cookus-text/50"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
            {index === currentIndex && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute inset-0 bg-blue-600 rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Miniatures des images en bas - Navigation rapide */}
      <div className="flex items-center justify-center gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
        {carouselImages.map((image, index) => (
          <motion.button
            key={image.id}
            onClick={() => goToSlide(index)}
            className={`relative flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
              index === currentIndex
                ? "border-blue-600 scale-110 shadow-lg"
                : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
            }`}
            whileHover={{ scale: index === currentIndex ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
            />
            {index === currentIndex && (
              <motion.div
                className="absolute inset-0 bg-blue-600/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
