"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Euro,
  Calendar,
  MessageSquare,
  Heart,
  ChefHat,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockCooks, mockReviews } from "@/mockData";
import { CookCalendar } from "@/components/dashboard/cooks/CookCalendar";
import { ReviewsSection } from "@/components/dashboard/cooks/ReviewsSection";
import { MakeProposalModal } from "@/components/dashboard/cooks/MakeProposalModal";
import { ShareProfile } from "@/components/dashboard/cooks/ShareProfile";

/**
 * Page de profil détaillé d'un cuisinier
 */
export default function CookProfilePage() {
  const params = useParams();
  const router = useRouter();
  const cookId = params.id as string;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Trouver le cuisinier
  const cook = mockCooks.find((c) => c.id === cookId);

  if (!cook) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Cuisinier introuvable</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/client/cooks">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  // Filtrer les avis pour ce cuisinier et ajouter les noms d'utilisateurs
  const cookReviews = mockReviews
    .filter((r) => r.cookId === cookId)
    .map((review) => ({
      ...review,
      userName: `Client ${review.userId.slice(0, 4)}`,
      userAvatar: undefined,
    }));

  return (
    <div className="space-y-8">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Retour
        </Button>
        <div className="flex items-center gap-2">
          <ShareProfile cookId={cookId} cookName={cook.name} />
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Profil principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Photo */}
          <div className="relative w-48 h-48 lg:w-64 lg:h-64 rounded-xl overflow-hidden flex-shrink-0">
            {cook.avatarUrl ? (
              <Image
                src={cook.avatarUrl}
                alt={cook.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {cook.name}
                </h1>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold text-foreground">
                      {cook.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    ({cook.reviewCount} avis)
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {cook.bio}
            </p>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Euro className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tarif moyen</p>
                  <p className="font-semibold text-foreground">
                    {cook.pricePerPerson} € / personne
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Capacité max</p>
                  <p className="font-semibold text-foreground">
                    {cook.maxGuests} personnes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Localisation</p>
                  <p className="font-semibold text-foreground">
                    {cook.location.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Expérience</p>
                  <p className="font-semibold text-foreground">10+ ans</p>
                </div>
              </div>
            </div>

            {/* Spécialités */}
            <div className="mb-6">
              <h3 className="font-cera text-lg font-semibold text-foreground mb-3">
                Spécialités culinaires
              </h3>
              <div className="flex flex-wrap gap-2">
                {cook.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-3 py-1 rounded-full bg-accent text-foreground text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsProposalModalOpen(true)}
                className="flex-1"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Faire une proposition
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link href={`/dashboard/client/requests/new?cook=${cookId}`}>
                  Publier une demande
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Disponibilités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <h2 className="font-cera text-2xl font-bold text-foreground mb-6">
          Disponibilités
        </h2>
        <CookCalendar cookId={cookId} />
      </motion.div>

      {/* Avis clients */}
      <ReviewsSection cookId={cookId} reviews={cookReviews} />

      {/* Modal de proposition */}
      <MakeProposalModal
        cookId={cookId}
        cookName={cook.name}
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
      />
    </div>
  );
}

