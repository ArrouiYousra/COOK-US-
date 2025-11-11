"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ImageCarousel } from "./ImageCarousel";
import { SearchBar } from "./SearchBar";
import { FadeInText } from "./AnimatedText";
import { Sparkles, Users, Clock } from "lucide-react";

/**
 * Hero Section - Section interactive et captivante
 * Avec carousel d'images, barre de recherche avancée, animations fluides
 */
export function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Générer les valeurs aléatoires une seule fois avec useMemo
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      randomX: Math.random() * 100,
      randomY: Math.random() * 100,
      randomDelay: Math.random() * 2,
      randomDuration: Math.random() * 3 + 2,
    }));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 lg:pt-24 bg-cookus-bg">
      {/* Background gradient overlay avec animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-cookus-gradient-from via-cookus-gradient-via to-cookus-gradient-to"
      />

      {/* Particules animées en arrière-plan */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
              initial={{
                x: `${particle.randomX}%`,
                y: `${particle.randomY}%`,
                opacity: 0.2,
              }}
              animate={{
                y: [`${particle.randomY}%`, `${(particle.randomY + 20) % 100}%`],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: particle.randomDuration,
                repeat: Infinity,
                delay: particle.randomDelay,
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isMounted ? "visible" : "hidden"}
          className="max-w-7xl mx-auto"
        >
          {/* Titre principal avec animations fluides */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.h1
              className="font-trebuchet text-4xl lg:text-5xl xl:text-6xl text-cookus-text font-bold mb-6 leading-tight"
              style={{
                fontFamily: '"Trebuchet MS", sans-serif',
                fontWeight: 700,
              }}
            >
              {/* Première ligne - Animation fluide unifiée */}
              <motion.div
                className="block mb-2 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1,
                  delay: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <motion.span className="inline-block">
                  Un{" "}
                  <motion.span
                    className="relative inline-block text-blue-400 dark:text-blue-400"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    chef privé
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        delay: 0.7,
                        duration: 0.8,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      style={{ transformOrigin: "left" }}
                    />
                  </motion.span>
                  , chez vous,
                </motion.span>
              </motion.div>

              {/* Deuxième ligne - Animation fluide unifiée */}
              <motion.div
                className="block overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1,
                  delay: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <motion.span className="inline-block">
                  pour un{" "}
                  <motion.span
                    className="relative inline-block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.8,
                      duration: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <motion.span
                      className="relative z-10"
                      animate={{
                        backgroundImage: [
                          "linear-gradient(90deg, rgb(96, 165, 250), rgb(147, 197, 253))",
                          "linear-gradient(90deg, rgb(147, 197, 253), rgb(196, 181, 253))",
                          "linear-gradient(90deg, rgb(196, 181, 253), rgb(96, 165, 250))",
                        ],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      moment inoubliable
                    </motion.span>
                    <motion.span
                      className="absolute inset-0 blur-sm opacity-40"
                      animate={{
                        backgroundImage: [
                          "linear-gradient(90deg, rgb(96, 165, 250), rgb(147, 197, 253))",
                          "linear-gradient(90deg, rgb(147, 197, 253), rgb(196, 181, 253))",
                          "linear-gradient(90deg, rgb(196, 181, 253), rgb(96, 165, 250))",
                        ],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      moment inoubliable
                    </motion.span>
                  </motion.span>
                </motion.span>
              </motion.div>
            </motion.h1>

            <FadeInText delay={0.3}>
              <p className="text-xl lg:text-2xl text-cookus-text/80 mb-6 max-w-3xl mx-auto">
                Réservez un chef qui vient cuisiner chez vous selon vos goûts et
                votre occasion
              </p>
            </FadeInText>
          </motion.div>

          {/* Barre de recherche avancée */}
          <motion.div variants={itemVariants} className="mb-12">
            <SearchBar />
          </motion.div>

          {/* Stats rapides */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-6 lg:gap-12 mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 text-cookus-text/80"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-lg">+1 000</p>
                <p className="text-sm">Clients ravis</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 text-cookus-text/80"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold text-lg">50+</p>
                <p className="text-sm">Chefs certifiés</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 text-cookus-text/80"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-lg">24/7</p>
                <p className="text-sm">Réservation</p>
              </div>
            </motion.div>
          </motion.div>

          {/* CTAs avec animations */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 border-0 shadow-lg shadow-blue-500/30"
              >
                <Link href="/auth/register/client">Réservez votre chef</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-cookus-text/20 text-cookus-text hover:bg-cookus-text/10 border-2 hover:border-blue-500 text-lg px-8 py-6"
              >
                <Link href="/auth/role">Je suis chef</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Carousel d'images */}
          <motion.div variants={itemVariants} className="mb-8">
            <ImageCarousel />
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}

