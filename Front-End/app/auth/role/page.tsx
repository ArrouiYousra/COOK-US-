"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Utensils, ChefHat, Home } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import type { UserRole } from "@/types";

/**
 * Page de choix de rôle (Client ou Cuisinier)
 * Première étape du processus d'inscription
 */
export default function RoleSelectionPage() {
  const router = useRouter();
  const { setSelectedRole } = useAuthStore();

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    router.push(`/auth/register/${role.toLowerCase()}`);
  };

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Header avec navigation */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto"
      >
         {/* Titre */}
         <motion.div variants={itemVariants} className="text-center mb-12">
           <h1 className="font-trebuchet text-4xl lg:text-5xl font-bold mb-4 text-blue-400 dark:text-blue-400">
             Bienvenue sur Cook US
           </h1>
           <p className="text-lg text-muted-foreground">
             Choisissez votre rôle pour commencer
           </p>
         </motion.div>

        {/* Cartes de sélection */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Carte Client */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-card border-2 border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-blue-500 hover:shadow-xl min-h-[400px]"
            onClick={() => handleRoleSelection("CLIENT")}
          >
            {/* Image de fond - prend toute la carte */}
            <div className="absolute inset-0">
              <Image
                src="/images/client sign up.jpg"
                alt="Client"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
            
            {/* Contenu par-dessus l'image */}
            <div className="relative z-10 p-8 h-full flex flex-col items-center justify-end text-center min-h-[400px] pb-12">
              <h2 className="font-cera text-3xl font-bold text-white mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Client
              </h2>
              <p className="text-white/90 mb-8 text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                Je souhaite me faire cuisiner à domicile
              </p>
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                Choisir
              </Button>
            </div>
          </motion.div>

          {/* Carte Cuisinier */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-card border-2 border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-purple-500 hover:shadow-xl min-h-[400px]"
            onClick={() => handleRoleSelection("COOK")}
          >
            {/* Image de fond - prend toute la carte */}
            <div className="absolute inset-0">
              <Image
                src="/images/cuisinier sign up.jpg"
                alt="Cuisinier"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
            
            {/* Contenu par-dessus l'image */}
            <div className="relative z-10 p-8 h-full flex flex-col items-center justify-end text-center min-h-[400px] pb-12">
              <h2 className="font-cera text-3xl font-bold text-white mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Cuisinier
              </h2>
              <p className="text-white/90 mb-8 text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                Je veux proposer mes services de cuisine
              </p>
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
              >
                Choisir
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Lien vers login */}
        <motion.div variants={itemVariants} className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
              onClick={() => router.push("/auth/login")}
            >
              Se connecter
            </Button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

